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
  async createPickupRecord({ requestId, foodId, donorId, receiverId, pickupLocation, latitude, longitude, scheduledTime }) {
    try {
      const otpCode = this.generateOTP();

      const payload = {
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
      };

      const { data, error } = await supabase
        .from('pickup_records')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('createPickupRecord error:', err);
      throw err;
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

      const { data, error } = await supabase
        .from('pickup_records')
        .update(updates)
        .eq('id', pickupId)
        .select()
        .single();

      if (error) throw error;

      // If completed, also update the request and food item
      if (newStatus === 'completed' && data) {
        await supabase
          .from('food_requests')
          .update({ status: 'completed' })
          .eq('id', data.request_id);

        await supabase
          .from('food_items')
          .update({ status: 'collected' })
          .eq('id', data.food_id);
      }

      return data;
    } catch (err) {
      console.error('updatePickupStatus error:', err);
      throw err;
    }
  },

  /**
   * Verify OTP for a pickup
   */
  async verifyOTP(pickupId, inputOTP) {
    try {
      const { data: pickup, error } = await supabase
        .from('pickup_records')
        .select('otp_code, status')
        .eq('id', pickupId)
        .single();

      if (error) throw error;
      if (!pickup) throw new Error('Pickup record not found');

      if (pickup.otp_code !== inputOTP) {
        return { success: false, message: 'Invalid OTP. Please try again.' };
      }

      // OTP matches — mark as verified
      await this.updatePickupStatus(pickupId, 'verified');
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
