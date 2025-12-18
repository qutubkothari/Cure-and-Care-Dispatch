// GPS Validation and Mock Detection Utility

export interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GPSMetadata extends GPSData {
  isMockLocation: boolean;
  qualityScore: number; // 0-100
  warnings: string[];
}

/**
 * Validates GPS data quality and detects potential mock locations
 */
export function validateGPSData(position: GeolocationPosition): GPSMetadata {
  const { coords, timestamp } = position;
  const warnings: string[] = [];
  let mockIndicators = 0;

  // Extract GPS data
  const gpsData: GPSData = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    altitude: coords.altitude,
    altitudeAccuracy: coords.altitudeAccuracy,
    heading: coords.heading,
    speed: coords.speed,
    timestamp,
  };

  // 1. Check accuracy (poor accuracy might indicate mock location)
  if (coords.accuracy > 100) {
    warnings.push('Poor GPS accuracy (>100m)');
  } else if (coords.accuracy < 5) {
    // Suspiciously perfect accuracy could indicate mock
    mockIndicators++;
    warnings.push('Suspiciously perfect accuracy (<5m)');
  }

  // 2. Check if coordinates are suspiciously round (common in fake GPS apps)
  const latDecimals = coords.latitude.toString().split('.')[1]?.length || 0;
  const lngDecimals = coords.longitude.toString().split('.')[1]?.length || 0;
  if (latDecimals < 4 || lngDecimals < 4) {
    mockIndicators++;
    warnings.push('Suspiciously rounded coordinates');
  }

  // 3. Check timestamp freshness
  const age = Date.now() - timestamp;
  if (age > 30000) {
    warnings.push('Stale GPS data (>30s old)');
  } else if (age < 0) {
    mockIndicators++;
    warnings.push('GPS timestamp in future');
  }

  // 4. Check for missing data that real GPS should provide
  if (coords.altitude === null && coords.heading === null && coords.speed === null) {
    mockIndicators++;
    warnings.push('Missing altitude, heading, and speed data');
  }

  // 5. Check for impossible coordinates
  if (Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
    mockIndicators += 3;
    warnings.push('Invalid coordinate range');
  }

  // 6. Check for null island (0,0) - common default in mock apps
  if (coords.latitude === 0 && coords.longitude === 0) {
    mockIndicators += 3;
    warnings.push('Null Island coordinates detected');
  }

  // Calculate quality score (0-100)
  let qualityScore = 100;
  
  // Deduct points for accuracy
  if (coords.accuracy > 50) qualityScore -= 20;
  else if (coords.accuracy > 20) qualityScore -= 10;
  
  // Deduct points for age
  if (age > 15000) qualityScore -= 15;
  else if (age > 5000) qualityScore -= 5;
  
  // Deduct points for missing data
  if (coords.altitude === null) qualityScore -= 5;
  if (coords.heading === null) qualityScore -= 5;
  if (coords.speed === null) qualityScore -= 5;
  
  // Deduct points for mock indicators
  qualityScore -= mockIndicators * 15;
  
  qualityScore = Math.max(0, qualityScore);

  return {
    ...gpsData,
    isMockLocation: mockIndicators >= 2,
    qualityScore,
    warnings,
  };
}

/**
 * Get enhanced GPS position with validation
 */
export async function getValidatedPosition(): Promise<GPSMetadata> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const metadata = validateGPSData(position);
        resolve(metadata);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Format GPS quality for display
 */
export function getQualityBadge(qualityScore: number): { label: string; color: string } {
  if (qualityScore >= 80) return { label: 'Excellent', color: 'green' };
  if (qualityScore >= 60) return { label: 'Good', color: 'blue' };
  if (qualityScore >= 40) return { label: 'Fair', color: 'yellow' };
  return { label: 'Poor', color: 'red' };
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
