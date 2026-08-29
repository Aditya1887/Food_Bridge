import { supabase } from '../lib/supabase';

/**
 * Convert a food photo file to an optimized base64 data URI (max 600px)
 * Guarantees food image support even if storage policies block bucket upload
 */
export async function fileToOptimizedDataUri(file, maxDimension = 600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a food image to Supabase Storage
 * Returns the public URL of the uploaded image or optimized data URI
 */
export async function uploadFoodImage(donorId, file) {
  if (!donorId || !file) return null;
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${donorId}/${Date.now()}_food.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('food-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    } else {
      console.warn('Food image bucket upload notice:', uploadError.message);
    }
  } catch (err) {
    console.warn('uploadFoodImage notice:', err.message);
  }

  // Guaranteed fallback: return optimized data URI so custom food photo is never lost
  try {
    return await fileToOptimizedDataUri(file);
  } catch (convErr) {
    console.warn('Image conversion fallback notice:', convErr.message);
    return null;
  }
}

/**
 * Service to manage Food Listings and Requests with Supabase
 */
export const foodService = {
  // ── FOOD ITEMS (LISTINGS) ──

  /**
   * Fetch public available/active food items for Receivers
   * Only returns food items with status = 'available'
   */
  async getAvailableFoodItems({ category, searchQuery } = {}) {
    try {
      let query = supabase
        .from('food_items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.ilike('category', `%${category}%`);
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`food_name.ilike.%${q}%,description.ilike.%${q}%,pickup_location.ilike.%${q}%`);
      }

      const { data: foodData, error } = await query;
      if (error) throw error;

      let items = foodData || [];

      // Attach donor profile info
      const donorIds = [...new Set(items.map((c) => c.donor_id).filter(Boolean))];
      if (donorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, organization_name, phone, avatar_url, city')
          .in('id', donorIds);

        if (profiles && profiles.length > 0) {
          const profileMap = new Map(profiles.map((p) => [p.id, p]));
          items = items.map((item) => ({
            ...item,
            donor: profileMap.get(item.donor_id) || { full_name: 'Community Donor' },
          }));
        }
      }

      return items;
    } catch (err) {
      console.warn('getAvailableFoodItems error:', err.message);
      return [];
    }
  },

  /**
   * Fetch all food items listed by a specific Donor
   */
  async getDonorFoodItems(donorId) {
    if (!donorId) return [];
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('donor_id', donorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('getDonorFoodItems notice:', err.message);
      return [];
    }
  },

  /**
   * Create a new Food Item listing in public.food_items
   * Includes resilient self-healing for schema cache differences (e.g. allergens, storage_condition)
   */
  async createFoodItem(foodData) {
    let payload = { ...foodData };
    let attempts = 0;
    const maxAttempts = 8;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('food_items')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        const msg = err.message || '';
        // Check for missing column error: "Could not find the 'xyz' column of 'food_items' in the schema cache"
        const schemaMatch =
          msg.match(/Could not find the '([^']+)' column/i) ||
          msg.match(/column "([^"]+)" of relation/i) ||
          msg.match(/column "([^"]+)" does not exist/i);

        if (schemaMatch && schemaMatch[1] && payload[schemaMatch[1]] !== undefined) {
          const badCol = schemaMatch[1];
          console.warn(`[foodService] Column "${badCol}" not found in food_items table. Retrying without it.`);
          delete payload[badCol];
          continue; // Retry insertion without the missing column
        }

        console.error('createFoodItem error:', err);
        throw err;
      }
    }
  },

  /**
   * Update an existing Food Item listing with self-healing retry
   */
  async updateFoodItem(id, updates) {
    let payload = { ...updates };
    let attempts = 0;
    const maxAttempts = 8;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('food_items')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        const msg = err.message || '';
        const schemaMatch =
          msg.match(/Could not find the '([^']+)' column/i) ||
          msg.match(/column "([^"]+)" of relation/i) ||
          msg.match(/column "([^"]+)" does not exist/i);

        if (schemaMatch && schemaMatch[1] && payload[schemaMatch[1]] !== undefined) {
          const badCol = schemaMatch[1];
          console.warn(`[foodService] Column "${badCol}" not found in food_items table. Retrying update without it.`);
          delete payload[badCol];
          continue;
        }

        console.error('updateFoodItem error:', err);
        throw err;
      }
    }
  },

  /**
   * Delete / Cancel a Food Item listing with safe cascade
   */
  async deleteFoodItem(id) {
    try {
      // 1. Clean up or dissociate related pickup records and food requests if any exist
      try {
        await supabase.from('pickup_records').delete().eq('food_id', id);
      } catch (pErr) {
        console.warn('Cascade pickup delete notice:', pErr.message);
      }
      try {
        await supabase.from('food_requests').delete().eq('food_id', id);
      } catch (rErr) {
        console.warn('Cascade request delete notice:', rErr.message);
      }

      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('deleteFoodItem error:', err);
      throw err;
    }
  },


  // ── FOOD REQUESTS ──

  /**
   * Create a request for a food item (by a Receiver)
   * Automatically changes food item status from 'available' to 'requested'
   */
  async createFoodRequest({
    foodId,
    receiverId,
    donorId,
    requestedServings,
    notes,
    fulfillmentType,
    deliveryAddress,
    deliveryPhone,
  }) {
    let payload = {
      food_id: foodId,
      receiver_id: receiverId,
      donor_id: donorId,
      status: 'pending',
      requested_servings: requestedServings || 1,
      notes: notes || '',
      fulfillment_type: fulfillmentType || 'receiver_pickup',
      delivery_address: deliveryAddress || null,
      delivery_phone: deliveryPhone || null,
    };

    let attempts = 0;
    const maxAttempts = 6;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('food_requests')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // Update food_items status to 'requested' so it reflects in real-time
        try {
          await supabase
            .from('food_items')
            .update({ status: 'requested' })
            .eq('id', foodId);
        } catch (foodErr) {
          console.warn('Could not update food item status directly:', foodErr.message);
        }

        return data;
      } catch (err) {
        const msg = err.message || '';
        const schemaMatch =
          msg.match(/Could not find the '([^']+)' column/i) ||
          msg.match(/column "([^"]+)" of relation/i) ||
          msg.match(/column "([^"]+)" does not exist/i);

        if (schemaMatch && schemaMatch[1] && payload[schemaMatch[1]] !== undefined) {
          const badCol = schemaMatch[1];
          console.warn(`[foodService] Column "${badCol}" not found in food_requests table. Retrying without it.`);
          delete payload[badCol];
          continue;
        }

        console.error('createFoodRequest error:', err);
        throw err;
      }
    }
  },

  /**
   * Fetch all requests created by a specific Receiver
   */
  async getReceiverRequests(receiverId) {
    if (!receiverId) return [];
    try {
      const { data: requests, error } = await supabase
        .from('food_requests')
        .select('*')
        .eq('receiver_id', receiverId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const foodIds = [...new Set(requests.map((r) => r.food_id).filter(Boolean))];
      const donorIds = [...new Set(requests.map((r) => r.donor_id).filter(Boolean))];

      let foodMap = new Map();
      let donorMap = new Map();

      if (foodIds.length > 0) {
        const { data: foods } = await supabase.from('food_items').select('*').in('id', foodIds);
        if (foods) foodMap = new Map(foods.map((f) => [f.id, f]));
      }

      if (donorIds.length > 0) {
        const { data: donors } = await supabase.from('profiles').select('*').in('id', donorIds);
        if (donors) donorMap = new Map(donors.map((d) => [d.id, d]));
      }

      return requests.map((req) => ({
        ...req,
        food: foodMap.get(req.food_id) || { food_name: 'Food Donation' },
        donor: donorMap.get(req.donor_id) || { full_name: 'Donor' },
      }));
    } catch (err) {
      console.warn('getReceiverRequests notice:', err.message);
      return [];
    }
  },

  /**
   * Fetch all incoming requests for food items created by a Donor
   */
  async getDonorRequests(donorId) {
    if (!donorId) return [];
    try {
      const { data: requests, error } = await supabase
        .from('food_requests')
        .select('*')
        .eq('donor_id', donorId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const foodIds = [...new Set(requests.map((r) => r.food_id).filter(Boolean))];
      const receiverIds = [...new Set(requests.map((r) => r.receiver_id).filter(Boolean))];

      let foodMap = new Map();
      let receiverMap = new Map();

      if (foodIds.length > 0) {
        const { data: foods } = await supabase.from('food_items').select('*').in('id', foodIds);
        if (foods) foodMap = new Map(foods.map((f) => [f.id, f]));
      }

      if (receiverIds.length > 0) {
        const { data: receivers } = await supabase.from('profiles').select('*').in('id', receiverIds);
        if (receivers) receiverMap = new Map(receivers.map((r) => [r.id, r]));
      }

      return requests.map((req) => ({
        ...req,
        food: foodMap.get(req.food_id) || { food_name: 'Food Item' },
        receiver: receiverMap.get(req.receiver_id) || { full_name: 'Receiver' },
      }));
    } catch (err) {
      console.warn('getDonorRequests notice:', err.message);
      return [];
    }
  },

  /**
   * Update request status (e.g. 'accepted', 'rejected', 'cancelled', 'completed')
   */
  async updateRequestStatus(requestId, foodId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('food_requests')
        .update({ status: newStatus })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      if (foodId) {
        try {
          if (newStatus === 'accepted') {
            await supabase.from('food_items').update({ status: 'reserved' }).eq('id', foodId);
          } else if (newStatus === 'completed') {
            await supabase.from('food_items').update({ status: 'collected' }).eq('id', foodId);
          } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
            // Check if other active requests exist for this food item
            const { data: otherRequests } = await supabase
              .from('food_requests')
              .select('id, status')
              .eq('food_id', foodId)
              .neq('id', requestId)
              .in('status', ['pending', 'accepted']);

            if (!otherRequests || otherRequests.length === 0) {
              await supabase.from('food_items').update({ status: 'available' }).eq('id', foodId);
            } else if (otherRequests.some((r) => r.status === 'accepted')) {
              await supabase.from('food_items').update({ status: 'reserved' }).eq('id', foodId);
            } else {
              await supabase.from('food_items').update({ status: 'requested' }).eq('id', foodId);
            }
          }
        } catch (foodUpdateErr) {
          console.warn('Secondary food_items status update notice:', foodUpdateErr.message);
        }
      }

      return data;
    } catch (err) {
      console.error('updateRequestStatus error:', err);
      throw err;
    }
  },
};
