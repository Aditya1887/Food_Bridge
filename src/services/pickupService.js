import { supabase } from '../lib/supabase';

/**
 * Service to manage Pickup Records with OTP verification
 */
export const pickupService = {
  /**
   * Generate a random 4-digit OTP
   */
  generateOTP() {
    return String(Math.floor(1000 + Math.random() * 9000));
  },

  /**
   * Create a pickup record after a food request is accepted
   */
  async createPickupRecord({
    requestId,
    foodId,
    donorId,
    receiverId,
    pickupLocation,
    latitude,
    longitude,
    scheduledTime,
    fulfillmentType,
    deliveryAddress,
  }) {
    const otpCode = this.generateOTP();

    let payload = {
      request_id: requestId,
      food_id: foodId,
      donor_id: donorId,
      receiver_id: receiverId,
      otp_code: otpCode,
      status: 'assigned',
      pickup_location: pickupLocation || '',
      latitude: latitude || null,
      longitude: longitude || null,
      scheduled_time: scheduledTime || new Date().toISOString(),
      fulfillment_type: fulfillmentType || 'receiver_pickup',
      delivery_address: deliveryAddress || null,
    };

    let attempts = 0;
    const maxAttempts = 6;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('pickup_records')
          .insert([payload])
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
          console.warn(`[pickupService] Column "${badCol}" not found in pickup_records. Retrying without it.`);
          delete payload[badCol];
          continue;
        }

        console.error('createPickupRecord error:', err);
        throw err;
      }
    }
  },

  /**
   * Get all pickup records for a donor
   */
  async getDonorPickups(donorId) {
    if (!donorId) return [];
    try {
      const { data, error } = await supabase
        .from('pickup_records')
        .select('*')
        .eq('donor_id', donorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Enrich with food and receiver info
      const foodIds = [...new Set(data.map(p => p.food_id).filter(Boolean))];
      const receiverIds = [...new Set(data.map(p => p.receiver_id).filter(Boolean))];

      let foodMap = new Map();
      let receiverMap = new Map();

      if (foodIds.length > 0) {
        const { data: foods } = await supabase.from('food_items').select('id, food_name, image_url, pickup_location').in('id', foodIds);
        if (foods) foodMap = new Map(foods.map(f => [f.id, f]));
      }

      if (receiverIds.length > 0) {
        const { data: receivers } = await supabase.from('profiles').select('id, full_name, phone, organization_name').in('id', receiverIds);
        if (receivers) receiverMap = new Map(receivers.map(r => [r.id, r]));
      }

      return data.map(p => ({
        ...p,
        food: foodMap.get(p.food_id) || { food_name: 'Food Item' },
        receiver: receiverMap.get(p.receiver_id) || { full_name: 'Receiver' },
      }));
    } catch (err) {
      console.warn('getDonorPickups notice:', err.message);
      return [];
    }
  },

  /**
   * Get all pickup records for a receiver
   */
  async getReceiverPickups(receiverId) {
    if (!receiverId) return [];
    try {
      const { data, error } = await supabase
        .from('pickup_records')
        .select('*')
        .eq('receiver_id', receiverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const foodIds = [...new Set(data.map(p => p.food_id).filter(Boolean))];
      const donorIds = [...new Set(data.map(p => p.donor_id).filter(Boolean))];

      let foodMap = new Map();
      let donorMap = new Map();

      if (foodIds.length > 0) {
        const { data: foods } = await supabase.from('food_items').select('id, food_name, image_url, pickup_location').in('id', foodIds);
        if (foods) foodMap = new Map(foods.map(f => [f.id, f]));
      }

      if (donorIds.length > 0) {
        const { data: donors } = await supabase.from('profiles').select('id, full_name, phone, organization_name').in('id', donorIds);
        if (donors) donorMap = new Map(donors.map(d => [d.id, d]));
      }

      return data.map(p => ({
        ...p,
        food: foodMap.get(p.food_id) || { food_name: 'Food Item' },
        donor: donorMap.get(p.donor_id) || { full_name: 'Donor' },
      }));
    } catch (err) {
      console.warn('getReceiverPickups notice:', err.message);
      return [];
    }
  },

  /**
   * Update pickup status
   */
  async updatePickupStatus(pickupId, newStatus) {
    try {
      const updates = { status: newStatus };

      if (newStatus === 'arrived') {
        updates.arrived_at = new Date().toISOString();
      } else if (newStatus === 'verified') {
        updates.verified_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      let { data, error } = await supabase
        .from('pickup_records')
        .update(updates)
        .eq('id', pickupId)
        .select()
        .maybeSingle();

      if (!data) {
        const altRes = await supabase
          .from('pickup_records')
          .update(updates)
          .eq('request_id', pickupId)
          .select()
          .maybeSingle();
        data = altRes.data;
      }

      // If completed, also update the request and food item
      if (newStatus === 'completed' && data) {
        if (data.request_id) {
          await supabase
            .from('food_requests')
            .update({ status: 'completed' })
            .eq('id', data.request_id);
        }

        if (data.food_id) {
          await supabase
            .from('food_items')
            .update({ status: 'collected' })
            .eq('id', data.food_id);
        }
      }

      return data;
    } catch (err) {
      console.error('updatePickupStatus error:', err);
      throw err;
    }
  },

  /**
   * Verify OTP for a pickup (supports pickup id or request id)
   */
  async verifyOTP(pickupId, inputOTP) {
    try {
      let { data: pickup } = await supabase
        .from('pickup_records')
        .select('id, otp_code, status, request_id, food_id')
        .eq('id', pickupId)
        .maybeSingle();

      if (!pickup) {
        const alt = await supabase
          .from('pickup_records')
          .select('id, otp_code, status, request_id, food_id')
          .eq('request_id', pickupId)
          .maybeSingle();
        pickup = alt.data;
      }

      if (!pickup) {
        // Look up by inputOTP among active pickups
        const byOtp = await supabase
          .from('pickup_records')
          .select('id, otp_code, status, request_id, food_id')
          .eq('otp_code', String(inputOTP).trim())
          .neq('status', 'completed')
          .limit(1)
          .maybeSingle();
        pickup = byOtp.data;
      }

      if (!pickup) {
        return { success: false, message: 'Pickup record not found.' };
      }

      if (pickup.otp_code && String(pickup.otp_code).trim() !== String(inputOTP).trim()) {
        return { success: false, message: 'Invalid OTP code. Please check with the receiver.' };
      }

      // OTP matches — mark as completed
      await this.updatePickupStatus(pickup.id, 'completed');
      return { success: true, message: 'OTP verified successfully!' };
    } catch (err) {
      console.error('verifyOTP error:', err);
      throw err;
    }
  },

  /**
   * Get all pickup records (admin)
   */
  async getAllPickups() {
    try {
      const { data, error } = await supabase
        .from('pickup_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('getAllPickups notice:', err.message);
      return [];
    }
  },
};
