import { supabase } from '../lib/supabase';

/**
 * Service to manage User Profiles, Notifications, and Activity with Supabase
 */
export const profileService = {
  /**
   * Fetch a user profile by ID
   */
  async getProfile(userId) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('profileService.getProfile notice:', err.message);
      return null;
    }
  },

  /**
   * Update user profile information
   */
  async updateProfile(userId, updates) {
    if (!userId) throw new Error('User ID is required');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('profileService.updateProfile error:', err);
      throw err;
    }
  },

  /**
   * Fetch user notifications (active requests, confirmations, listings)
   */
  async getUserNotifications(userId, role = 'receiver') {
    if (!userId) return [];
    try {
      if (role === 'receiver') {
        // Step 1: Fetch requests
        const { data: requests, error } = await supabase
          .from('food_requests')
          .select('*')
          .eq('receiver_id', userId)
          .order('requested_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        if (!requests || requests.length === 0) return [];

        // Step 2: Fetch related food items and donor profiles
        const foodIds = [...new Set(requests.map((r) => r.food_id).filter(Boolean))];
        const donorIds = [...new Set(requests.map((r) => r.donor_id).filter(Boolean))];

        let foodMap = new Map();
        let donorMap = new Map();

        if (foodIds.length > 0) {
          const { data: foods } = await supabase.from('food_items').select('id, food_name, pickup_location').in('id', foodIds);
          if (foods) foodMap = new Map(foods.map((f) => [f.id, f]));
        }
        if (donorIds.length > 0) {
          const { data: donors } = await supabase.from('profiles').select('id, full_name, organization_name').in('id', donorIds);
          if (donors) donorMap = new Map(donors.map((d) => [d.id, d]));
        }

        return requests.map((r) => {
          const food = foodMap.get(r.food_id);
          return {
            id: r.id,
            title: r.status === 'accepted'
              ? `Your request for "${food?.food_name || 'Food Item'}" was accepted!`
              : r.status === 'completed'
              ? `Food pickup completed for "${food?.food_name || 'Food Item'}"`
              : `Request for "${food?.food_name || 'Food Item'}" is pending confirmation`,
            time: r.requested_at ? new Date(r.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            status: r.status,
            read: false,
          };
        });
      } else {
        // Step 1: Fetch incoming requests for donor
        const { data: incoming, error } = await supabase
          .from('food_requests')
          .select('*')
          .eq('donor_id', userId)
          .order('requested_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        if (!incoming || incoming.length === 0) return [];

        // Step 2: Fetch related food items and receiver profiles
        const foodIds = [...new Set(incoming.map((r) => r.food_id).filter(Boolean))];
        const receiverIds = [...new Set(incoming.map((r) => r.receiver_id).filter(Boolean))];

        let foodMap = new Map();
        let receiverMap = new Map();

        if (foodIds.length > 0) {
          const { data: foods } = await supabase.from('food_items').select('id, food_name').in('id', foodIds);
          if (foods) foodMap = new Map(foods.map((f) => [f.id, f]));
        }
        if (receiverIds.length > 0) {
          const { data: receivers } = await supabase.from('profiles').select('id, full_name').in('id', receiverIds);
          if (receivers) receiverMap = new Map(receivers.map((r) => [r.id, r]));
        }

        return incoming.map((r) => {
          const food = foodMap.get(r.food_id);
          const receiver = receiverMap.get(r.receiver_id);
          return {
            id: r.id,
            title: `New request from ${receiver?.full_name || 'Receiver'} for "${food?.food_name || 'Food Item'}" (${r.requested_servings || 1} portions)`,
            time: r.requested_at ? new Date(r.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            status: r.status,
            read: false,
          };
        });
      }
    } catch (err) {
      console.warn('profileService.getUserNotifications notice:', err.message);
      return [];
    }
  },

  /**
   * Fetch impact stats for a donor or receiver
   */
  async getUserStats(userId, role = 'receiver') {
    if (!userId) return { mealsShared: 0, kgSaved: 0, activeRequests: 0 };
    try {
      if (role === 'donor') {
        const { data: foods } = await supabase
          .from('food_items')
          .select('servings, food_weight_kg, status')
          .eq('donor_id', userId);

        const items = foods || [];
        const meals = items.reduce((acc, item) => acc + (Number(item.servings) || 0), 0);
        const kg = items.reduce((acc, item) => acc + (Number(item.food_weight_kg) || 0), 0);
        const active = items.filter((i) => i.status === 'available' || i.status === 'requested').length;

        return {
          mealsShared: meals,
          kgSaved: kg,
          activeListings: active,
        };
      } else {
        const { data: requests } = await supabase
          .from('food_requests')
          .select('requested_servings, status')
          .eq('receiver_id', userId);

        const items = requests || [];
        const meals = items.filter((r) => r.status === 'completed' || r.status === 'accepted')
          .reduce((acc, r) => acc + (Number(r.requested_servings) || 1), 0);
        const pending = items.filter((r) => r.status === 'pending').length;

        return {
          mealsReceived: meals,
          pendingRequests: pending,
          totalRequests: items.length,
        };
      }
    } catch (err) {
      console.warn('profileService.getUserStats notice:', err.message);
      return { mealsShared: 0, kgSaved: 0, activeRequests: 0 };
    }
  },
};
