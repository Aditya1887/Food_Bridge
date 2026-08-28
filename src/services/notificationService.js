import { supabase } from '../lib/supabase';

/**
 * Service to manage notifications
 */
export const notificationService = {
  /**
   * Fetch notifications for a user
   */
  async getUserNotifications(userId, limit = 20) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('getUserNotifications notice:', err.message);
      return [];
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.warn('getUnreadCount notice:', err.message);
      return 0;
    }
  },

  /**
   * Create a notification
   */
  async createNotification({ userId, title, message, type = 'info', relatedId = null }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message: message || '',
          type,
          related_id: relatedId,
          is_read: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('createNotification notice:', err.message);
      return null;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('markAsRead notice:', err.message);
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('markAllAsRead notice:', err.message);
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('deleteNotification notice:', err.message);
      return false;
    }
  },

  /**
   * Notify about a new food request
   */
  async notifyNewRequest(donorId, receiverName, foodName, requestId) {
    return this.createNotification({
      userId: donorId,
      title: `New food request from ${receiverName}`,
      message: `${receiverName} has requested "${foodName}". Review and accept or decline.`,
      type: 'request',
      relatedId: requestId,
    });
  },

  /**
   * Notify request acceptance
   */
  async notifyRequestAccepted(receiverId, donorName, foodName, requestId) {
    return this.createNotification({
      userId: receiverId,
      title: `Your request was accepted! 🎉`,
      message: `${donorName} accepted your request for "${foodName}". Pickup will be arranged.`,
      type: 'success',
      relatedId: requestId,
    });
  },

  /**
   * Notify request rejection
   */
  async notifyRequestRejected(receiverId, foodName, requestId) {
    return this.createNotification({
      userId: receiverId,
      title: `Request update`,
      message: `Your request for "${foodName}" was not accepted. Browse other available food items.`,
      type: 'info',
      relatedId: requestId,
    });
  },

  /**
   * Notify pickup assigned
   */
  async notifyPickupAssigned(receiverId, foodName, otpCode, pickupId) {
    return this.createNotification({
      userId: receiverId,
      title: `Pickup assigned — OTP: ${otpCode}`,
      message: `Pickup for "${foodName}" is assigned. Share OTP ${otpCode} with the donor at pickup.`,
      type: 'pickup',
      relatedId: pickupId,
    });
  },

  /**
   * Notify pickup completed
   */
  async notifyPickupCompleted(userId, foodName, pickupId) {
    return this.createNotification({
      userId,
      title: `Pickup completed! 🎉`,
      message: `"${foodName}" has been successfully collected. Thank you for making a difference!`,
      type: 'success',
      relatedId: pickupId,
    });
  },
};
