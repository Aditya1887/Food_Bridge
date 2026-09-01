import { supabase } from '../lib/supabase';

/**
 * Built-in AI-Generated 3D Animation Character Avatars
 * High-quality 3D rendered character avatars representing FoodBridge community heroes
 */
export const BUILT_IN_AVATARS = [
  {
    id: 'avatar_eco_hero',
    label: 'Eco Hero',
    category: 'Heroes',
    role: 'Food Rescuer',
    src: '/assets/avatars/avatar_eco_hero.jpg',
    color: '#16a34a',
    bg: '#dcfce7',
    desc: 'Passionate green crusader fighting everyday food waste',
  },
  {
    id: 'avatar_chef_smile',
    label: 'Master Chef',
    category: 'Chefs & Bakers',
    role: 'Culinary Donor',
    src: '/assets/avatars/avatar_chef_smile.jpg',
    color: '#d97706',
    bg: '#fef3c7',
    desc: 'Crafting quality surplus into wholesome meals',
  },
  {
    id: 'avatar_community_heart',
    label: 'Community Angel',
    category: 'Volunteers',
    role: 'Relief Coordinator',
    src: '/assets/avatars/avatar_community_heart.jpg',
    color: '#3b82f6',
    bg: '#dbeafe',
    desc: 'Connecting local families with care and warmth',
  },
  {
    id: 'avatar_baker_joy',
    label: 'Artisan Baker',
    category: 'Chefs & Bakers',
    role: 'Bakery Partner',
    src: '/assets/avatars/avatar_baker_joy.jpg',
    color: '#ea580c',
    bg: '#ffedd5',
    desc: 'Sharing daily fresh artisanal bread & treats',
  },
  {
    id: 'avatar_courier_swift',
    label: 'Swift Courier',
    category: 'Heroes',
    role: 'Express Logistics',
    src: '/assets/avatars/avatar_courier_swift.jpg',
    color: '#059669',
    bg: '#ecfdf5',
    desc: 'Rapid zero-emission food rescue and delivery',
  },
  {
    id: 'avatar_caregiver_warm',
    label: 'Warm Caregiver',
    category: 'Community',
    role: 'Shelter Director',
    src: '/assets/avatars/avatar_caregiver_warm.jpg',
    color: '#0891b2',
    bg: '#cffafe',
    desc: 'Nurturing shelter residents & senior communities',
  },
  {
    id: 'avatar_gardener_green',
    label: 'Sprout Farmer',
    category: 'Heroes',
    role: 'Organic Farmer',
    src: '/assets/avatars/avatar_gardener_green.jpg',
    color: '#65a30d',
    bg: '#ecfccb',
    desc: 'Growing & sharing farm-fresh sustainable crops',
  },
  {
    id: 'avatar_hero_girl',
    label: 'Champion Girl',
    category: 'Heroes',
    role: 'Youth Ambassador',
    src: '/assets/avatars/avatar_hero_girl.jpg',
    color: '#15803d',
    bg: '#dcfce7',
    desc: 'Inspiring zero-hunger action in every neighborhood',
  },
];

/**
 * Convert an SVG string to a data URI for use as an image src (fallback)
 */
export function svgToDataUri(svgString) {
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
}

/**
 * Get the display avatar URL for a user profile or user auth object.
 * Supports:
 * - Built-in 3D avatars (by ID or filename)
 * - Google OAuth profile pictures (googleusercontent.com, etc.)
 * - Uploaded images (Supabase storage public URL, relative paths, Base64 data URIs, Blobs)
 * - Multiple field name fallbacks (avatar_url, avatar, picture, photo_url, user_metadata, etc.)
 */
export function getAvatarUrl(profile, user) {
  // Extract all possible avatar fields across profile and user objects
  let avatarVal =
    profile?.avatar_url ||
    profile?.avatar ||
    profile?.photo_url ||
    profile?.picture ||
    profile?.image_url ||
    profile?.profile_picture ||
    profile?.user_metadata?.avatar_url ||
    profile?.user_metadata?.picture ||
    user?.avatar_url ||
    user?.photo_url ||
    user?.picture ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture;

  if (!avatarVal) return null;

  if (typeof avatarVal !== 'string') {
    if (typeof avatarVal === 'object' && avatarVal.src) {
      avatarVal = avatarVal.src;
    } else {
      return null;
    }
  }

  avatarVal = avatarVal.trim().replace(/^["']|["']$/g, '');
  if (!avatarVal) return null;

  // 1. Check for built-in avatar selection (stored as avatar id like 'avatar_eco_hero')
  const builtInById = BUILT_IN_AVATARS.find(
    (a) => a.id.toLowerCase() === avatarVal.toLowerCase()
  );
  if (builtInById) {
    return builtInById.src;
  }

  // 2. Check if avatarVal matches a built-in avatar src or filename
  const builtInBySrc = BUILT_IN_AVATARS.find(
    (a) =>
      a.src.toLowerCase() === avatarVal.toLowerCase() ||
      avatarVal.toLowerCase().endsWith(a.src.toLowerCase().replace('/assets/', '')) ||
      avatarVal.toLowerCase().includes(a.id.toLowerCase())
  );
  if (builtInBySrc) {
    return builtInBySrc.src;
  }

  // 3. Absolute URLs (Google OAuth profile pictures, Supabase storage public URLs, external CDNs)
  if (/^https?:\/\//i.test(avatarVal) || avatarVal.startsWith('//')) {
    return avatarVal;
  }

  // 4. Data URIs or Blob URLs
  if (avatarVal.startsWith('data:image/') || avatarVal.startsWith('blob:')) {
    return avatarVal;
  }

  // 5. Absolute / relative asset paths
  if (avatarVal.startsWith('/assets/') || avatarVal.startsWith('assets/')) {
    return avatarVal.startsWith('/') ? avatarVal : `/${avatarVal}`;
  }

  if (avatarVal.startsWith('/')) {
    return avatarVal;
  }

  // 6. Supabase Storage relative paths (e.g. 'avatars/uuid/filename.jpg' or 'uuid/filename.jpg')
  if (avatarVal.includes('/') && !avatarVal.includes(' ')) {
    try {
      const cleanPath = avatarVal.replace(/^avatars\//, '');
      const { data } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

/**
 * Get user initials for fallback avatar display
 */
export function getUserInitials(profile, user) {
  const name =
    profile?.full_name ||
    profile?.name ||
    profile?.organization_name ||
    profile?.email?.split('@')[0] ||
    user?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'U';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Convert a file to an optimized base64 data URI (max 256x256)
 * Guarantees custom avatar support even if storage policies block bucket upload
 */
export async function fileToOptimizedDataUri(file, maxDimension = 256) {
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
 * Upload a custom avatar image to Supabase Storage with automatic fallback
 * Returns the public URL or optimized data URI
 */
export async function uploadAvatarFile(userId, file) {
  if (!userId || !file) throw new Error('User ID and file are required');

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    // Try uploading to Supabase Storage 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    } else {
      console.warn('Supabase storage upload notice:', uploadError.message);
    }
  } catch (storageErr) {
    console.warn('Storage bucket upload notice:', storageErr.message);
  }

  // Guaranteed fallback: convert image to optimized data URI so upload NEVER fails
  return await fileToOptimizedDataUri(file);
}

/**
 * Update the avatar_url in the user's profile
 */
export async function updateProfileAvatar(userId, avatarUrl) {
  if (!userId) throw new Error('User ID is required');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('updateProfileAvatar DB notice:', error.message);
      // Fallback: if profile row doesn't exist or column issue, try upserting with minimum fields
      const { data: upsertData } = await supabase
        .from('profiles')
        .upsert([{ id: userId, avatar_url: avatarUrl }])
        .select()
        .maybeSingle();

      return upsertData;
    }
    return data;
  } catch (err) {
    console.warn('updateProfileAvatar error handled:', err.message);
    return null;
  }
}
