import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth, checkIsAdmin } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { foodService, uploadFoodImage } from '../../services/foodService';
import { pickupService } from '../../services/pickupService';
import { notificationService } from '../../services/notificationService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import { CountUp, SpotlightCard, ShinyText } from '../../components/AnimatedUI';
import './DonorDashboard.css';

const PRESET_DISH_IMAGES = {
  biryani: '/assets/dish_biryani.jpg',
  dal_rice: '/assets/dish_dal_rice.jpg',
  pasta: '/assets/dish_pasta.jpg',
  fruits: '/assets/dish_fruits.jpg',
  bread: '/assets/dish_bread_packets.jpg',
  mixed_veg: '/assets/dish_mixed_veg.jpg',
  idli: '/assets/dish_idli_pack.jpg',
  chole_puri: '/assets/dish_chole_puri.jpg',
  milk: '/assets/dish_milk_packets.jpg',
};

const DONOR_FAQS = [
  {
    q: 'How quickly will an NGO or receiver collect my food donation?',
    a: 'Once you accept an incoming food request or book a pickup slot, partner NGOs typically arrive within 45–90 minutes depending on your location and chosen time slot.',
  },
  {
    q: 'What are the food safety and packaging standards?',
    a: 'Food should be freshly cooked or unexpired, packed in clean, food-grade containers or sealed foil pouches, and labeled with cooking date and dietary type (Vegetarian / Non-Vegetarian).',
  },
  {
    q: 'How does the OTP verification process work?',
    a: 'When an NGO or volunteer driver arrives to collect the food, they will provide a 4-digit verification OTP code displayed on their app. Enter this OTP into your Donor Dashboard to verify and mark the delivery as completed.',
  },
  {
    q: 'Can I cancel or edit a food listing after publishing?',
    a: 'Yes. You can edit servings, location, and description or cancel any listing that has not yet been collected directly from the "My Food Listings" tab.',
  },
  {
    q: 'Do I get an official Food Rescue Certificate for my donations?',
    a: 'Yes! Every completed donation generates a verified FoodBridge Impact Receipt & Certificate in your "Donations History" tab that you can view, print, or share.',
  },
];

export default function DonorDashboard({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, role, isAdmin, logout, refreshProfile } = useAuth();
  const isUserAdmin = isAdmin || role === 'admin' || checkIsAdmin(user, profile, role);

  const avatarUrl = getAvatarUrl(profile, user);
  const avatarInitials = getUserInitials(profile, user);

  // Active navigation tab
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'donations' | 'requests' | 'schedule' | 'history' | 'impact' | 'support'
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Modal states
  const [activeQuickModal, setActiveQuickModal] = useState(null); // 'donate' | 'schedule' | 'ngo' | null
  const [donationStep, setDonationStep] = useState(1); // 1: Fulfillment, 2: Meal Details, 3: Photo & Location, 4: Review
  const [selectedDonationDetail, setSelectedDonationDetail] = useState(null);
  const [editingDonation, setEditingDonation] = useState(null);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // View preferences
  const [listingsViewMode, setListingsViewMode] = useState('grid'); // 'grid' | 'table'

  // Live backend data
  const [rawFoodItems, setRawFoodItems] = useState([]);
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [registeredNgos, setRegisteredNgos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Filter & Search states
  const [donationsSearchQuery, setDonationsSearchQuery] = useState('');
  const [donationsStatusFilter, setDonationsStatusFilter] = useState('all');
  const [donationsCategoryFilter, setDonationsCategoryFilter] = useState('all');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Forms
  const [otpInputs, setOtpInputs] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const [donationForm, setDonationForm] = useState({
    title: '',
    description: '',
    category: 'Cooked Meals',
    quantity: '',
    servings: '10',
    weight: '2.5',
    location: '',
    dishType: 'biryani',
    allergens: '',
    storage: 'Room Temperature',
    fulfillment_type: 'receiver_pickup',
  });

  const [editForm, setEditForm] = useState({
    food_name: '',
    description: '',
    category: 'Cooked Meals',
    quantity: '',
    servings: '10',
    food_weight_kg: '2.5',
    pickup_location: '',
    dishType: 'biryani',
    fulfillment_type: 'receiver_pickup',
  });

  const [pickupForm, setPickupForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: 'Morning (09:00 AM - 12:00 PM)',
    ngoName: '',
    specialNotes: '',
  });

  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
  });
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const showToast = (message, type = 'success', duration = 4000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => {
        setToastMessage('');
      }, duration);
    }
  };

  // ── Load User & Supabase Data on Mount ──
  const loadUserData = async () => {
    if (!user?.id) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      // 1. Fetch user's real food items from food_items table
      const foodItems = await foodService.getDonorFoodItems(user.id);
      setRawFoodItems(foodItems || []);

      const formattedDonations = (foodItems || []).map((d) => ({
        id: d.id,
        raw: d,
        title: d.food_name,
        description: d.description || '',
        category: d.category || 'Cooked Meals',
        quantity: d.quantity || `${d.servings} servings`,
        servings: Number(d.servings) || 10,
        food_weight_kg: Number(d.food_weight_kg) || 2.5,
        status: d.status,
        statusLabel:
          d.status === 'available'
            ? 'Available'
            : d.status === 'requested'
            ? 'Requested'
            : d.status === 'reserved'
            ? 'Reserved'
            : d.status === 'collected'
            ? 'Completed'
            : d.status,
        statusType:
          d.status === 'collected'
            ? 'completed'
            : d.status === 'reserved'
            ? 'scheduled'
            : d.status === 'requested'
            ? 'requested'
            : 'pending',
        location: d.pickup_location || 'Main Kitchen Drop Point',
        date: d.created_at
          ? new Date(d.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Today',
        time: d.created_at
          ? new Date(d.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '12:00 PM',
        image: d.image_url || '/assets/dish_biryani.jpg',
      }));
      setDonations(formattedDonations);

      // 2. Fetch user's pickups via pickupService & scheduled pickups table
      try {
        const userPickups = await pickupService.getDonorPickups(user.id);
        let scheduledData = [];
        try {
          const { data: spData } = await supabase
            .from('pickups')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (spData) scheduledData = spData;
        } catch (e) {
          console.warn('Scheduled pickups query notice:', e.message);
        }

        const formattedScheduled = scheduledData.map((sp) => ({
          id: sp.id,
          isScheduledNgo: true,
          status: sp.status || 'Scheduled',
          scheduled_time: sp.time_slot,
          pickup_date: sp.pickup_date,
          time_slot: sp.time_slot,
          ngo_name: sp.ngo_name,
          reference_code: sp.reference_code,
          pickup_location: sp.pickup_location || profile?.address || 'Main Entrance',
          food: { food_name: sp.ngo_name ? `${sp.ngo_name} Pickup` : 'NGO Collection' },
          receiver: { organization_name: sp.ngo_name || 'Partner NGO' },
        }));

        setPickups([...(userPickups || []), ...formattedScheduled]);
      } catch (pickupErr) {
        console.warn('Pickups fetch notice:', pickupErr.message);
        setPickups([]);
      }

      // 3. Fetch incoming food requests from receivers
      const requests = await foodService.getDonorRequests(user.id);
      setIncomingRequests(requests || []);

      // 4. Fetch registered partner NGOs / Community Receivers from profiles
      try {
        const { data: ngoProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, organization_name, city, phone')
          .or('role.eq.receiver,organization_name.not.is.null')
          .limit(20);

        if (ngoProfiles && ngoProfiles.length > 0) {
          const formattedNgos = ngoProfiles.map((p) => ({
            id: p.id,
            name: p.organization_name || p.full_name || 'Community Partner Organization',
            city: p.city || '',
            phone: p.phone || '',
          }));
          setRegisteredNgos(formattedNgos);
          setPickupForm((prev) => ({
            ...prev,
            ngoName: prev.ngoName || formattedNgos[0]?.name || 'Partner NGO Foundation',
          }));
        } else {
          const defaultPartners = [
            { id: '1', name: 'Community Food Bank', city: 'Local Area' },
            { id: '2', name: 'Youth Relief Network', city: 'Metro Area' },
            { id: '3', name: 'Hope & Warmth Shelter', city: 'Regional Center' },
          ];
          setRegisteredNgos(defaultPartners);
          setPickupForm((prev) => ({
            ...prev,
            ngoName: prev.ngoName || defaultPartners[0].name,
          }));
        }
      } catch (ngoErr) {
        console.warn('NGOs fetch notice:', ngoErr.message);
      }
    } catch (err) {
      console.warn('DonorDashboard fetch notice:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  // ── Realtime multi-table subscriptions ──
  useEffect(() => {
    if (!user?.id) return;

    // 1. Food requests incoming to donor
    const requestChannel = supabase
      .channel(`donor_requests_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_requests',
          filter: `donor_id=eq.${user.id}`,
        },
        () => loadUserData()
      )
      .subscribe();

    // 2. Donor food items updates
    const foodChannel = supabase
      .channel(`donor_food_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_items',
          filter: `donor_id=eq.${user.id}`,
        },
        () => loadUserData()
      )
      .subscribe();

    // 3. Pickup records handoff updates
    const pickupChannel = supabase
      .channel(`donor_pickups_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_records',
          filter: `donor_id=eq.${user.id}`,
        },
        () => loadUserData()
      )
      .subscribe();

    // 4. Scheduled NGO pickups
    const scheduledPickupChannel = supabase
      .channel(`donor_scheduled_pickups_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickups',
          filter: `user_id=eq.${user.id}`,
        },
        () => loadUserData()
      )
      .subscribe();

    // 5. Notifications
    const notifChannel = supabase
      .channel(`donor_notifs_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => loadUserData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(pickupChannel);
      supabase.removeChannel(scheduledPickupChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id]);

  // Global Escape key listener to dismiss active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveQuickModal(null);
        setSelectedDonationDetail(null);
        setEditingDonation(null);
        setViewingCertificate(null);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute User Display Information
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Donor');

  const firstName = displayName.split(' ')[0] || 'Donor';
  const displayEmail = user?.email || profile?.email || 'Donor Account';
  const displayRole = profile?.role || user?.user_metadata?.role || 'Donor';

  // Compute Dynamic Impact Metrics
  const totalDonationsCount = donations.length;
  const completedDonationsList = donations.filter(
    (d) => d.status === 'collected' || d.status === 'completed'
  );
  const activeDonationsList = donations.filter(
    (d) => d.status === 'available' || d.status === 'requested' || d.status === 'reserved'
  );

  const totalMealsCount = donations.reduce(
    (acc, curr) => acc + (Number(curr.servings) || 0),
    0
  );
  const totalKgCount = donations
    .reduce((acc, curr) => acc + (Number(curr.food_weight_kg) || 0), 0)
    .toFixed(1);
  const totalCO2Count = (parseFloat(totalKgCount) * 2.98).toFixed(1);
  const totalTreesEquivalent = (parseFloat(totalKgCount) / 20).toFixed(1);
  const totalCarKmEquivalent = (parseFloat(totalCO2Count) * 2.4).toFixed(0);

  // Compute Dynamic Donor Standing Level & Milestone Targets
  const computeDonorLevel = (meals) => {
    if (meals >= 100) return { level: 4, title: 'Guardian of Hope', badge: '👑 Level 4: Guardian of Hope' };
    if (meals >= 50) return { level: 3, title: 'Community Pillar', badge: '🌱 Level 3: Community Pillar' };
    if (meals >= 10) return { level: 2, title: 'Hunger Hero', badge: '🌿 Level 2: Hunger Hero' };
    return { level: 1, title: 'Green Contributor', badge: '🍃 Level 1: Green Contributor' };
  };

  const donorLevelInfo = computeDonorLevel(totalMealsCount);

  const MILESTONE_TIERS = [10, 25, 50, 100, 250, 500, 1000];
  const nextMilestoneTarget = MILESTONE_TIERS.find((t) => t > totalMealsCount) || (totalMealsCount + 50);
  const mealsRemainingToMilestone = Math.max(0, nextMilestoneTarget - totalMealsCount);
  const milestoneProgressPercent = Math.min(100, Math.max(8, Math.round((totalMealsCount / nextMilestoneTarget) * 100)));

  // ── Compute Active Fulfillment for the Live Fulfillment Window ──
  // Check incomingRequests for any active accepted request
  const activeAcceptedRequest = incomingRequests.find(
    (r) => r.status === 'accepted' || r.status === 'in_progress' || r.status === 'arrived'
  );

  // Check pickups for any active pickup record
  const activePickupRecord = pickups.find(
    (p) =>
      p &&
      !p.isScheduledNgo &&
      p.status &&
      p.status.toLowerCase() !== 'completed' &&
      p.status.toLowerCase() !== 'cancelled' &&
      p.status.toLowerCase() !== 'scheduled'
  );

  // Find corresponding pickup record if we have an active accepted request
  const matchedPickupForAccepted = activeAcceptedRequest
    ? pickups.find(
        (p) =>
          p.request_id === activeAcceptedRequest.id ||
          p.id === activeAcceptedRequest.id ||
          p.food_id === activeAcceptedRequest.food_id
      )
    : null;

  const activePickup = activeAcceptedRequest
    ? {
        id: matchedPickupForAccepted?.id || activeAcceptedRequest.id,
        pickup_record_id: matchedPickupForAccepted?.id,
        request_id: activeAcceptedRequest.id,
        food_id: activeAcceptedRequest.food_id,
        status: matchedPickupForAccepted?.status || activeAcceptedRequest.status || 'assigned',
        fulfillment_type:
          matchedPickupForAccepted?.fulfillment_type ||
          activeAcceptedRequest.fulfillment_type ||
          activeAcceptedRequest.food?.fulfillment_type ||
          'receiver_pickup',
        pickup_location:
          matchedPickupForAccepted?.pickup_location ||
          activeAcceptedRequest.food?.pickup_location ||
          profile?.address ||
          'Main Kitchen Entry',
        delivery_address:
          matchedPickupForAccepted?.delivery_address ||
          activeAcceptedRequest.delivery_address ||
          activeAcceptedRequest.receiver?.address ||
          '',
        food: matchedPickupForAccepted?.food || activeAcceptedRequest.food || {
          food_name: 'Food Donation',
          quantity: `${activeAcceptedRequest.requested_servings || 10} servings`,
          servings: activeAcceptedRequest.requested_servings || 10,
        },
        receiver: matchedPickupForAccepted?.receiver || activeAcceptedRequest.receiver || {
          full_name: 'Community Recipient',
          organization_name: 'Community Center',
        },
        otp_code: matchedPickupForAccepted?.otp_code || null,
      }
    : activePickupRecord
    ? {
        ...activePickupRecord,
        id: activePickupRecord.id,
        pickup_record_id: activePickupRecord.id,
        request_id: activePickupRecord.request_id || activePickupRecord.id,
        food_id: activePickupRecord.food_id,
        status: activePickupRecord.status || 'assigned',
        fulfillment_type:
          activePickupRecord.fulfillment_type ||
          activePickupRecord.food?.fulfillment_type ||
          'receiver_pickup',
        pickup_location:
          activePickupRecord.pickup_location ||
          profile?.address ||
          'Main Kitchen Entry',
        delivery_address:
          activePickupRecord.delivery_address ||
          activePickupRecord.receiver?.address ||
          '',
        food: activePickupRecord.food || {
          food_name: 'Food Donation',
          quantity: `${activePickupRecord.food?.servings || 10} servings`,
          servings: activePickupRecord.food?.servings || 10,
        },
        receiver: activePickupRecord.receiver || {
          full_name: 'Community Recipient',
          organization_name: 'Community Center',
        },
        otp_code: activePickupRecord.otp_code || null,
      }
    : null;

  const pendingRequestsList = incomingRequests.filter((r) => r.status === 'pending');

  // ── Handle OTP Verification by Donor ──
  const handleVerifyOTP = async (targetId) => {
    const entered = (
      otpInputs[targetId] ||
      otpInputs[activePickup?.id] ||
      otpInputs[activePickup?.request_id] ||
      otpInputs[activePickup?.pickup_record_id] ||
      ''
    ).trim();

    if (!entered || entered.length !== 4) {
      showToast('Please enter the 4-digit OTP provided by the receiver.', 'error');
      return;
    }

    const pickupIdToUse = activePickup?.pickup_record_id || activePickup?.id || targetId;
    const reqIdToUse = activePickup?.request_id || targetId;
    const foodIdToUse = activePickup?.food_id;

    try {
      // 1. Verify OTP with pickupService
      const res = await pickupService.verifyOTP(pickupIdToUse, entered);
      if (!res.success) {
        showToast(res.message || 'Invalid OTP code. Please check with the receiver.', 'error');
        return;
      }

      // 2. Also ensure status updates on food_requests and food_items tables
      if (reqIdToUse) {
        await supabase.from('food_requests').update({ status: 'completed' }).eq('id', reqIdToUse);
      }
      if (foodIdToUse) {
        await supabase.from('food_items').update({ status: 'collected' }).eq('id', foodIdToUse);
      }

      showToast('🎉 OTP verified! Food delivery completed and window closed.', 'success', 6000);
      setOtpInputs({});
      await loadUserData();
    } catch (err) {
      console.warn('Verify OTP fallback notice:', err.message);
      try {
        if (pickupIdToUse) await pickupService.updatePickupStatus(pickupIdToUse, 'completed');
        if (reqIdToUse) await supabase.from('food_requests').update({ status: 'completed' }).eq('id', reqIdToUse);
        if (foodIdToUse) await supabase.from('food_items').update({ status: 'collected' }).eq('id', foodIdToUse);
        showToast('🎉 Delivery verified and marked as completed.', 'success', 6000);
        setOtpInputs({});
        await loadUserData();
      } catch (fallbackErr) {
        showToast(fallbackErr.message || 'Failed to verify OTP.', 'error');
      }
    }
  };

  const handleNavClick = (navId) => {
    setMobileMenuOpen(false);
    if (navId === 'settings') {
      setAvatarPickerOpen(true);
      return;
    }
    setActiveNav(navId);
    if (navId === 'logout') {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onNavigate) onNavigate('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    if (onNavigate) onNavigate('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Create Modal with default address and step 1
  const handleOpenCreateModal = () => {
    setDonationStep(1);
    setDonationForm({
      title: '',
      description: '',
      category: 'Cooked Meals',
      quantity: '',
      servings: '10',
      weight: '2.5',
      location: profile?.address || '',
      dishType: 'biryani',
      allergens: '',
      storage: 'Room Temperature',
      fulfillment_type: 'receiver_pickup',
    });
    setImageFile(null);
    setActiveQuickModal('donate');
  };

  // ── Handle New Food Listing Submission ──
  const handleCreateDonation = async (e) => {
    if (e) e.preventDefault();
    if (!donationForm.title.trim()) {
      showToast('Please enter the food title.', 'error');
      setDonationStep(2);
      return;
    }

    const servingsNum = parseInt(donationForm.servings, 10);
    const weightNum = parseFloat(donationForm.weight);

    if (isNaN(servingsNum) || servingsNum < 1) {
      showToast('Please enter a valid servings count (at least 1).', 'error');
      setDonationStep(2);
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      showToast('Please enter a valid weight (greater than 0 kg).', 'error');
      setDonationStep(2);
      return;
    }

    if (!donationForm.location.trim()) {
      showToast('Please enter the pickup location.', 'error');
      setDonationStep(3);
      return;
    }

    setSubmitting(true);

    let chosenImage =
      PRESET_DISH_IMAGES[donationForm.dishType] || '/assets/dish_biryani.jpg';

    // Upload real image if user selected one
    if (imageFile && user?.id) {
      try {
        const uploadedUrl = await uploadFoodImage(user.id, imageFile);
        if (uploadedUrl) chosenImage = uploadedUrl;
      } catch (uploadErr) {
        console.warn('Image upload notice:', uploadErr.message);
      }
    }

    // Coordinate determination for map display
    const cityCoords = {
      mumbai: { lat: 19.076, lng: 72.8777 },
      delhi: { lat: 28.6139, lng: 77.209 },
      bengaluru: { lat: 12.9716, lng: 77.5946 },
      pune: { lat: 18.5204, lng: 73.8567 },
      hyderabad: { lat: 17.385, lng: 78.4867 },
      kolkata: { lat: 22.5726, lng: 88.3639 },
    };

    let itemLat = profile?.latitude;
    let itemLng = profile?.longitude;
    if (!itemLat || !itemLng) {
      const userCity = (profile?.city || '').toLowerCase();
      const matchedCity = Object.keys(cityCoords).find((c) =>
        userCity.includes(c)
      );
      if (matchedCity) {
        itemLat = cityCoords[matchedCity].lat + (Math.random() - 0.5) * 0.02;
        itemLng = cityCoords[matchedCity].lng + (Math.random() - 0.5) * 0.02;
      } else {
        itemLat = 19.076 + (Math.random() - 0.5) * 0.02;
        itemLng = 72.8777 + (Math.random() - 0.5) * 0.02;
      }
    }

    // Payload for food_items table
    const foodItemPayload = {
      donor_id: user?.id,
      food_name: donationForm.title.trim(),
      description: donationForm.description.trim() || '',
      category: donationForm.category || 'Cooked Meals',
      quantity: donationForm.quantity.trim() || `${servingsNum} servings`,
      quantity_unit: 'servings',
      servings: servingsNum,
      food_weight_kg: weightNum,
      pickup_location:
        donationForm.location.trim() || profile?.address || 'Main Kitchen Drop Point',
      latitude: itemLat,
      longitude: itemLng,
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time: 'Today (Flexible)',
      status: 'available',
      allergens: donationForm.allergens.trim() || null,
      storage_condition: donationForm.storage || 'Room Temperature',
      fulfillment_type: donationForm.fulfillment_type || 'receiver_pickup',
      image_url: chosenImage,
    };

    try {
      if (user?.id) {
        await foodService.createFoodItem(foodItemPayload);
      }

      showToast(
        '🎉 Food listing published! Receivers and partner NGOs have been alerted.',
        'success',
        5000
      );
      setActiveQuickModal(null);
      setDonationStep(1);
      setDonationForm({
        title: '',
        description: '',
        category: 'Cooked Meals',
        quantity: '',
        servings: '10',
        weight: '2.5',
        location: '',
        dishType: 'biryani',
        allergens: '',
        storage: 'Room Temperature',
        fulfillment_type: 'receiver_pickup',
      });
      setImageFile(null);
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Error creating food donation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Edit Donation ──
  const handleOpenEditDonation = (item) => {
    const raw = item.raw || item;
    setEditingDonation(raw);
    setEditForm({
      food_name: raw.food_name || item.title || '',
      description: raw.description || '',
      category: raw.category || 'Cooked Meals',
      quantity: raw.quantity || `${raw.servings || 10} servings`,
      servings: String(raw.servings || 10),
      food_weight_kg: String(raw.food_weight_kg || 2.5),
      pickup_location: raw.pickup_location || item.location || '',
      dishType: 'biryani',
      fulfillment_type: raw.fulfillment_type || 'receiver_pickup',
    });
    setEditImageFile(null);
  };

  const handleSaveEditDonation = async (e) => {
    e.preventDefault();
    if (!editingDonation?.id) return;

    const servingsNum = parseInt(editForm.servings, 10);
    const weightNum = parseFloat(editForm.food_weight_kg);

    if (isNaN(servingsNum) || servingsNum < 1) {
      showToast('Please enter a valid servings count (at least 1).', 'error');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      showToast('Please enter a valid weight (greater than 0 kg).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = editingDonation.image_url;
      if (editImageFile && user?.id) {
        const uploaded = await uploadFoodImage(user.id, editImageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const updates = {
        food_name: editForm.food_name.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        servings: servingsNum,
        food_weight_kg: weightNum,
        quantity: editForm.quantity.trim() || `${servingsNum} servings`,
        pickup_location: editForm.pickup_location.trim(),
        fulfillment_type: editForm.fulfillment_type || 'receiver_pickup',
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      await foodService.updateFoodItem(editingDonation.id, updates);
      showToast('Food listing updated successfully!', 'success');
      setEditingDonation(null);
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Failed to update listing.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Delete / Cancel Donation ──
  const handleDeleteDonation = async (foodId) => {
    if (!window.confirm('Are you sure you want to remove this food listing?')) return;
    try {
      await foodService.deleteFoodItem(foodId);
      showToast('Food listing removed.', 'success');
      if (selectedDonationDetail?.id === foodId) setSelectedDonationDetail(null);
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  // ── Handle Schedule Pickup Submission ──
  const handleSchedulePickup = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const refCode = `#FB${Math.floor(10000 + Math.random() * 90000)}`;

    const newPickupPayload = {
      user_id: user?.id || null,
      pickup_date: pickupForm.date,
      time_slot: pickupForm.timeSlot,
      ngo_name: pickupForm.ngoName,
      reference_code: refCode,
      status: 'Scheduled',
    };

    try {
      if (user?.id) {
        await supabase.from('pickups').insert([newPickupPayload]);
      }

      showToast(
        `Pickup scheduled with ${pickupForm.ngoName}! Reference: ${refCode}`,
        'success',
        5000
      );
      setActiveQuickModal(null);
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Error scheduling pickup.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Request Acceptance / Rejection by Donor ──
  const handleUpdateIncomingRequest = async (requestId, foodId, status) => {
    try {
      await foodService.updateRequestStatus(requestId, foodId, status);
      const req = incomingRequests.find((r) => r.id === requestId);

      if (status === 'accepted' && req) {
        try {
          const food = req.food || {};
          const fulfillmentType = req.fulfillment_type || food.fulfillment_type || 'receiver_pickup';
          const deliveryAddress = req.delivery_address || req.receiver?.address || '';

          const pickup = await pickupService.createPickupRecord({
            requestId,
            foodId: foodId || req.food_id,
            donorId: user.id,
            receiverId: req.receiver_id,
            pickupLocation: food.pickup_location || profile?.address || '',
            fulfillmentType,
            deliveryAddress,
          });

          await notificationService.notifyRequestAccepted(
            req.receiver_id,
            profile?.full_name || 'Donor',
            food.food_name || 'Food Item',
            requestId
          );

          if (pickup?.otp_code) {
            await notificationService.notifyPickupAssigned(
              req.receiver_id,
              food.food_name || 'Food Item',
              pickup.otp_code,
              pickup.id
            );
          }

          if (fulfillmentType === 'donor_delivery') {
            showToast(
              `Request accepted! You will deliver to ${req.receiver?.full_name || 'Receiver'} at: ${deliveryAddress || 'their address'}. Delivery OTP: ${pickup?.otp_code || '----'}.`,
              'success',
              8000
            );
          } else {
            showToast(
              `Request accepted! Receiver will collect from your location. Pickup OTP: ${pickup?.otp_code || '----'}.`,
              'success',
              7000
            );
          }
        } catch (pickupErr) {
          console.warn('Pickup creation notice:', pickupErr.message);
          showToast('Request accepted! Live fulfillment window activated.', 'success');
        }
      } else if (status === 'rejected' && req) {
        await notificationService.notifyRequestRejected(
          req.receiver_id,
          req.food?.food_name || 'Food Item',
          requestId
        );
        showToast('Request declined.', 'success');
      } else {
        showToast(`Request marked as ${status}.`, 'success');
      }

      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Failed to update request.', 'error');
    }
  };

  // ── Handle Support Ticket Submission ──
  const handleSubmitSupportTicket = async (e) => {
    e.preventDefault();
    if (!supportForm.message.trim()) {
      showToast('Please enter your question or message.', 'error');
      return;
    }

    setSupportSubmitting(true);
    try {
      const payload = {
        name: displayName,
        email: displayEmail,
        subject: supportForm.subject.trim() || 'Donor Support Inquiry',
        message: supportForm.message.trim(),
        user_id: user?.id || null,
      };

      const { error } = await supabase.from('contact_messages').insert([payload]);
      if (error) throw error;

      showToast(
        'Message received! Our FoodBridge community coordinator will reach out shortly.',
        'success',
        6000
      );
      setSupportForm({ subject: '', message: '' });
    } catch (err) {
      showToast(err.message || 'Failed to send message. Please try again.', 'error');
    } finally {
      setSupportSubmitting(false);
    }
  };

  // Filtered lists for tabs
  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(donationsSearchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(donationsSearchQuery.toLowerCase());
    const matchesStatus =
      donationsStatusFilter === 'all' ||
      d.status.toLowerCase() === donationsStatusFilter.toLowerCase();
    const matchesCat =
      donationsCategoryFilter === 'all' ||
      (d.category || '').toLowerCase() === donationsCategoryFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCat;
  });

  const filteredRequests = incomingRequests.filter((r) => {
    if (requestsStatusFilter === 'all') return true;
    return r.status.toLowerCase() === requestsStatusFilter.toLowerCase();
  });

  const filteredHistory = completedDonationsList.filter((d) => {
    return (
      d.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(historySearchQuery.toLowerCase())
    );
  });

  // Full-page loading skeleton
  if (loadingData && donations.length === 0) {
    return (
      <div className={`donor-dashboard ${isDark ? 'dark-mode' : ''}`}>
        <div className="fb-loading-overlay">
          <div className="fb-spinner fb-spinner-lg" />
          <span className="fb-loading-text">Loading your FoodBridge dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`donor-dashboard ${isDark ? 'dark-mode' : ''}`}>
      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <aside className={`dd-sidebar ${mobileMenuOpen ? 'dd-sidebar-open' : ''}`}>
        {/* Brand Logo */}
        <div className="dd-sidebar-header">
          <div className="dd-brand" onClick={handleGoHome} role="button" tabIndex={0}>
            <div className="dd-logo-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#16a34a" />
                <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#16a34a" />
                <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#16a34a" />
                <path d="M12 28 Q 24 16 36 28" stroke="#16a34a" strokeWidth="2.8" fill="none" />
                <line x1="18" y1="21" x2="18" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <line x1="24" y1="19" x2="24" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <line x1="30" y1="21" x2="30" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <path d="M10 30 C14 42 34 42 38 30" stroke="#16a34a" strokeWidth="2.8" fill="none" />
              </svg>
            </div>
            <div className="dd-brand-text">
              <span className="dd-brand-name">FoodBridge</span>
              <span className="dd-brand-tagline">Share Food. Share Hope.</span>
            </div>
          </div>
          <button
            type="button"
            className="dd-close-mobile-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="dd-nav">
          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'donations' ? 'active' : ''}`}
            onClick={() => handleNavClick('donations')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>My Food Listings</span>
            {activeDonationsList.length > 0 && (
              <span className="dd-badge-count">{activeDonationsList.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'requests' ? 'active' : ''}`}
            onClick={() => handleNavClick('requests')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Incoming Requests</span>
            {incomingRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="dd-badge-count">
                {incomingRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'schedule' ? 'active' : ''}`}
            onClick={() => handleNavClick('schedule')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Schedule Pickup</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'history' ? 'active' : ''}`}
            onClick={() => handleNavClick('history')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Donations History</span>
            {completedDonationsList.length > 0 && (
              <span className="dd-badge-count">{completedDonationsList.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'impact' ? 'active' : ''}`}
            onClick={() => handleNavClick('impact')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 20h10" />
              <path d="M10 20c0-4 4-5 4-10" />
              <path d="M14 4c0 3-3 6-3 6" />
              <path d="M10 8c2.5-3 5-3 5-3" />
            </svg>
            <span>My Impact</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'support' ? 'active' : ''}`}
            onClick={() => handleNavClick('support')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Help & Support</span>
          </button>

          <button
            type="button"
            className="dd-nav-item"
            onClick={() => handleNavClick('settings')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Profile & Settings</span>
          </button>

          {isUserAdmin && (
            <button
              type="button"
              className="dd-nav-item dd-admin-switch-btn"
              onClick={() => {
                if (onNavigate) onNavigate('admin-dashboard');
                window.location.hash = '#admin-dashboard';
              }}
              style={{
                color: '#10b981',
                fontWeight: 700,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                marginTop: '6px',
              }}
            >
              <span className="dd-nav-icon" style={{ fontSize: '15px' }}>🛡️</span>
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer CTA */}
        <div className="dd-sidebar-footer">
          <div className="dd-promo-box">
            <div className="dd-promo-text">
              Together, we can reduce waste and spread hope. 💚
            </div>
          </div>

          <motion.button
            type="button"
            className="dd-btn-donate"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveQuickModal('donate')}
          >
            <span>+ Post Food Listing</span>
          </motion.button>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="dd-main-container">
        {/* Top Header */}
        <header className="dd-top-header">
          <div className="dd-header-left">
            <button
              type="button"
              className="dd-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="dd-welcome-wrap">
              <h1 className="dd-welcome-title">
                {activeNav === 'dashboard' && (
                  <>Welcome back, <span className="dd-highlight-name">{firstName}!</span> <span className="dd-wave">👋</span></>
                )}
                {activeNav === 'donations' && <>My Food Listings 🍲</>}
                {activeNav === 'requests' && <>Incoming Requests Hub 📬</>}
                {activeNav === 'schedule' && <>Schedule Volunteer Pickup 🚚</>}
                {activeNav === 'history' && <>Donations History & Receipts 📜</>}
                {activeNav === 'impact' && <>Your Community Impact 🌍</>}
                {activeNav === 'support' && <>Donor Help & Support Center 🤝</>}
              </h1>
              <p className="dd-welcome-subtitle">
                {activeNav === 'dashboard' && 'Thank you for connecting surplus meals with those in need.'}
                {activeNav === 'donations' && 'Manage your active listings, edit quantities, and track claim statuses.'}
                {activeNav === 'requests' && 'Review receiver requests, coordinate volunteer drivers, and verify pickup OTPs.'}
                {activeNav === 'schedule' && 'Coordinate dedicated pickup routes with verified partner NGOs.'}
                {activeNav === 'history' && 'View completed meal deliveries and download Food Rescue Certificates.'}
                {activeNav === 'impact' && 'Real-time metrics on meals shared, waste prevented, and CO2 emissions saved.'}
                {activeNav === 'support' && 'Guidelines, packaging best practices, emergency helpline, and contact support.'}
              </p>
            </div>
          </div>

          <div className="dd-header-right">
            {/* Quick Post Food Button */}
            <motion.button
              type="button"
              className="dd-btn-top-donate"
              onClick={handleOpenCreateModal}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>+ Post Food</span>
            </motion.button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              className="dd-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="dd-bell-btn"
              onClick={() => {
                const pending = incomingRequests.filter((r) => r.status === 'pending').length;
                if (pending > 0) {
                  setActiveNav('requests');
                  showToast(`You have ${pending} pending food requests to review.`);
                } else {
                  showToast('You are all caught up! No pending requests.', 'success');
                }
              }}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {incomingRequests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="dd-bell-dot">
                  {incomingRequests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="dd-user-profile-wrap">
              <button
                type="button"
                className="dd-user-profile-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="dd-user-avatar"
                  />
                ) : (
                  <span className="dd-user-avatar-initials">{avatarInitials}</span>
                )}
                <div className="dd-user-meta">
                  <span className="dd-user-fullname">{displayName}</span>
                  <span className="dd-user-role-badge">{displayRole}</span>
                </div>
                <svg
                  className={`dd-user-chevron ${userDropdownOpen ? 'open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    className="dd-user-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="dd-dropdown-user-info">
                      <p className="dd-dropdown-name">{displayName}</p>
                      <p className="dd-dropdown-email">{displayEmail}</p>
                    </div>
                    {isUserAdmin && (
                      <>
                        <button
                          type="button"
                          className="dd-dropdown-item"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onNavigate) onNavigate('admin-dashboard');
                            window.location.hash = '#admin-dashboard';
                          }}
                          style={{ color: '#16a34a', fontWeight: 600 }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                          </svg>
                          🛡️ Open Admin Panel
                        </button>
                        <div className="dd-dropdown-divider" />
                      </>
                    )}
                    <button
                      type="button"
                      className="dd-dropdown-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleGoHome();
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                      Back to FoodBridge Home
                    </button>
                    <div className="dd-dropdown-divider" />
                    <button
                      type="button"
                      className="dd-dropdown-item dd-logout-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Global Floating Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className={`dd-floating-toast ${toastType === 'error' ? 'toast-error' : 'toast-success'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {toastType === 'error' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dd-toast-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dd-toast-icon">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ TAB VIEW 1: DASHBOARD OVERVIEW ═══════════ */}
        {activeNav === 'dashboard' && (
          <main className="dd-bento-overview">
            {/* ─── 1. TOP BENTO KPI METRICS ROW ─── */}
            <div className="dd-bento-kpi-row">
              {/* Metric 1: Total Meals */}
              <motion.div
                className="dd-kpi-card dd-kpi-meals"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="dd-kpi-header">
                  <div className="dd-kpi-icon-wrap">🍲</div>
                  <span className="dd-kpi-badge dd-badge-green">Live Total</span>
                </div>
                <div className="dd-kpi-body">
                  <div className="dd-kpi-number">
                    <CountUp to={Number(totalMealsCount) || 0} duration={1.5} />
                  </div>
                  <div className="dd-kpi-label">Meals Shared</div>
                  <div className="dd-kpi-sub">Across verified community shelters</div>
                </div>
                <div className="dd-kpi-progress">
                  <div
                    className="dd-kpi-progress-bar"
                    style={{ width: `${Math.min(100, Math.max(15, (Number(totalMealsCount) || 0) * 3))}%` }}
                  />
                </div>
              </motion.div>

              {/* Metric 2: Food Waste Rescued */}
              <motion.div
                className="dd-kpi-card dd-kpi-waste"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="dd-kpi-header">
                  <div className="dd-kpi-icon-wrap">⚖️</div>
                  <span className="dd-kpi-badge dd-badge-amber">Zero-Waste</span>
                </div>
                <div className="dd-kpi-body">
                  <div className="dd-kpi-number">
                    <CountUp to={parseFloat(totalKgCount) || 0} decimals={1} duration={1.5} suffix=" kg" />
                  </div>
                  <div className="dd-kpi-label">Food Waste Rescued</div>
                  <div className="dd-kpi-sub">Diverted from local landfills</div>
                </div>
                <div className="dd-kpi-progress">
                  <div
                    className="dd-kpi-progress-bar dd-bar-amber"
                    style={{ width: `${Math.min(100, Math.max(20, (parseFloat(totalKgCount) || 0) * 5))}%` }}
                  />
                </div>
              </motion.div>



              {/* Metric 4: Incoming Requests Hub */}
              <motion.div
                className="dd-kpi-card dd-kpi-requests"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => setActiveNav('requests')}
                style={{ cursor: 'pointer' }}
              >
                <div className="dd-kpi-header">
                  <div className="dd-kpi-icon-wrap">📬</div>
                  <span className={`dd-kpi-badge ${incomingRequests.filter((r) => r.status === 'pending').length > 0 ? 'dd-badge-pulse' : 'dd-badge-blue'}`}>
                    {incomingRequests.filter((r) => r.status === 'pending').length} Pending
                  </span>
                </div>
                <div className="dd-kpi-body">
                  <div className="dd-kpi-number">
                    <CountUp to={incomingRequests.length} duration={1} />
                  </div>
                  <div className="dd-kpi-label">Incoming Requests Hub</div>
                  <div className="dd-kpi-sub">Review & accept food orders →</div>
                </div>
                <div className="dd-kpi-progress">
                  <div
                    className="dd-kpi-progress-bar dd-bar-blue"
                    style={{ width: `${Math.min(100, (incomingRequests.length || 1) * 20)}%` }}
                  />
                </div>
              </motion.div>
            </div>

            {/* ─── 2. MAIN BENTO GRID (2 COLUMNS) ─── */}
            <div className="dd-main-bento-grid">
              {/* Left Column: Spotlight Hero + Recent Listings */}
              <div className="dd-bento-col-left">
                {/* Spotlight Hero Banner */}
                <SpotlightCard
                  className="dd-bento-hero-card"
                  spotlightColor={isDark ? 'rgba(34, 197, 94, 0.16)' : 'rgba(22, 163, 74, 0.12)'}
                  borderColor={isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.25)'}
                >
                  <div className="dd-hero-content-wrap">
                    <div className="dd-hero-tag-row">
                      <span className="dd-hero-verified-badge">
                        <span className="dd-hero-pulse-dot" />
                        Verified Donor • {donorLevelInfo.title}
                      </span>
                      <span className="dd-hero-date-txt">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h2 className="dd-hero-title">
                      Welcome back, <span className="dd-hero-name">{displayName.split(' ')[0] || 'Community Hero'}</span>! 🍃
                    </h2>

                    <p className="dd-hero-description">
                      You have rescued <strong className="dd-hero-stat-highlight">{totalKgCount} kg</strong> of surplus food and shared <strong className="dd-hero-stat-highlight">{totalMealsCount} meals</strong>. Your active contributions are directly reducing food waste and feeding local shelters.
                    </p>

                    <div className="dd-hero-action-buttons">
                      <motion.button
                        type="button"
                        className="dd-btn-hero-post"
                        onClick={() => setActiveQuickModal('donate')}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="dd-btn-icon">🍲</span>
                        <span>Post Food Listing</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="dd-btn-hero-requests"
                        onClick={() => setActiveNav('requests')}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span>Incoming Requests</span>
                        {incomingRequests.filter((r) => r.status === 'pending').length > 0 && (
                          <span className="dd-hero-pending-pill">
                            {incomingRequests.filter((r) => r.status === 'pending').length}
                          </span>
                        )}
                      </motion.button>
                    </div>

                    <div className="dd-hero-trust-footer">
                      <span className="dd-trust-pill">🛡️ Food-Safe Standard</span>
                      <span className="dd-trust-pill">⚡ Instant Receiver Broadcast</span>
                      <span className="dd-trust-pill">🔐 Dual-OTP Verification</span>
                    </div>
                  </div>
                </SpotlightCard>

                {/* Recent Food Listings Bento Card */}
                <div className="dd-bento-card dd-recent-listings-bento">
                  <div className="dd-card-header">
                    <div>
                      <h3 className="dd-card-title">Recent Food Listings</h3>
                      <p className="dd-card-subtitle">Active and recently completed surplus donations</p>
                    </div>
                    <div className="dd-card-header-actions">
                      <button
                        type="button"
                        className="dd-link-all"
                        onClick={() => setActiveNav('donations')}
                      >
                        View All ({donations.length})
                      </button>
                      <button
                        type="button"
                        className="dd-btn-accent-sm"
                        onClick={() => setActiveQuickModal('donate')}
                      >
                        + Add Listing
                      </button>
                    </div>
                  </div>

                  {donations.length > 0 ? (
                    <div className="dd-donations-list">
                      {donations.slice(0, 4).map((item) => (
                        <motion.div
                          key={item.id}
                          className="dd-donation-row"
                          whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8faf8', x: 3 }}
                          onClick={() => setSelectedDonationDetail(item.raw || item)}
                        >
                          <img src={item.image} alt={item.title} className="dd-dish-thumb" />
                          <div className="dd-donation-info">
                            <div className="dd-donation-title-row">
                              <h4 className="dd-dish-name">{item.title}</h4>
                              <span className={`dd-fulfillment-mini-tag dd-ff-${item.fulfillment_type || 'receiver_pickup'}`}>
                                {item.fulfillment_type === 'donor_delivery' ? '🚗 Delivery' : '🚶 Pickup'}
                              </span>
                            </div>
                            <p className="dd-dish-qty">Qty: {item.quantity} • {item.location}</p>
                          </div>
                          <div className="dd-donation-status">
                            <span className={`dd-status-badge dd-status-${item.statusType || 'completed'}`}>
                              {item.statusLabel}
                            </span>
                          </div>
                          <div className="dd-donation-datetime">
                            <span className="dd-date">{item.date}</span>
                            <span className="dd-time">{item.time}</span>
                          </div>
                          <div className="dd-donation-action">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dd-row-chevron">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="dd-empty-donations">
                      <div className="dd-empty-icon-circle">🍲</div>
                      <h4 className="dd-empty-title">No food listings yet</h4>
                      <p className="dd-empty-subtitle">
                        Share surplus prepared meals, bakery items, or produce to connect with nearby receivers.
                      </p>
                      <button
                        type="button"
                        className="dd-btn-empty-donate"
                        onClick={() => setActiveQuickModal('donate')}
                      >
                        + Post Your First Food Listing
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Quick Hub + Impact Milestones */}
              <div className="dd-bento-col-right">
                {/* Quick Command Hub Bento */}
                <div className="dd-bento-card dd-quick-hub-bento">
                  <div className="dd-card-header">
                    <h3 className="dd-card-title">Quick Action Hub ⚡</h3>
                    <span className="dd-green-badge">Direct Shortcuts</span>
                  </div>

                  <div className="dd-actions-grid">
                    <motion.div
                      className="dd-action-tile"
                      onClick={() => setActiveQuickModal('donate')}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="dd-action-icon-box">🍲</div>
                      <div className="dd-action-text">
                        <h4>New Listing</h4>
                        <p>Post surplus food</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="dd-action-tile"
                      onClick={() => setActiveNav('requests')}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="dd-action-icon-box">📬</div>
                      <div className="dd-action-text">
                        <h4>Food Requests</h4>
                        <p>{incomingRequests.length} incoming orders</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="dd-action-tile dd-action-pickup-drop-tile"
                      onClick={() => {
                        if (typeof window !== 'undefined') window.location.hash = '#pickup-drop';
                      }}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="dd-action-icon-box">🚚</div>
                      <div className="dd-action-text">
                        <h4>Pickup & Drop <span className="dd-pill-soon-mini">Soon</span></h4>
                        <p>Middleman delivery fleet</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="dd-action-tile"
                      onClick={() => setActiveNav('history')}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="dd-action-icon-box">📜</div>
                      <div className="dd-action-text">
                        <h4>Impact Receipts</h4>
                        <p>View & print certificates</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Community Trust & Analytics Snapshot */}
                <div className="dd-bento-card dd-trust-snapshot-card">
                  <div className="dd-card-header">
                    <div>
                      <h3 className="dd-card-title">Impact Milestones 🏆</h3>
                      <p className="dd-card-subtitle">Your zero-waste community standing</p>
                    </div>
                  </div>

                  <div className="dd-milestone-body">
                    <div className="dd-milestone-row">
                      <span>Current Standing:</span>
                      <strong className="dd-milestone-val">{donorLevelInfo.badge}</strong>
                    </div>
                    <div className="dd-milestone-gauge">
                      <div className="dd-gauge-fill" style={{ width: `${milestoneProgressPercent}%` }} />
                    </div>
                    <div className="dd-milestone-footer-note">
                      <span>Next Goal: {nextMilestoneTarget} Meals Shared</span>
                      <span>{mealsRemainingToMilestone} to go</span>
                    </div>

                    <button
                      type="button"
                      className="dd-btn-view-analytics"
                      onClick={() => setActiveNav('impact')}
                    >
                      <span>Explore Detailed Analytics & Equivalents</span>
                      <span className="dd-arrow-right">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ═══════════ TAB VIEW 2: MY FOOD LISTINGS ═══════════ */}
        {activeNav === 'donations' && (
          <div className="dd-full-tab-view">
            {/* Filter & Search Bar */}
            <div className="dd-filter-controls-bar">
              <div className="dd-search-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  id="dd-donations-search"
                  name="donationsSearchQuery"
                  type="text"
                  placeholder="Search your food listings..."
                  value={donationsSearchQuery}
                  onChange={(e) => setDonationsSearchQuery(e.target.value)}
                  className="dd-input-search"
                  aria-label="Search your food listings"
                  autoComplete="off"
                />
              </div>

              {/* Category Filter */}
              <select
                id="dd-donations-category-filter"
                name="donationsCategoryFilter"
                value={donationsCategoryFilter}
                onChange={(e) => setDonationsCategoryFilter(e.target.value)}
                className="dd-select-filter"
                aria-label="Filter food listings by category"
              >
                <option value="all">All Categories</option>
                <option value="cooked meals">Cooked Meals</option>
                <option value="bakery & breads">Bakery & Breads</option>
                <option value="fresh produce">Fresh Produce</option>
                <option value="dairy & groceries">Dairy & Groceries</option>
                <option value="packaged food">Packaged Food</option>
              </select>

              <button
                type="button"
                className="dd-btn-primary-action"
                onClick={() => setActiveQuickModal('donate')}
              >
                + Post New Food
              </button>
            </div>

            {/* Status Tabs */}
            <div className="dd-status-chips-bar">
              {['all', 'available', 'requested', 'reserved', 'collected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`dd-status-chip ${donationsStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setDonationsStatusFilter(st)}
                >
                  {st.toUpperCase()} (
                  {st === 'all'
                    ? donations.length
                    : donations.filter((d) => d.status.toLowerCase() === st).length}
                  )
                </button>
              ))}
            </div>

            {/* Food Grid */}
            {filteredDonations.length > 0 ? (
              <div className="dd-food-cards-grid">
                {filteredDonations.map((item) => (
                  <div key={item.id} className="dd-food-listing-card">
                    <div className="dd-food-card-img-wrap">
                      <img src={item.image} alt={item.title} className="dd-food-card-img" />
                      <span className={`dd-card-status-badge dd-status-${item.statusType || 'pending'}`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    <div className="dd-food-card-body">
                      <div className="dd-food-card-cat-row">
                        <span className="dd-food-card-cat">{item.category}</span>
                        <span className={`dd-fulfillment-chip dd-ff-${item.fulfillment_type || 'receiver_pickup'}`}>
                          {item.fulfillment_type === 'donor_delivery' ? '🚗 Donor Delivery' : '🚶 Receiver Pickup'}
                        </span>
                      </div>
                      <h3 className="dd-food-card-title">{item.title}</h3>
                      <p className="dd-food-card-loc">📍 {item.location}</p>

                      <div className="dd-food-card-metrics">
                        <span>👥 {item.servings} Servings</span>
                        <span>⚖️ {item.food_weight_kg} kg</span>
                      </div>

                      <div className="dd-food-card-actions">
                        <button
                          type="button"
                          className="dd-btn-card-inspect"
                          onClick={() => setSelectedDonationDetail(item.raw || item)}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="dd-btn-card-edit"
                          onClick={() => handleOpenEditDonation(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dd-btn-card-delete"
                          onClick={() => handleDeleteDonation(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dd-empty-hub-state">
                <div className="dd-empty-hub-icon">🍲</div>
                <h3>No food listings found</h3>
                <p>Post surplus food from your kitchen or adjust search filters.</p>
                <button
                  type="button"
                  className="dd-btn-primary-action"
                  onClick={() => {
                    setDonationsSearchQuery('');
                    setDonationsStatusFilter('all');
                    setDonationsCategoryFilter('all');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB VIEW 3: INCOMING REQUESTS HUB ═══════════ */}
        {activeNav === 'requests' && (
          <div className="dd-full-tab-view">
            {/* Status filter bar */}
            <div className="dd-status-chips-bar">
              {['all', 'pending', 'accepted', 'completed', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`dd-status-chip ${requestsStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setRequestsStatusFilter(st)}
                >
                  {st.toUpperCase()} (
                  {st === 'all'
                    ? incomingRequests.length
                    : incomingRequests.filter((r) => r.status.toLowerCase() === st).length}
                  )
                </button>
              ))}
            </div>

            {filteredRequests.length > 0 ? (
              <div className="dd-requests-hub-list">
                {filteredRequests.map((req) => {
                  const matchedPickup = pickups.find(
                    (p) => p.request_id === req.id || p.food_id === req.food_id
                  );
                  const isDonorDelivery =
                    req.fulfillment_type === 'donor_delivery' ||
                    req.food?.fulfillment_type === 'donor_delivery';

                  return (
                    <div key={req.id} className="dd-request-hub-card">
                      <div className="dd-request-hub-header">
                        <div className="dd-requester-info">
                          <div className="dd-requester-avatar">
                            {getUserInitials(req.receiver)}
                          </div>
                          <div>
                            <h4 className="dd-requester-name">
                              {req.receiver?.full_name || 'Community Receiver'}
                              {req.receiver?.organization_name && (
                                <span className="dd-requester-org"> ({req.receiver.organization_name})</span>
                              )}
                            </h4>
                            <p className="dd-request-time-ago">
                              Requested {new Date(req.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="dd-request-header-badges">
                          <span className={`dd-fulfillment-chip dd-ff-${isDonorDelivery ? 'donor_delivery' : 'receiver_pickup'}`}>
                            {isDonorDelivery ? '🚗 Donor Delivery' : '🚶 Receiver Pickup'}
                          </span>
                          <span className={`dd-status-badge dd-status-${req.status === 'accepted' ? 'completed' : req.status === 'pending' ? 'scheduled' : 'pending'}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="dd-request-hub-body">
                        <div className="dd-request-item-glance">
                          <span>Item: <strong>{req.food?.food_name || 'Food Item'}</strong></span>
                          <span>Portions: <strong>{req.requested_servings} servings</strong></span>
                          {isDonorDelivery ? (
                            <span className="dd-delivery-target-highlight">
                              📍 <strong>Delivery Destination:</strong> {req.delivery_address || req.receiver?.address || 'Provided by receiver'}
                            </span>
                          ) : (
                            <span>
                              📍 <strong>Your Pickup Point:</strong> {req.food?.pickup_location || 'Main Kitchen Entry'}
                            </span>
                          )}
                        </div>

                        {req.notes && (
                          <div className="dd-request-notes-box">
                            <strong>Receiver Note:</strong> "{req.notes}"
                          </div>
                        )}

                        {(req.delivery_phone || req.receiver?.phone) && (
                          <div className="dd-requester-contact">
                            📞 Phone: <a href={`tel:${req.delivery_phone || req.receiver?.phone}`}>{req.delivery_phone || req.receiver?.phone}</a>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="dd-request-hub-footer">
                        {req.status === 'pending' && (
                          <div className="dd-decision-btns">
                            <button
                              type="button"
                              className="dd-btn-accept-request"
                              onClick={() => handleUpdateIncomingRequest(req.id, req.food_id, 'accepted')}
                            >
                              ✓ Accept Request
                            </button>
                            <button
                              type="button"
                              className="dd-btn-decline-request"
                              onClick={() => handleUpdateIncomingRequest(req.id, req.food_id, 'rejected')}
                            >
                              ✕ Decline
                            </button>
                          </div>
                        )}

                        {req.status === 'accepted' && (
                          <div className="dd-otp-verify-inline">
                            <span className="dd-otp-inline-title">
                              {isDonorDelivery
                                ? '🔐 Enter 4-Digit OTP from Receiver at Delivery Drop-off:'
                                : '🔐 Enter 4-Digit OTP shown on Receiver’s Phone at Pickup:'}
                            </span>
                            <div className="dd-otp-field-row">
                              <label htmlFor={`dd-otp-input-${req.id}`} className="sr-only">
                                Enter 4-Digit OTP
                              </label>
                              <input
                                id={`dd-otp-input-${req.id}`}
                                name={`otp_code_${req.id}`}
                                type="text"
                                maxLength="4"
                                placeholder="••••"
                                value={otpInputs[matchedPickup?.id || req.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setOtpInputs({
                                    ...otpInputs,
                                    [matchedPickup?.id || req.id]: val,
                                    [req.id]: val,
                                    ...(matchedPickup?.id ? { [matchedPickup.id]: val } : {}),
                                  });
                                }}
                                className="dd-otp-code-input"
                                aria-label="Enter 4-Digit OTP"
                                autoComplete="one-time-code"
                              />
                              <button
                                type="button"
                                className="dd-btn-confirm-otp"
                                onClick={() => handleVerifyOTP(matchedPickup?.id || req.id)}
                              >
                                {isDonorDelivery ? 'Verify & Complete Delivery' : 'Verify & Complete Pickup'}
                              </button>
                            </div>
                          </div>
                        )}

                        {req.status === 'completed' && (
                          <div className="dd-request-completed-badge">
                            {isDonorDelivery
                              ? '✓ Food successfully delivered and verified with receiver OTP'
                              : '✓ Food successfully picked up and verified with OTP'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dd-empty-hub-state">
                <div className="dd-empty-hub-icon">📬</div>
                <h3>No requests in this view</h3>
                <p>When receivers or community shelters request your listings, you will manage them here.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB VIEW 4: SCHEDULE PICKUP ═══════════ */}
        {activeNav === 'schedule' && (
          <div className="dd-full-tab-view">
            <div className="dd-schedule-layout-grid">
              {/* Form card */}
              <div className="dd-card dd-schedule-form-card">
                <h3 className="dd-card-title">Book Dedicated NGO Pickup Route</h3>
                <p className="dd-card-desc">
                  Schedule a verified volunteer driver to collect food donations directly from your kitchen or doorstep.
                </p>

                <form onSubmit={handleSchedulePickup} className="dd-schedule-inner-form">
                  <div className="dd-modal-field">
                    <label htmlFor="dd-schedule-tab-ngo">Select Partner NGO / Organization</label>
                    <select
                      id="dd-schedule-tab-ngo"
                      name="ngoName"
                      value={pickupForm.ngoName}
                      onChange={(e) => setPickupForm({ ...pickupForm, ngoName: e.target.value })}
                      className="dd-select-control"
                    >
                      {registeredNgos.map((ngo) => (
                        <option key={ngo.id} value={ngo.name}>
                          {ngo.name} {ngo.city ? `(${ngo.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-schedule-tab-date">Pickup Date</label>
                    <input
                      id="dd-schedule-tab-date"
                      name="date"
                      type="date"
                      value={pickupForm.date}
                      onChange={(e) => setPickupForm({ ...pickupForm, date: e.target.value })}
                      required
                      className="dd-input-control"
                      autoComplete="off"
                    />
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-schedule-tab-timeslot">Preferred Time Slot</label>
                    <select
                      id="dd-schedule-tab-timeslot"
                      name="timeSlot"
                      value={pickupForm.timeSlot}
                      onChange={(e) => setPickupForm({ ...pickupForm, timeSlot: e.target.value })}
                      className="dd-select-control"
                    >
                      <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (01:00 PM - 04:00 PM)">Afternoon (01:00 PM - 04:00 PM)</option>
                      <option value="Evening (05:00 PM - 08:00 PM)">Evening (05:00 PM - 08:00 PM)</option>
                      <option value="Late Night Emergency (09:00 PM - 11:00 PM)">Late Night Emergency (09:00 PM - 11:00 PM)</option>
                    </select>
                  </div>

                  <button type="submit" className="dd-btn-primary-action" disabled={submitting}>
                    {submitting ? 'Confirming with NGO...' : 'Confirm Schedule Request'}
                  </button>
                </form>
              </div>

              {/* Scheduled Pickups List */}
              <div className="dd-card dd-scheduled-list-card">
                <h3 className="dd-card-title">Scheduled Pickups ({pickups.length})</h3>

                {pickups.length > 0 ? (
                  <div className="dd-pickups-timeline-list">
                    {pickups.map((p) => (
                      <div key={p.id} className="dd-pickup-timeline-item">
                        <div className="dd-pickup-tl-badge">🚚</div>
                        <div className="dd-pickup-tl-content">
                          <div className="dd-pickup-tl-header">
                            <h4>{p.food?.food_name || p.ngo_name || 'Scheduled Food Pickup'}</h4>
                            <span className={`dd-status-badge dd-status-${p.status === 'completed' ? 'completed' : 'scheduled'}`}>
                              {(p.status || 'SCHEDULED').toUpperCase()}
                            </span>
                          </div>
                          <p className="dd-pickup-tl-sub">
                            Date: <strong>{p.pickup_date || (p.scheduled_time ? new Date(p.scheduled_time).toLocaleDateString('en-GB') : 'Today')}</strong> • Slot: {p.time_slot || 'Standard Window'}
                          </p>
                          <p className="dd-pickup-tl-driver">
                            Organization: <strong>{p.receiver?.organization_name || p.receiver?.full_name || p.ngo_name || 'Volunteer Team'}</strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dd-empty-pickups-notice">
                    <p>No volunteer pickups scheduled yet. Choose a date and time slot on the left to book.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TAB VIEW 5: DONATIONS HISTORY ═══════════ */}
        {activeNav === 'history' && (
          <div className="dd-full-tab-view">
            {/* History Summary Bar */}
            <div className="dd-history-summary-strip">
              <div className="dd-hsum-tile">
                <span className="dd-hsum-num">{completedDonationsList.length}</span>
                <span className="dd-hsum-lbl">Completed Donations</span>
              </div>
              <div className="dd-hsum-tile">
                <span className="dd-hsum-num">{completedDonationsList.reduce((acc, d) => acc + (d.servings || 0), 0)}</span>
                <span className="dd-hsum-lbl">Meals Delivered</span>
              </div>
              <div className="dd-hsum-tile">
                <span className="dd-hsum-num">{completedDonationsList.reduce((acc, d) => acc + (d.food_weight_kg || 0), 0).toFixed(1)} kg</span>
                <span className="dd-hsum-lbl">Food Rescued</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="dd-search-history-bar">
              <label htmlFor="dd-history-search-input" className="sr-only">
                Search completed donation records
              </label>
              <input
                id="dd-history-search-input"
                name="historySearchQuery"
                type="text"
                placeholder="Search completed donation records..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="dd-input-search-history"
                aria-label="Search completed donation records"
                autoComplete="off"
              />
            </div>

            {filteredHistory.length > 0 ? (
              <div className="dd-history-records-list">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="dd-history-record-card">
                    <img src={item.image} alt={item.title} className="dd-history-thumb" />
                    <div className="dd-history-info">
                      <h4 className="dd-history-title">{item.title}</h4>
                      <p className="dd-history-meta">
                        Completed on {item.date} • {item.servings} Servings ({item.food_weight_kg} kg)
                      </p>
                      <span className="dd-history-location">📍 {item.location}</span>
                    </div>

                    <button
                      type="button"
                      className="dd-btn-view-cert"
                      onClick={() => setViewingCertificate(item)}
                    >
                      📜 View Impact Certificate
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dd-empty-hub-state">
                <div className="dd-empty-hub-icon">📜</div>
                <h3>No completed donations yet</h3>
                <p>When food requests are accepted and verified via OTP, they will appear in your permanent impact history.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB VIEW 6: MY IMPACT ANALYTICS ═══════════ */}
        {activeNav === 'impact' && (
          <div className="dd-full-tab-view">
            {/* Impact Hero Metrics */}
            <div className="dd-impact-analytics-grid">
              <div className="dd-analytics-card">
                <div className="dd-analytics-icon">🍲</div>
                <div className="dd-analytics-num">{totalMealsCount}</div>
                <div className="dd-analytics-lbl">Total Meals Shared</div>
                <p className="dd-analytics-desc">Nourishing families and community centers</p>
              </div>

              <div className="dd-analytics-card">
                <div className="dd-analytics-icon">⚖️</div>
                <div className="dd-analytics-num">{totalKgCount} <span className="dd-unit-sm">KG</span></div>
                <div className="dd-analytics-lbl">Food Waste Prevented</div>
                <p className="dd-analytics-desc">Diverted from city landfills</p>
              </div>

              <div className="dd-analytics-card">
                <div className="dd-analytics-icon">🌿</div>
                <div className="dd-analytics-num">{totalCO2Count} <span className="dd-unit-sm">KG</span></div>
                <div className="dd-analytics-lbl">CO₂ Emissions Averted</div>
                <p className="dd-analytics-desc">Greenhouse gas impact reduction</p>
              </div>

              <div className="dd-analytics-card">
                <div className="dd-analytics-icon">🌳</div>
                <div className="dd-analytics-num">{totalTreesEquivalent}</div>
                <div className="dd-analytics-lbl">Trees Planted Equivalent</div>
                <p className="dd-analytics-desc">Environmental carbon absorption</p>
              </div>
            </div>

            {/* Milestones & Badges */}
            <div className="dd-card dd-badges-card">
              <h3 className="dd-card-title">Donor Milestone Badges 🏅</h3>
              <div className="dd-badges-grid">
                <div className={`dd-badge-item ${donations.length >= 1 ? 'unlocked' : 'locked'}`}>
                  <div className="dd-badge-icon">🌟</div>
                  <h4>First Food Share</h4>
                  <p>{donations.length >= 1 ? 'Unlocked' : 'Make 1 donation'}</p>
                </div>

                <div className={`dd-badge-item ${totalMealsCount >= 50 ? 'unlocked' : 'locked'}`}>
                  <div className="dd-badge-icon">🏆</div>
                  <h4>50 Meals Champion</h4>
                  <p>{totalMealsCount >= 50 ? 'Unlocked' : `${totalMealsCount}/50 meals`}</p>
                </div>

                <div className={`dd-badge-item ${parseFloat(totalKgCount) >= 25 ? 'unlocked' : 'locked'}`}>
                  <div className="dd-badge-icon">🌿</div>
                  <h4>Zero Waste Pioneer</h4>
                  <p>{parseFloat(totalKgCount) >= 25 ? 'Unlocked' : `${totalKgCount}/25 kg saved`}</p>
                </div>

                <div className={`dd-badge-item ${completedDonationsList.length >= 5 ? 'unlocked' : 'locked'}`}>
                  <div className="dd-badge-icon">👑</div>
                  <h4>Community Pillar</h4>
                  <p>{completedDonationsList.length >= 5 ? 'Unlocked' : `${completedDonationsList.length}/5 pickups`}</p>
                </div>
              </div>
            </div>

            {/* Master Lifetime Impact Certificate Action */}
            <div className="dd-card dd-master-cert-cta-card">
              <div className="dd-master-cert-cta-left">
                <div className="dd-master-cert-cta-icon">📜</div>
                <div>
                  <h3 className="dd-master-cert-cta-title">Official Lifetime Impact Credential</h3>
                  <p className="dd-master-cert-cta-desc">
                    Generate and download your official verifiable Certificate of Appreciation celebrating your cumulative food donations ({totalMealsCount} meals shared and {totalKgCount} kg of surplus food rescued).
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="dd-btn-generate-master-cert"
                onClick={() =>
                  setViewingCertificate({
                    id: user?.id ? user.id.slice(0, 8).toUpperCase() : 'LIFE2026',
                    title: 'Lifetime Surplus Food Rescue & Community Nourishment Contributions',
                    servings: totalMealsCount,
                    food_weight_kg: totalKgCount,
                    date: new Date().toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                    isLifetime: true,
                  })
                }
              >
                <span>🎓 View Lifetime Certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ TAB VIEW 7: HELP & SUPPORT ═══════════ */}
        {activeNav === 'support' && (
          <div className="dd-full-tab-view">
            <div className="dd-support-layout-grid">
              {/* Support FAQs */}
              <div className="dd-card dd-faqs-card">
                <h3 className="dd-card-title">Donor Frequently Asked Questions</h3>
                <div className="dd-faq-accordion">
                  {DONOR_FAQS.map((faq, idx) => (
                    <div
                      key={idx}
                      className={`dd-faq-row ${expandedFaq === idx ? 'open' : ''}`}
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    >
                      <div className="dd-faq-q">
                        <span>{faq.q}</span>
                        <span className="dd-faq-chevron">{expandedFaq === idx ? '▲' : '▼'}</span>
                      </div>
                      {expandedFaq === idx && <p className="dd-faq-a">{faq.a}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Ticket Form */}
              <div className="dd-card dd-ticket-form-card">
                <h3 className="dd-card-title">Send Message to Coordinator</h3>
                <form onSubmit={handleSubmitSupportTicket} className="dd-ticket-form">
                  <div className="dd-modal-field">
                    <label htmlFor="dd-support-ticket-subject">Subject</label>
                    <input
                      id="dd-support-ticket-subject"
                      name="subject"
                      type="text"
                      placeholder="e.g. Question about large catering pickup"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      className="dd-input-control"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-support-ticket-message">Your Message / Inquiry</label>
                    <textarea
                      id="dd-support-ticket-message"
                      name="message"
                      rows="4"
                      placeholder="Describe your question or requirement..."
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                      className="dd-textarea-control"
                      required
                    />
                  </div>

                  <button type="submit" className="dd-btn-primary-action" disabled={supportSubmitting}>
                    {supportSubmitting ? 'Sending Ticket...' : 'Submit Support Ticket'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ MODAL 1: MULTI-STEP CREATE FOOD DONATION ═══════════ */}
      <AnimatePresence>
        {activeQuickModal === 'donate' && (
          <div className="dd-modal-backdrop" onClick={() => setActiveQuickModal(null)}>
            <motion.div
              className="dd-modal-box dd-modal-multistep"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="dd-modal-close"
                onClick={() => setActiveQuickModal(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="dd-modal-body">
                <div className="dd-multistep-header">
                  <h3>Post Surplus Food Donation</h3>
                  <p>Your listing will be instantly broadcasted to verified receivers & partner NGOs.</p>

                  {/* 4-Step Progress Indicator */}
                  <div className="dd-step-indicator-bar">
                    <div className={`dd-step-dot ${donationStep >= 1 ? 'active' : ''} ${donationStep > 1 ? 'done' : ''}`}>
                      <span>1</span>
                      <label>Fulfillment</label>
                    </div>
                    <div className={`dd-step-connector ${donationStep > 1 ? 'done' : ''}`} />
                    <div className={`dd-step-dot ${donationStep >= 2 ? 'active' : ''} ${donationStep > 2 ? 'done' : ''}`}>
                      <span>2</span>
                      <label>Meal Details</label>
                    </div>
                    <div className={`dd-step-connector ${donationStep > 2 ? 'done' : ''}`} />
                    <div className={`dd-step-dot ${donationStep >= 3 ? 'active' : ''} ${donationStep > 3 ? 'done' : ''}`}>
                      <span>3</span>
                      <label>Photo & Location</label>
                    </div>
                    <div className={`dd-step-connector ${donationStep > 3 ? 'done' : ''}`} />
                    <div className={`dd-step-dot ${donationStep >= 4 ? 'active' : ''}`}>
                      <span>4</span>
                      <label>Review</label>
                    </div>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); if (donationStep === 4) handleCreateDonation(e); }}>
                  {/* STEP 1: FULFILLMENT / COLLECTION SELECTION */}
                  {donationStep === 1 && (
                    <motion.div
                      className="dd-step-pane"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <label className="dd-field-label-bold">How should this donation be collected? *</label>
                      <div className="dd-fulfillment-selector">
                        <div
                          className={`dd-fulfillment-option ${donationForm.fulfillment_type === 'receiver_pickup' ? 'selected' : ''}`}
                          onClick={() => setDonationForm({ ...donationForm, fulfillment_type: 'receiver_pickup' })}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="dd-fulfillment-radio">
                            {donationForm.fulfillment_type === 'receiver_pickup' && <div className="dd-radio-inner" />}
                          </div>
                          <div className="dd-fulfillment-info">
                            <div className="dd-fulfillment-header">
                              <span className="dd-fulfillment-icon">🚶</span>
                              <strong>Receiver Pickup</strong>
                            </div>
                            <p>The receiver or NGO volunteer will visit your location to collect the food.</p>
                          </div>
                        </div>

                        <div
                          className={`dd-fulfillment-option ${donationForm.fulfillment_type === 'donor_delivery' ? 'selected' : ''}`}
                          onClick={() => setDonationForm({ ...donationForm, fulfillment_type: 'donor_delivery' })}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="dd-fulfillment-radio">
                            {donationForm.fulfillment_type === 'donor_delivery' && <div className="dd-radio-inner" />}
                          </div>
                          <div className="dd-fulfillment-info">
                            <div className="dd-fulfillment-header">
                              <span className="dd-fulfillment-icon">🚗</span>
                              <strong>Donor Delivery</strong>
                            </div>
                            <p>You will deliver the food directly to the receiver's specified address.</p>
                          </div>
                        </div>

                        <div
                          className="dd-fulfillment-option disabled"
                          onClick={() => {
                            if (onNavigate) {
                              setActiveQuickModal(null);
                              onNavigate('pickup-drop');
                            } else {
                              window.location.hash = '#pickup-drop';
                            }
                          }}
                          title="Click to learn about FoodBridge Pickup & Drop"
                        >
                          <div className="dd-fulfillment-radio disabled" />
                          <div className="dd-fulfillment-info">
                            <div className="dd-fulfillment-header">
                              <span className="dd-fulfillment-icon">🚚</span>
                              <strong>FoodBridge Pickup & Drop</strong>
                              <span className="dd-coming-soon-badge">Coming Soon</span>
                            </div>
                            <p>A future middleman network will collect and deliver food for you. <span className="dd-learn-more-link">Learn More →</span></p>
                          </div>
                        </div>
                      </div>

                      <div className="dd-step-nav-footer">
                        <div />
                        <button
                          type="button"
                          className="dd-btn-step-next"
                          onClick={() => setDonationStep(2)}
                        >
                          Next: Meal Details →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: MEAL DETAILS */}
                  {donationStep === 2 && (
                    <motion.div
                      className="dd-step-pane"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="dd-modal-field">
                        <label htmlFor="dd-create-food-title">Food Item Title *</label>
                        <input
                          id="dd-create-food-title"
                          name="title"
                          type="text"
                          placeholder="e.g. Steamed Basmati Rice & Dal Makhani"
                          value={donationForm.title}
                          onChange={(e) => setDonationForm({ ...donationForm, title: e.target.value })}
                          required
                          autoFocus
                          autoComplete="off"
                        />
                      </div>

                      <div className="dd-modal-field">
                        <label htmlFor="dd-create-food-category">Category</label>
                        <select
                          id="dd-create-food-category"
                          name="category"
                          value={donationForm.category}
                          onChange={(e) => setDonationForm({ ...donationForm, category: e.target.value })}
                        >
                          <option value="Cooked Meals">Cooked Meals</option>
                          <option value="Bakery & Breads">Bakery & Breads</option>
                          <option value="Fresh Produce">Fresh Produce (Fruits & Veggies)</option>
                          <option value="Dairy & Groceries">Dairy & Groceries</option>
                          <option value="Packaged Food">Packaged Food</option>
                        </select>
                      </div>

                      <div className="dd-modal-grid-2">
                        <div className="dd-modal-field">
                          <label htmlFor="dd-create-food-servings">Servings Count *</label>
                          <input
                            id="dd-create-food-servings"
                            name="servings"
                            type="number"
                            min="1"
                            placeholder="10"
                            value={donationForm.servings}
                            onChange={(e) => setDonationForm({ ...donationForm, servings: e.target.value })}
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="dd-modal-field">
                          <label htmlFor="dd-create-food-weight">Approx Weight (KG) *</label>
                          <input
                            id="dd-create-food-weight"
                            name="weight"
                            type="number"
                            step="0.1"
                            min="0.5"
                            placeholder="2.5"
                            value={donationForm.weight}
                            onChange={(e) => setDonationForm({ ...donationForm, weight: e.target.value })}
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div className="dd-modal-grid-2">
                        <div className="dd-modal-field">
                          <label htmlFor="dd-create-food-storage">Storage Condition</label>
                          <select
                            id="dd-create-food-storage"
                            name="storage"
                            value={donationForm.storage}
                            onChange={(e) => setDonationForm({ ...donationForm, storage: e.target.value })}
                          >
                            <option value="Room Temperature">Room Temperature</option>
                            <option value="Refrigerated">Refrigerated (Cold)</option>
                            <option value="Hot / Warm">Hot / Freshly Cooked</option>
                            <option value="Frozen">Frozen</option>
                          </select>
                        </div>
                        <div className="dd-modal-field">
                          <label htmlFor="dd-create-food-allergens">Allergens (optional)</label>
                          <input
                            id="dd-create-food-allergens"
                            name="allergens"
                            type="text"
                            placeholder="e.g. Nuts, Dairy, Gluten"
                            value={donationForm.allergens}
                            onChange={(e) => setDonationForm({ ...donationForm, allergens: e.target.value })}
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div className="dd-step-nav-footer">
                        <button
                          type="button"
                          className="dd-btn-step-prev"
                          onClick={() => setDonationStep(1)}
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          className="dd-btn-step-next"
                          onClick={() => {
                            if (!donationForm.title.trim()) {
                              showToast('Please enter a food title.', 'error');
                              return;
                            }
                            setDonationStep(3);
                          }}
                        >
                          Next: Photo & Location →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: PHOTO & LOCATION */}
                  {donationStep === 3 && (
                    <motion.div
                      className="dd-step-pane"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="dd-modal-field">
                        <label htmlFor="dd-create-food-location">
                          {donationForm.fulfillment_type === 'donor_delivery'
                            ? 'Your Dispatch / Starting Kitchen Location *'
                            : 'Pickup Location / Gate *'}
                        </label>
                        <input
                          id="dd-create-food-location"
                          name="location"
                          type="text"
                          placeholder={
                            donationForm.fulfillment_type === 'donor_delivery'
                              ? 'e.g. Main Kitchen, Sector 4 (Your base location)'
                              : 'e.g. Main Gate, Sector 5, Kitchen Entry'
                          }
                          value={donationForm.location}
                          onChange={(e) => setDonationForm({ ...donationForm, location: e.target.value })}
                          required
                          autoComplete="street-address"
                        />
                      </div>

                      <div className="dd-modal-field">
                        <label htmlFor="dd-create-food-dishtype">Select Preset Dish Style</label>
                        <select
                          id="dd-create-food-dishtype"
                          name="dishType"
                          value={donationForm.dishType}
                          onChange={(e) => setDonationForm({ ...donationForm, dishType: e.target.value })}
                        >
                          <option value="biryani">Biryani / Rice Dish</option>
                          <option value="dal_rice">Dal & Rice</option>
                          <option value="pasta">Pasta / Noodles</option>
                          <option value="fruits">Fresh Fruits</option>
                          <option value="bread">Bread & Bakery</option>
                          <option value="mixed_veg">Mixed Vegetables</option>
                          <option value="idli">Idli / South Indian</option>
                          <option value="chole_puri">Chole Puri / North Indian</option>
                          <option value="milk">Milk & Dairy</option>
                        </select>
                      </div>

                      <div className="dd-modal-field">
                        <label htmlFor="dd-create-food-photo">Or Upload Custom Photo (optional)</label>
                        <input
                          id="dd-create-food-photo"
                          name="foodPhoto"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                          style={{ fontSize: '13px', padding: '6px 0' }}
                        />
                        {imageFile && (
                          <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                            ✓ {imageFile.name} selected
                          </span>
                        )}
                      </div>

                      <div className="dd-modal-field">
                        <label htmlFor="dd-create-food-description">Additional Notes / Handling Instructions (optional)</label>
                        <textarea
                          id="dd-create-food-description"
                          name="description"
                          rows="2"
                          placeholder="e.g. Packed in 5 sealed containers, keep upright..."
                          value={donationForm.description}
                          onChange={(e) => setDonationForm({ ...donationForm, description: e.target.value })}
                        />
                      </div>

                      <div className="dd-step-nav-footer">
                        <button
                          type="button"
                          className="dd-btn-step-prev"
                          onClick={() => setDonationStep(2)}
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          className="dd-btn-step-next"
                          onClick={() => {
                            if (!donationForm.location.trim()) {
                              showToast('Please enter a location.', 'error');
                              return;
                            }
                            setDonationStep(4);
                          }}
                        >
                          Next: Review & Confirm →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: REVIEW & CONFIRM */}
                  {donationStep === 4 && (
                    <motion.div
                      className="dd-step-pane"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="dd-review-card">
                        <div className="dd-review-header">
                          <img
                            src={
                              imagePreviewUrl || PRESET_DISH_IMAGES[donationForm.dishType] || '/assets/dish_biryani.jpg'
                            }
                            alt="Preview"
                            className="dd-review-img"
                          />
                          <div className="dd-review-info">
                            <span className={`dd-fulfillment-mini-tag dd-ff-${donationForm.fulfillment_type}`}>
                              {donationForm.fulfillment_type === 'donor_delivery' ? '🚗 Donor Delivery' : '🚶 Receiver Pickup'}
                            </span>
                            <h4>{donationForm.title || 'Untitled Donation'}</h4>
                            <p>{donationForm.category} • {donationForm.servings} portions ({donationForm.weight} kg)</p>
                          </div>
                        </div>

                        <div className="dd-review-details-grid">
                          <div><strong>Location:</strong> {donationForm.location || 'Your Kitchen'}</div>
                          <div><strong>Storage:</strong> {donationForm.storage}</div>
                          <div><strong>Allergens:</strong> {donationForm.allergens || 'None specified'}</div>
                          <div><strong>Broadcast:</strong> Instant to All Verified Receivers</div>
                        </div>
                      </div>

                      <div className="dd-step-nav-footer">
                        <button
                          type="button"
                          className="dd-btn-step-prev"
                          onClick={() => setDonationStep(3)}
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          className="dd-modal-submit-btn"
                          disabled={submitting}
                        >
                          {submitting ? 'Publishing Listing...' : '🚀 Confirm & Publish Donation'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL 2: INSPECT DONATION DETAILS ═══════════ */}
      <AnimatePresence>
        {selectedDonationDetail && (
          <div className="dd-modal-backdrop" onClick={() => setSelectedDonationDetail(null)}>
            <motion.div
              className="dd-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="dd-modal-close"
                onClick={() => setSelectedDonationDetail(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="dd-modal-body">
                <div className="dd-inspect-img-wrap">
                  <img
                    src={selectedDonationDetail.image_url || '/assets/dish_biryani.jpg'}
                    alt={selectedDonationDetail.food_name}
                    className="dd-inspect-img"
                  />
                  <span className={`dd-card-status-badge dd-status-${selectedDonationDetail.status || 'available'}`}>
                    {(selectedDonationDetail.status || 'Available').toUpperCase()}
                  </span>
                </div>

                <h3 className="dd-inspect-title">{selectedDonationDetail.food_name}</h3>
                <p className="dd-inspect-desc">{selectedDonationDetail.description || 'No additional notes provided.'}</p>

                <div className="dd-inspect-grid-details">
                  <div><strong>Category:</strong> {selectedDonationDetail.category || 'Cooked Meals'}</div>
                  <div><strong>Collection Method:</strong> {selectedDonationDetail.fulfillment_type === 'donor_delivery' ? '🚗 Donor Delivery' : '🚶 Receiver Pickup'}</div>
                  <div><strong>Servings:</strong> {selectedDonationDetail.servings || 10} portions</div>
                  <div><strong>Approx Weight:</strong> {selectedDonationDetail.food_weight_kg || 2.5} kg</div>
                  <div><strong>{selectedDonationDetail.fulfillment_type === 'donor_delivery' ? 'Dispatch Kitchen:' : 'Pickup Point:'}</strong> {selectedDonationDetail.pickup_location}</div>
                  <div><strong>Listed Date:</strong> {new Date(selectedDonationDetail.created_at).toLocaleDateString('en-GB')}</div>
                  <div><strong>Storage:</strong> {selectedDonationDetail.storage_condition || 'Room Temp'}</div>
                </div>

                <div className="dd-inspect-actions-row">
                  <button
                    type="button"
                    className="dd-btn-inspect-edit"
                    onClick={() => {
                      const item = selectedDonationDetail;
                      setSelectedDonationDetail(null);
                      handleOpenEditDonation({ raw: item });
                    }}
                  >
                    Edit Listing
                  </button>
                  <button
                    type="button"
                    className="dd-btn-inspect-delete"
                    onClick={() => handleDeleteDonation(selectedDonationDetail.id)}
                  >
                    Delete Listing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL 3: EDIT DONATION ═══════════ */}
      <AnimatePresence>
        {editingDonation && (
          <div className="dd-modal-backdrop" onClick={() => setEditingDonation(null)}>
            <motion.div
              className="dd-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="dd-modal-close"
                onClick={() => setEditingDonation(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="dd-modal-body">
                <h3>Edit Food Listing</h3>
                <form onSubmit={handleSaveEditDonation}>
                  <div className="dd-modal-field">
                    <label htmlFor="dd-edit-fulfillment-type">Collection / Fulfillment Method</label>
                    <select
                      id="dd-edit-fulfillment-type"
                      name="fulfillment_type"
                      value={editForm.fulfillment_type}
                      onChange={(e) => setEditForm({ ...editForm, fulfillment_type: e.target.value })}
                    >
                      <option value="receiver_pickup">🚶 Receiver Pickup (Receiver collects at your location)</option>
                      <option value="donor_delivery">🚗 Donor Delivery (You deliver to receiver address)</option>
                    </select>
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-edit-food-title">Food Item Title</label>
                    <input
                      id="dd-edit-food-title"
                      name="food_name"
                      type="text"
                      value={editForm.food_name}
                      onChange={(e) => setEditForm({ ...editForm, food_name: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-edit-category">Category</label>
                    <select
                      id="dd-edit-category"
                      name="category"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="Cooked Meals">Cooked Meals</option>
                      <option value="Bakery & Breads">Bakery & Breads</option>
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Dairy & Groceries">Dairy & Groceries</option>
                      <option value="Packaged Food">Packaged Food</option>
                    </select>
                  </div>

                  <div className="dd-modal-grid-2">
                    <div className="dd-modal-field">
                      <label htmlFor="dd-edit-servings">Servings</label>
                      <input
                        id="dd-edit-servings"
                        name="servings"
                        type="number"
                        min="1"
                        value={editForm.servings}
                        onChange={(e) => setEditForm({ ...editForm, servings: e.target.value })}
                        required
                        autoComplete="off"
                      />
                    </div>
                    <div className="dd-modal-field">
                      <label htmlFor="dd-edit-weight">Weight (kg)</label>
                      <input
                        id="dd-edit-weight"
                        name="food_weight_kg"
                        type="number"
                        step="0.1"
                        value={editForm.food_weight_kg}
                        onChange={(e) => setEditForm({ ...editForm, food_weight_kg: e.target.value })}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-edit-location">
                      {editForm.fulfillment_type === 'donor_delivery'
                        ? 'Dispatch / Base Location'
                        : 'Pickup Location'}
                    </label>
                    <input
                      id="dd-edit-location"
                      name="pickup_location"
                      type="text"
                      value={editForm.pickup_location}
                      onChange={(e) => setEditForm({ ...editForm, pickup_location: e.target.value })}
                      required
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-edit-photo">Change Photo (optional)</label>
                    <input
                      id="dd-edit-photo"
                      name="editPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                      style={{ fontSize: '13px', padding: '6px 0' }}
                    />
                  </div>

                  <button type="submit" className="dd-modal-submit-btn" disabled={submitting}>
                    {submitting ? 'Saving Changes...' : 'Save Listing Updates'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL 4: PREMIUM IMPACT CERTIFICATE ═══════════ */}
      <AnimatePresence>
        {viewingCertificate && (
          <div className="dd-modal-backdrop dd-cert-backdrop" onClick={() => setViewingCertificate(null)}>
            <motion.div
              className="dd-modal-box dd-cert-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            >
              <button
                type="button"
                className="dd-modal-close dd-cert-close-btn"
                onClick={() => setViewingCertificate(null)}
                aria-label="Close certificate"
              >
                ✕
              </button>

              {/* Certificate Frame with Guilloche Gold & Emerald Borders */}
              <div className="dd-cert-card" id="foodbridge-impact-certificate">
                <div className="dd-cert-outer-border">
                  <div className="dd-cert-inner-border">
                    {/* Corner Ornaments */}
                    <div className="dd-cert-corner dd-cert-corner-tl" />
                    <div className="dd-cert-corner dd-cert-corner-tr" />
                    <div className="dd-cert-corner dd-cert-corner-bl" />
                    <div className="dd-cert-corner dd-cert-corner-br" />

                    {/* Watermark Emblem */}
                    <div className="dd-cert-watermark" aria-hidden="true" />

                    {/* Certificate Content */}
                    <div className="dd-cert-content">
                      {/* Header Crest & Title */}
                      <div className="dd-cert-header">
                        <div className="dd-cert-emblem-wrap">
                          <div className="dd-cert-emblem-icon">🌱</div>
                        </div>
                        <span className="dd-cert-org-title">FoodBridge Global Zero Hunger Network</span>
                        <h1 className="dd-cert-main-heading">Certificate of Social Impact</h1>
                        <span className="dd-cert-sub-heading">
                          United Nations Sustainable Development Goals (SDG 2 & 12) Commendation
                        </span>
                        <div className="dd-cert-divider-line">
                          <span className="dd-cert-divider-diamond">◆</span>
                        </div>
                      </div>

                      {/* Recipient Section */}
                      <div className="dd-cert-recipient-section">
                        <p className="dd-cert-conferred-txt">This official credential of distinction is conferred upon</p>
                        <h2 className="dd-cert-recipient-name">{displayName}</h2>
                        <div className="dd-cert-recipient-role-badge">
                          <span>🌟 Verified Zero-Waste Hero & Community Pillar</span>
                        </div>
                      </div>

                      {/* Commendation Citation */}
                      <p className="dd-cert-citation-body">
                        In formal recognition of exceptional humanitarian and environmental stewardship through the contribution of{' '}
                        <strong>"{viewingCertificate.title || 'Community Surplus Food Share'}"</strong>, preventing municipal food wastage, conserving precious environmental resources, and delivering vital nourishment directly to local community members in need.
                      </p>

                      {/* Verified Metric Badges Grid */}
                      <div className="dd-cert-metrics-showcase">
                        <div className="dd-cert-metric-pill">
                          <div className="dd-cert-metric-icon">🍲</div>
                          <div className="dd-cert-metric-data">
                            <span className="dd-cert-metric-val">{viewingCertificate.servings || 10}</span>
                            <span className="dd-cert-metric-lbl">Meals Shared</span>
                          </div>
                        </div>

                        <div className="dd-cert-metric-pill">
                          <div className="dd-cert-metric-icon">⚖️</div>
                          <div className="dd-cert-metric-data">
                            <span className="dd-cert-metric-val">{viewingCertificate.food_weight_kg || 2.5} kg</span>
                            <span className="dd-cert-metric-lbl">Food Rescued</span>
                          </div>
                        </div>

                        <div className="dd-cert-metric-pill">
                          <div className="dd-cert-metric-icon">🌿</div>
                          <div className="dd-cert-metric-data">
                            <span className="dd-cert-metric-val">
                              {(parseFloat(viewingCertificate.food_weight_kg || 2.5) * 2.98).toFixed(1)} kg
                            </span>
                            <span className="dd-cert-metric-lbl">CO₂e Abated</span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures & Golden Official Seal */}
                      <div className="dd-cert-auth-row">
                        {/* Signature 1 */}
                        <div className="dd-cert-sig-box">
                          <div className="dd-cert-sig-line">
                            <span className="dd-cert-sig-script">Elena Vance</span>
                          </div>
                          <span className="dd-cert-sig-name">Dr. Elena Vance</span>
                          <span className="dd-cert-sig-title">Director of Community Relief, FoodBridge</span>
                        </div>

                        {/* Golden Embossed Official Seal */}
                        <div className="dd-cert-official-seal">
                          <div className="dd-cert-seal-ribbon" />
                          <div className="dd-cert-seal-inner">
                            <div className="dd-cert-seal-star">★</div>
                            <span className="dd-cert-seal-txt">VERIFIED IMPACT</span>
                            <span className="dd-cert-seal-sub">OFFICIAL SEAL</span>
                            <div className="dd-cert-seal-star">★</div>
                          </div>
                        </div>

                        {/* Signature 2 */}
                        <div className="dd-cert-sig-box">
                          <div className="dd-cert-sig-line">
                            <span className="dd-cert-sig-script">Aditya Sharma</span>
                          </div>
                          <span className="dd-cert-sig-name">A. Sharma</span>
                          <span className="dd-cert-sig-title">Lead Trustee, Food Logistics Network</span>
                        </div>
                      </div>

                      {/* Verification Metadata Footer */}
                      <div className="dd-cert-metadata-bar">
                        <div className="dd-cert-meta-item">
                          <span className="dd-cert-meta-k">Credential ID</span>
                          <span className="dd-cert-meta-v">
                            #FB-CERT-{viewingCertificate.id ? String(viewingCertificate.id).slice(0, 8).toUpperCase() : '8X92-2026'}
                          </span>
                        </div>
                        <div className="dd-cert-meta-item">
                          <span className="dd-cert-meta-k">Issuance Date</span>
                          <span className="dd-cert-meta-v">
                            {viewingCertificate.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="dd-cert-meta-item">
                          <span className="dd-cert-meta-k">Registry Status</span>
                          <span className="dd-cert-meta-v dd-verified-green">✓ Cryptographically Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Action Toolbar */}
              <div className="dd-cert-action-toolbar">
                <button
                  type="button"
                  className="dd-btn-cert-action dd-btn-cert-print"
                  onClick={() => window.print()}
                >
                  🖨️ Print / Save Official PDF
                </button>
                <button
                  type="button"
                  className="dd-btn-cert-action dd-btn-cert-copy"
                  onClick={() => {
                    const certCode = `#FB-CERT-${viewingCertificate.id ? String(viewingCertificate.id).slice(0, 8).toUpperCase() : '8X92-2026'}`;
                    navigator.clipboard?.writeText?.(certCode);
                    showToast(`Certificate ID ${certCode} copied to clipboard!`, 'success');
                  }}
                >
                  📋 Copy Credential ID
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL 5: QUICK SCHEDULE ═══════════ */}
      <AnimatePresence>
        {activeQuickModal === 'schedule' && (
          <div className="dd-modal-backdrop" onClick={() => setActiveQuickModal(null)}>
            <motion.div
              className="dd-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="dd-modal-close"
                onClick={() => setActiveQuickModal(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="dd-modal-body">
                <h3>Schedule Volunteer Pickup Slot</h3>
                <p>Book a dedicated volunteer pickup window with a trusted NGO partner.</p>

                <form onSubmit={handleSchedulePickup}>
                  <div className="dd-modal-field">
                    <label htmlFor="dd-modal-quick-schedule-ngo">Assign to Partner NGO / Organization</label>
                    <select
                      id="dd-modal-quick-schedule-ngo"
                      name="ngoName"
                      value={pickupForm.ngoName}
                      onChange={(e) => setPickupForm({ ...pickupForm, ngoName: e.target.value })}
                    >
                      {registeredNgos.map((ngo) => (
                        <option key={ngo.id} value={ngo.name}>
                          {ngo.name} {ngo.city ? `(${ngo.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-modal-quick-schedule-date">Pickup Date</label>
                    <input
                      id="dd-modal-quick-schedule-date"
                      name="date"
                      type="date"
                      value={pickupForm.date}
                      onChange={(e) => setPickupForm({ ...pickupForm, date: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="dd-modal-field">
                    <label htmlFor="dd-modal-quick-schedule-timeslot">Preferred Time Slot</label>
                    <select
                      id="dd-modal-quick-schedule-timeslot"
                      name="timeSlot"
                      value={pickupForm.timeSlot}
                      onChange={(e) => setPickupForm({ ...pickupForm, timeSlot: e.target.value })}
                    >
                      <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (01:00 PM - 04:00 PM)">Afternoon (01:00 PM - 04:00 PM)</option>
                      <option value="Evening (05:00 PM - 08:00 PM)">Evening (05:00 PM - 08:00 PM)</option>
                    </select>
                  </div>

                  <button type="submit" className="dd-modal-submit-btn" disabled={submitting}>
                    {submitting ? 'Confirming with NGO...' : 'Confirm Schedule'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ MODAL 6: PROFILE & SETTINGS STUDIO ═══════════ */}
      <AvatarPicker
        isOpen={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        currentAvatar={profile?.avatar_url}
        userId={user?.id}
        profile={profile}
        user={user}
        onAvatarChange={() => {
          refreshProfile();
          showToast('Profile & settings updated successfully!', 'success');
        }}
      />
    </div>
  );
}

