/**
 * citySearch.js — Indian city directory and geocoding via OpenStreetMap Nominatim API.
 * Strictly restricted to India (countrycodes: 'in').
 * Cached in-memory to avoid duplicate network requests.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

// In-memory cache: query string → results array
const cache = new Map();

// Default fallback (Mumbai)
export const DEFAULT_CITY = {
  id: 'mumbai',
  name: 'Mumbai, Maharashtra',
  lat: 19.076,
  lng: 72.8777,
};

/**
 * Curated list of major Indian cities across various states.
 */
export const POPULAR_INDIAN_CITIES = [
  { id: 'mumbai', name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'delhi', name: 'Delhi NCR, India', lat: 28.6139, lng: 77.2090 },
  { id: 'bengaluru', name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  { id: 'hyderabad', name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  { id: 'ahmedabad', name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
  { id: 'chennai', name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { id: 'kolkata', name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
  { id: 'pune', name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { id: 'jaipur', name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  { id: 'surat', name: 'Surat, Gujarat', lat: 21.1702, lng: 72.8311 },
  { id: 'lucknow', name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { id: 'chandigarh', name: 'Chandigarh, Punjab', lat: 30.7333, lng: 76.7794 },
  { id: 'indore', name: 'Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { id: 'nagpur', name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 },
  { id: 'bhopal', name: 'Bhopal, Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { id: 'patna', name: 'Patna, Bihar', lat: 25.5941, lng: 85.1376 },
  { id: 'vadodara', name: 'Vadodara, Gujarat', lat: 22.3072, lng: 73.1812 },
  { id: 'ghaziabad', name: 'Ghaziabad, Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { id: 'ludhiana', name: 'Ludhiana, Punjab', lat: 30.9010, lng: 75.8573 },
  { id: 'agra', name: 'Agra, Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { id: 'nashik', name: 'Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
  { id: 'varanasi', name: 'Varanasi, Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { id: 'amritsar', name: 'Amritsar, Punjab', lat: 31.6340, lng: 74.8723 },
  { id: 'visakhapatnam', name: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { id: 'kochi', name: 'Kochi, Kerala', lat: 9.9312, lng: 76.2673 },
  { id: 'coimbatore', name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram, Kerala', lat: 8.5241, lng: 76.9366 },
  { id: 'guwahati', name: 'Guwahati, Assam', lat: 26.1445, lng: 91.7362 },
  { id: 'bhubaneswar', name: 'Bhubaneswar, Odisha', lat: 20.2961, lng: 85.8245 },
  { id: 'dehradun', name: 'Dehradun, Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { id: 'goa', name: 'Panaji, Goa', lat: 15.4909, lng: 73.8278 },
  { id: 'srinagar', name: 'Srinagar, Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { id: 'ranchi', name: 'Ranchi, Jharkhand', lat: 23.3441, lng: 85.3096 },
  { id: 'jodhpur', name: 'Jodhpur, Rajasthan', lat: 26.2389, lng: 73.0243 },
  { id: 'raipur', name: 'Raipur, Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { id: 'mysore', name: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394 },
  { id: 'gurugram', name: 'Gurugram, Haryana', lat: 28.4595, lng: 77.0266 },
  { id: 'noida', name: 'Noida, Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { id: 'kanpur', name: 'Kanpur, Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { id: 'jabalpur', name: 'Jabalpur, Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { id: 'gwalior', name: 'Gwalior, Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { id: 'vijayawada', name: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { id: 'madurai', name: 'Madurai, Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { id: 'kota', name: 'Kota, Rajasthan', lat: 25.2138, lng: 75.8648 },
  { id: 'shimla', name: 'Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
];

export const INDIAN_CITY_NAMES = POPULAR_INDIAN_CITIES.map((c) => c.name);

/**
 * Search for Indian cities matching a query string.
 * Strictly restricted to India via countrycodes: 'in'.
 * Returns an array of { id, name, lat, lng } objects.
 * @param {string} query — Search term
 * @param {number} limit — Max results (default 10)
 * @returns {Promise<Array<{id: string, name: string, lat: number, lng: number}>>}
 */
export async function searchCities(query, limit = 10) {
  const trimmed = (query || '').trim();

  // If no query, return the default popular Indian cities
  if (trimmed.length === 0) {
    return POPULAR_INDIAN_CITIES;
  }

  // Check matching cities from curated local Indian list
  const localMatches = POPULAR_INDIAN_CITIES.filter((c) =>
    c.name.toLowerCase().includes(trimmed.toLowerCase())
  );

  // If less than 2 characters, return local matches
  if (trimmed.length < 2) {
    return localMatches;
  }

  const cacheKey = `search_in:${trimmed.toLowerCase()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      addressdetails: '1',
      limit: String(limit),
      countrycodes: 'in', // STRICTLY INDIA
    });

    const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: { 'User-Agent': 'FoodBridge/1.0 (foodbridge-sandy.vercel.app)' },
    });

    if (!res.ok) return localMatches;

    const data = await res.json();
    const apiResults = data
      // Extra safety check: ensure country_code is 'in'
      .filter((item) => !item.address?.country_code || item.address.country_code === 'in')
      .map((item) => {
        const parts = item.display_name?.split(',').map((s) => s.trim()) || [];
        const cleanName = parts.slice(0, 3).join(', ');
        return {
          id: String(item.place_id),
          name: cleanName,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });

    // Merge apiResults with localMatches, deduplicating
    const combined = [...localMatches];
    apiResults.forEach((apiItem) => {
      const exists = combined.some(
        (c) =>
          c.name.toLowerCase() === apiItem.name.toLowerCase() ||
          c.name.toLowerCase().split(',')[0].trim() === apiItem.name.toLowerCase().split(',')[0].trim()
      );
      if (!exists) {
        combined.push(apiItem);
      }
    });

    cache.set(cacheKey, combined);
    return combined;
  } catch (err) {
    console.warn('citySearch: Nominatim lookup failed:', err.message);
    return localMatches;
  }
}

/**
 * Geocode an Indian city name to { lat, lng }.
 * Strictly looks up within India.
 * @param {string} cityName — e.g. "Jaipur, Rajasthan"
 * @returns {Promise<{id: string, name: string, lat: number, lng: number}>}
 */
export async function geocodeCity(cityName) {
  const trimmed = (cityName || '').trim();
  if (!trimmed) return DEFAULT_CITY;

  // First check local Indian cities list
  const localMatch = POPULAR_INDIAN_CITIES.find((c) => {
    const cName = c.name.toLowerCase();
    const qName = trimmed.toLowerCase();
    return cName.includes(qName) || qName.includes(c.id) || qName.includes(cName.split(',')[0].trim());
  });
  if (localMatch) return localMatch;

  const cacheKey = `geo_in:${trimmed.toLowerCase()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const params = new URLSearchParams({
      q: `${trimmed}, India`,
      format: 'json',
      countrycodes: 'in', // STRICTLY INDIA
      limit: '1',
    });

    const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: { 'User-Agent': 'FoodBridge/1.0 (foodbridge-sandy.vercel.app)' },
    });

    if (!res.ok) return { ...DEFAULT_CITY, name: trimmed };

    const data = await res.json();
    if (data.length === 0) return { ...DEFAULT_CITY, name: trimmed };

    const item = data[0];
    const result = {
      id: String(item.place_id),
      name: trimmed,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('citySearch: geocodeCity failed:', err.message);
    return { ...DEFAULT_CITY, name: trimmed };
  }
}
