import { supabase } from '../lib/supabase';

/**
 * Built-in avatar options — colorful SVG data URIs
 * Each avatar has a unique id, label, and background color scheme
 */
export const BUILT_IN_AVATARS = [
  {
    id: 'avatar_leaf',
    label: 'Green Leaf',
    bg: '#dcfce7',
    color: '#16a34a',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#dcfce7"/><path d="M40 15 C30 25 25 40 35 55 C38 60 42 60 45 55 C55 40 50 25 40 15Z" fill="#16a34a"/><path d="M40 55 C40 40 35 30 30 22" stroke="#15803d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'avatar_sun',
    label: 'Warm Sun',
    bg: '#fef9c3',
    color: '#ca8a04',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fef9c3"/><circle cx="40" cy="40" r="16" fill="#f59e0b"/><g stroke="#f59e0b" stroke-width="3" stroke-linecap="round"><line x1="40" y1="12" x2="40" y2="18"/><line x1="40" y1="62" x2="40" y2="68"/><line x1="12" y1="40" x2="18" y2="40"/><line x1="62" y1="40" x2="68" y2="40"/><line x1="20" y1="20" x2="24" y2="24"/><line x1="56" y1="56" x2="60" y2="60"/><line x1="20" y1="60" x2="24" y2="56"/><line x1="56" y1="24" x2="60" y2="20"/></g></svg>`,
  },
  {
    id: 'avatar_heart',
    label: 'Kind Heart',
    bg: '#fce7f3',
    color: '#db2777',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fce7f3"/><path d="M40 62 C28 50 16 42 16 30 C16 22 22 16 30 16 C34 16 38 18 40 22 C42 18 46 16 50 16 C58 16 64 22 64 30 C64 42 52 50 40 62Z" fill="#ec4899"/></svg>`,
  },
  {
    id: 'avatar_bowl',
    label: 'Food Bowl',
    bg: '#dbeafe',
    color: '#2563eb',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#dbeafe"/><path d="M15 40 Q40 20 65 40" stroke="#3b82f6" stroke-width="3" fill="none"/><path d="M15 42 C20 58 60 58 65 42" stroke="#3b82f6" stroke-width="3" fill="none"/><line x1="28" y1="28" x2="28" y2="38" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="24" x2="40" y2="38" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/><line x1="52" y1="28" x2="52" y2="38" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'avatar_star',
    label: 'Bright Star',
    bg: '#fef3c7',
    color: '#d97706',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fef3c7"/><path d="M40 14 L46 30 L63 30 L49 40 L54 56 L40 46 L26 56 L31 40 L17 30 L34 30 Z" fill="#f59e0b"/></svg>`,
  },
  {
    id: 'avatar_wave',
    label: 'Ocean Wave',
    bg: '#e0f2fe',
    color: '#0284c7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#e0f2fe"/><path d="M10 45 Q20 30 30 45 Q40 60 50 45 Q60 30 70 45" stroke="#0ea5e9" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M10 55 Q20 40 30 55 Q40 70 50 55 Q60 40 70 55" stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/></svg>`,
  },
  {
    id: 'avatar_mountain',
    label: 'Green Mountain',
    bg: '#ecfdf5',
    color: '#059669',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#ecfdf5"/><path d="M10 60 L30 25 L40 38 L55 18 L70 60Z" fill="#10b981"/><path d="M55 18 L62 30 L48 30Z" fill="#d1fae5"/></svg>`,
  },
  {
    id: 'avatar_flower',
    label: 'Spring Flower',
    bg: '#fdf2f8',
    color: '#c026d3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fdf2f8"/><circle cx="40" cy="30" r="8" fill="#e879f9"/><circle cx="48" cy="38" r="8" fill="#d946ef"/><circle cx="44" cy="48" r="8" fill="#e879f9"/><circle cx="36" cy="48" r="8" fill="#d946ef"/><circle cx="32" cy="38" r="8" fill="#e879f9"/><circle cx="40" cy="40" r="6" fill="#fbbf24"/></svg>`,
  },
];

/**
 * Convert an SVG string to a data URI for use as an image src
 */
export function svgToDataUri(svgString) {
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
}

/**
 * Get the display avatar URL for a user profile
 * Priority: custom uploaded URL > built-in avatar > initials fallback
 */
export function getAvatarUrl(profile, user) {
  // 1. Check for custom uploaded avatar URL (Supabase Storage)
  if (profile?.avatar_url && profile.avatar_url.startsWith('http')) {
    return profile.avatar_url;
  }

  // 2. Check for built-in avatar selection (stored as avatar id like 'avatar_leaf')
  if (profile?.avatar_url) {
    const builtIn = BUILT_IN_AVATARS.find((a) => a.id === profile.avatar_url);
    if (builtIn) {
      return svgToDataUri(builtIn.svg);
    }
  }

  // 3. Check user metadata
  if (user?.user_metadata?.avatar_url) {
    const metaAvatar = user.user_metadata.avatar_url;
    if (metaAvatar.startsWith('http')) return metaAvatar;
    const builtIn = BUILT_IN_AVATARS.find((a) => a.id === metaAvatar);
    if (builtIn) return svgToDataUri(builtIn.svg);
  }

  // 4. Return null — caller should show initials fallback
  return null;
}

/**
 * Get user initials for fallback avatar display
 */
export function getUserInitials(profile, user) {
  const name =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'U';

  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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
