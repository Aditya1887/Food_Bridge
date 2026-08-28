import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../ThemeContext';
import './MapView.css';

/**
 * Standard OpenStreetMap Tile URL & Attribution
 */
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
const DARK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

/**
 * Calculate distance between two lat/lng points (Haversine formula in km)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Custom SVG Pin Icons for Leaflet ──
const createFoodMarkerIcon = () =>
  L.divIcon({
    className: 'food-marker-container',
    html: `
      <div class="fb-marker-pin">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#16a34a">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
        </svg>
        <span class="fb-marker-pulse"></span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  });

const createUserLocationIcon = () =>
  L.divIcon({
    className: 'user-marker-container',
    html: `
      <div class="fb-user-pin">
        <div class="fb-user-core"></div>
        <div class="fb-user-ripple"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

/**
 * 100% Free & Open-Source MapView using Leaflet & OpenStreetMap (OSM)
 */
export default function MapView({
  items = [],
  center,
  rescueRadius = 10,
  onItemClick,
  onLocationChange,
  height = '500px',
  showRadius = true,
}) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const circleRef = useRef(null);
  const foodGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const searchTimerRef = useRef(null);

  const [userLocation, setUserLocation] = useState(center || { lat: 19.076, lng: 72.8777 }); // Default Mumbai
  const [locationName, setLocationName] = useState('Mumbai, Maharashtra');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // ── GPS Geolocation ──
  const detectLiveLocation = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(newPos);
          setLocationName('Your Current GPS Location');
          setSearchQuery('Current Location');
          setIsLocating(false);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([newPos.lat, newPos.lng], 13, { duration: 1.2 });
          }
          if (onLocationChange) onLocationChange(newPos);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  }, [onLocationChange]);

  // Initial detection or sync when center changes
  useEffect(() => {
    if (center && center.lat && center.lng) {
      setUserLocation(center);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([center.lat, center.lng], 13, { duration: 0.8 });
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([center.lat, center.lng]);
        }
        if (circleRef.current) {
          circleRef.current.setLatLng([center.lat, center.lng]);
        }
      }
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detected = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(detected);
          setLocationName('Your Location');
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [center]);

  // ── Initialize Leaflet Map ──
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Zoom controls on bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap official attribution
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution(OSM_ATTRIBUTION)
        .addTo(map);

      // Pure OpenStreetMap tiles (100% free, zero keys)
      const tiles = L.tileLayer(OSM_TILE_URL, {
        maxZoom: 19,
        attribution: OSM_ATTRIBUTION,
      }).addTo(map);

      tileLayerRef.current = tiles;

      // Group for all food markers
      const foodGroup = L.layerGroup().addTo(map);
      foodGroupRef.current = foodGroup;

      // User location marker
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserLocationIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
      userMarker.bindTooltip('Your Location', { permanent: false, direction: 'top' });
      userMarkerRef.current = userMarker;

      // Rescue Radius Circle
      if (showRadius) {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: rescueRadius * 1000,
          color: '#16a34a',
          weight: 2,
          opacity: 0.7,
          fillColor: '#22c55e',
          fillOpacity: 0.08,
        }).addTo(map);
        circleRef.current = circle;
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Proper Leaflet cleanup to prevent memory leaks
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        circleRef.current = null;
        foodGroupRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update user pin and radius circle when userLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Update rescue radius circle size
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(rescueRadius * 1000);
    }
  }, [rescueRadius]);

  // Switch tile layer when dark mode toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newTiles = L.tileLayer(
      isDark ? DARK_TILE_URL : OSM_TILE_URL,
      {
        maxZoom: 19,
        attribution: isDark ? DARK_ATTRIBUTION : OSM_ATTRIBUTION,
      }
    ).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTiles;
  }, [isDark]);

  // ── Render Food Markers & Popups ──
  useEffect(() => {
    if (!mapInstanceRef.current || !foodGroupRef.current) return;

    foodGroupRef.current.clearLayers();

    items.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const dist = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, Number(item.latitude), Number(item.longitude)).toFixed(1)
        : '?';

      const isWithinRadius = userLocation && Number(dist) <= rescueRadius;

      const marker = L.marker([Number(item.latitude), Number(item.longitude)], {
        icon: createFoodMarkerIcon(),
        opacity: isWithinRadius ? 1.0 : 0.5,
      });

      const popupHtml = `
        <div class="fb-popup-card">
          <div class="fb-popup-head">
            <h4 class="fb-popup-title">${item.food_name || item.title || 'Food Donation'}</h4>
            <span class="fb-popup-badge">${item.category || 'Cooked Meals'}</span>
          </div>
          <p class="fb-popup-portions">🍲 <strong>${item.servings || 5} portions</strong> ready for pickup</p>
          <p class="fb-popup-address">📍 ${item.pickup_location || 'Pickup Location'}</p>
          <div class="fb-popup-foot">
            <span class="fb-popup-dist">~${dist} km from you</span>
            <button class="fb-popup-cta" id="fb-popup-btn-${item.id}">View Details →</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280, className: 'foodbridge-map-popup' });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`fb-popup-btn-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onItemClick) onItemClick(item);
          };
        }
      });

      foodGroupRef.current.addLayer(marker);
    });
  }, [items, userLocation, onItemClick]);

  // ── Address Search via OpenStreetMap Nominatim ──
  const searchAddress = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5&addressdetails=1`;
      const res = await fetch(endpoint, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await res.json();
      setSearchResults(data || []);
      setShowDropdown(true);
    } catch (err) {
      console.warn('Address search notice:', err.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        searchAddress(val);
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const newPos = { lat, lng };

    setUserLocation(newPos);
    setLocationName(place.display_name.split(',').slice(0, 2).join(', '));
    setSearchQuery(place.display_name.split(',')[0]);
    setShowDropdown(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.2 });
    }
    if (onLocationChange) onLocationChange(newPos);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectLocation(searchResults[0]);
    } else if (searchQuery.trim()) {
      searchAddress(searchQuery);
    }
  };

  return (
    <div className={`map-view-container ${isDark ? 'dark-mode' : ''}`} style={{ height }}>
      {/* ── Top Floating Location Search Bar ── */}
      <div className="map-search-overlay">
        <form onSubmit={handleFormSubmit} className="map-search-form">
          <div className="map-search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            type="text"
            className="map-search-input"
            placeholder="Search address, neighborhood or city..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          />

          {searchQuery && (
            <button
              type="button"
              className="map-search-clear"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowDropdown(false);
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            className={`map-gps-btn ${isLocating ? 'locating' : ''}`}
            onClick={detectLiveLocation}
            title="Detect My Live GPS Location"
            aria-label="Locate me with GPS"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
            <span className="map-gps-text">Locate Me</span>
          </button>
        </form>

        {/* Autocomplete Dropdown List */}
        {showDropdown && searchResults.length > 0 && (
          <div className="map-results-dropdown">
            {searchResults.map((res, i) => (
              <div
                key={res.place_id || i}
                className="map-result-item"
                onClick={() => handleSelectLocation(res)}
              >
                <div className="map-result-icon">📍</div>
                <div className="map-result-text">
                  <strong>{res.display_name.split(',')[0]}</strong>
                  <span>{res.display_name.split(',').slice(1, 4).join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Location Badge */}
        {locationName && (
          <div className="map-location-tag">
            <span className="map-tag-dot" />
            <span className="map-tag-text">{locationName}</span>
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="map-view-canvas" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
