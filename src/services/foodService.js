import { supabase } from '../lib/supabase';

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
   */
  async createFoodItem(foodData) {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .insert([foodData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('createFoodItem error:', err);
      throw err;
    }
  },

  /**
   * Update an existing Food Item listing
   */
  async updateFoodItem(id, updates) {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('updateFoodItem error:', err);
      throw err;
    }
  },

  /**
   * Delete / Cancel a Food Item listing
   */
  async deleteFoodItem(id) {
    try {
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
  async createFoodRequest({ foodId, receiverId, donorId, requestedServings, notes }) {
    try {
      const payload = {
        food_id: foodId,
        receiver_id: receiverId,
        donor_id: donorId,
        status: 'pending',
        requested_servings: requestedServings || 1,
        notes: notes || '',
      };

      const { data, error } = await supabase
        .from('food_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Update food_items status to 'requested' so it disappears from available food immediately
      await supabase
        .from('food_items')
        .update({ status: 'requested' })
        .eq('id', foodId);

      return data;
    } catch (err) {
      console.error('createFoodRequest error:', err);
      throw err;
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
        if (newStatus === 'accepted') {
          await supabase.from('food_items').update({ status: 'reserved' }).eq('id', foodId);
        } else if (newStatus === 'completed') {
          await supabase.from('food_items').update({ status: 'collected' }).eq('id', foodId);
        } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
          await supabase.from('food_items').update({ status: 'available' }).eq('id', foodId);
        }
      }

      return data;
    } catch (err) {
      console.error('updateRequestStatus error:', err);
      throw err;
    }
  },
};
