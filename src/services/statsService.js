import { supabase } from '../lib/supabase';

/**
 * Service to fetch platform-wide statistics for public pages
 */
export const statsService = {
  /**
   * Get aggregate platform statistics
   * Used by HowItWorks, AboutUs, Impact pages
   */
  async getPlatformStats() {
    try {
      // Fetch all food items for aggregate stats
      const { data: foodItems } = await supabase
        .from('food_items')
        .select('servings, food_weight_kg, status');

      // Fetch user counts
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: donorCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'donor');

      const { count: receiverCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'receiver');

      // Fetch completed requests
      const { count: completedRequests } = await supabase
        .from('food_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const items = foodItems || [];
      const totalMeals = items.reduce((acc, i) => acc + (Number(i.servings) || 0), 0);
      const totalKg = items.reduce((acc, i) => acc + (Number(i.food_weight_kg) || 0), 0);
      const totalDonations = items.length;
      const co2Saved = (totalKg * 2.98).toFixed(1);

      return {
        totalMeals,
        totalKg: parseFloat(totalKg.toFixed(1)),
        totalDonations,
        totalUsers: totalUsers || 0,
        donorCount: donorCount || 0,
        receiverCount: receiverCount || 0,
        completedRequests: completedRequests || 0,
        co2Saved: parseFloat(co2Saved),
      };
    } catch (err) {
      console.warn('getPlatformStats notice:', err.message);
      // Return fallback values so pages still render nicely
      return {
        totalMeals: 0,
        totalKg: 0,
        totalDonations: 0,
        totalUsers: 0,
        donorCount: 0,
        receiverCount: 0,
        completedRequests: 0,
        co2Saved: 0,
      };
    }
  },

  /**
   * Admin: Get all users
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('getAllUsers notice:', err.message);
      return [];
    }
  },

  /**
   * Admin: Get all food items
   */
  async getAllFoodItems() {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with donor info
      if (data && data.length > 0) {
        const donorIds = [...new Set(data.map(i => i.donor_id).filter(Boolean))];
        if (donorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, organization_name, email')
            .in('id', donorIds);

          if (profiles) {
            const map = new Map(profiles.map(p => [p.id, p]));
            return data.map(item => ({
              ...item,
              donor: map.get(item.donor_id) || { full_name: 'Unknown' },
            }));
          }
        }
      }

      return data || [];
    } catch (err) {
      console.warn('getAllFoodItems notice:', err.message);
      return [];
    }
  },

  /**
   * Admin: Get all food requests
   */
  async getAllFoodRequests() {
    try {
      const { data, error } = await supabase
        .from('food_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set([
          ...data.map(r => r.receiver_id),
          ...data.map(r => r.donor_id),
        ].filter(Boolean))];

        const foodIds = [...new Set(data.map(r => r.food_id).filter(Boolean))];

        let userMap = new Map();
        let foodMap = new Map();

        if (userIds.length > 0) {
          const { data: users } = await supabase.from('profiles').select('id, full_name, email, role').in('id', userIds);
          if (users) userMap = new Map(users.map(u => [u.id, u]));
        }

        if (foodIds.length > 0) {
          const { data: foods } = await supabase.from('food_items').select('id, food_name').in('id', foodIds);
          if (foods) foodMap = new Map(foods.map(f => [f.id, f]));
        }

        return data.map(r => ({
          ...r,
          receiver: userMap.get(r.receiver_id) || { full_name: 'Receiver' },
          donor: userMap.get(r.donor_id) || { full_name: 'Donor' },
          food: foodMap.get(r.food_id) || { food_name: 'Food Item' },
        }));
      }

      return data || [];
    } catch (err) {
      console.warn('getAllFoodRequests notice:', err.message);
      return [];
    }
  },

  /**
   * Admin: Get all contact messages
   */
  async getContactMessages() {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('getContactMessages notice:', err.message);
      return [];
    }
  },

  /**
   * Admin: Toggle user verification
   */
  async toggleUserVerification(userId, isVerified) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: isVerified })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('toggleUserVerification error:', err);
      throw err;
    }
  },
};
