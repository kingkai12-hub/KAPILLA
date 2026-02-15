/**
 * Landmarks and Points of Interest for Tanzania
 * Major cities, landmarks, transport hubs, and facilities along common routes
 */

export interface Landmark {
  id: string;
  name: string;
  type:
    | 'city'
    | 'airport'
    | 'port'
    | 'station'
    | 'landmark'
    | 'fuel'
    | 'rest'
    | 'hospital'
    | 'checkpoint';
  lat: number;
  lng: number;
  description?: string;
  importance: 'major' | 'medium' | 'minor';
  icon: string;
}

export const landmarks: Landmark[] = [
  // Major Cities
  {
    id: 'dar-city',
    name: 'Dar es Salaam',
    type: 'city',
    lat: -6.7924,
    lng: 39.2083,
    description: 'Largest city and economic capital',
    importance: 'major',
    icon: '🏙️',
  },
  {
    id: 'mwanza-city',
    name: 'Mwanza',
    type: 'city',
    lat: -2.5164,
    lng: 32.9033,
    description: 'Second largest city, Lake Victoria port',
    importance: 'major',
    icon: '🏙️',
  },
  {
    id: 'arusha-city',
    name: 'Arusha',
    type: 'city',
    lat: -3.3869,
    lng: 36.683,
    description: 'Safari capital, near Kilimanjaro',
    importance: 'major',
    icon: '🏙️',
  },
  {
    id: 'dodoma-city',
    name: 'Dodoma',
    type: 'city',
    lat: -6.163,
    lng: 35.7516,
    description: 'Capital city',
    importance: 'major',
    icon: '🏛️',
  },
  {
    id: 'mbeya-city',
    name: 'Mbeya',
    type: 'city',
    lat: -8.9094,
    lng: 33.4608,
    description: 'Southern highlands city',
    importance: 'major',
    icon: '🏙️',
  },
  {
    id: 'morogoro-city',
    name: 'Morogoro',
    type: 'city',
    lat: -6.8278,
    lng: 37.6591,
    description: 'Gateway to central Tanzania',
    importance: 'major',
    icon: '🏙️',
  },

  // Airports
  {
    id: 'dar-airport',
    name: 'Julius Nyerere International Airport',
    type: 'airport',
    lat: -6.8781,
    lng: 39.2026,
    description: 'Main international airport',
    importance: 'major',
    icon: '✈️',
  },
  {
    id: 'kilimanjaro-airport',
    name: 'Kilimanjaro International Airport',
    type: 'airport',
    lat: -3.4294,
    lng: 37.0745,
    description: 'Northern Tanzania gateway',
    importance: 'major',
    icon: '✈️',
  },
  {
    id: 'mwanza-airport',
    name: 'Mwanza Airport',
    type: 'airport',
    lat: -2.4445,
    lng: 32.9327,
    description: 'Lake Victoria region airport',
    importance: 'medium',
    icon: '✈️',
  },

  // Ports
  {
    id: 'dar-port',
    name: 'Port of Dar es Salaam',
    type: 'port',
    lat: -6.8163,
    lng: 39.2803,
    description: 'Major seaport',
    importance: 'major',
    icon: '🚢',
  },
  {
    id: 'tanga-port',
    name: 'Port of Tanga',
    type: 'port',
    lat: -5.0683,
    lng: 39.0975,
    description: 'Northern seaport',
    importance: 'medium',
    icon: '🚢',
  },

  // Major Landmarks
  {
    id: 'kilimanjaro',
    name: 'Mount Kilimanjaro',
    type: 'landmark',
    lat: -3.0674,
    lng: 37.3556,
    description: 'Highest mountain in Africa',
    importance: 'major',
    icon: '🏔️',
  },
  {
    id: 'serengeti',
    name: 'Serengeti National Park',
    type: 'landmark',
    lat: -2.3333,
    lng: 34.8333,
    description: 'World-famous wildlife park',
    importance: 'major',
    icon: '🦁',
  },
  {
    id: 'ngorongoro',
    name: 'Ngorongoro Crater',
    type: 'landmark',
    lat: -3.1667,
    lng: 35.5833,
    description: 'UNESCO World Heritage Site',
    importance: 'major',
    icon: '🌋',
  },

  // Transport Stations
  {
    id: 'dar-central-station',
    name: 'Dar es Salaam Central Station',
    type: 'station',
    lat: -6.8167,
    lng: 39.2833,
    description: 'Main railway station',
    importance: 'medium',
    icon: '🚂',
  },
  {
    id: 'ubungo-terminal',
    name: 'Ubungo Bus Terminal',
    type: 'station',
    lat: -6.7833,
    lng: 39.25,
    description: 'Major bus terminal',
    importance: 'medium',
    icon: '🚌',
  },

  // Major Towns Along Routes
  {
    id: 'chalinze',
    name: 'Chalinze',
    type: 'city',
    lat: -6.6372,
    lng: 38.3544,
    description: 'Major junction town',
    importance: 'medium',
    icon: '🏘️',
  },
  {
    id: 'kibaha',
    name: 'Kibaha',
    type: 'city',
    lat: -6.7667,
    lng: 38.9167,
    description: 'Town near Dar es Salaam',
    importance: 'medium',
    icon: '🏘️',
  },
  {
    id: 'singida',
    name: 'Singida',
    type: 'city',
    lat: -4.8167,
    lng: 34.75,
    description: 'Central Tanzania town',
    importance: 'medium',
    icon: '🏘️',
  },
  {
    id: 'shinyanga',
    name: 'Shinyanga',
    type: 'city',
    lat: -3.6667,
    lng: 33.4167,
    description: 'Mining region center',
    importance: 'medium',
    icon: '🏘️',
  },
  {
    id: 'nzega',
    name: 'Nzega',
    type: 'city',
    lat: -4.2167,
    lng: 33.1833,
    description: 'Central route town',
    importance: 'medium',
    icon: '🏘️',
  },

  // Hospitals (Major)
  {
    id: 'muhimbili-hospital',
    name: 'Muhimbili National Hospital',
    type: 'hospital',
    lat: -6.8,
    lng: 39.2667,
    description: 'National referral hospital',
    importance: 'major',
    icon: '🏥',
  },
  {
    id: 'kcmc-hospital',
    name: 'KCMC Hospital',
    type: 'hospital',
    lat: -3.3667,
    lng: 37.35,
    description: 'Major hospital in Moshi',
    importance: 'medium',
    icon: '🏥',
  },
  {
    id: 'bugando-hospital',
    name: 'Bugando Medical Centre',
    type: 'hospital',
    lat: -2.5333,
    lng: 32.9167,
    description: 'Referral hospital in Mwanza',
    importance: 'medium',
    icon: '🏥',
  },

  // Checkpoints (Border/Major)
  {
    id: 'namanga-border',
    name: 'Namanga Border',
    type: 'checkpoint',
    lat: -2.55,
    lng: 36.7833,
    description: 'Tanzania-Kenya border',
    importance: 'major',
    icon: '🛂',
  },
  {
    id: 'tunduma-border',
    name: 'Tunduma Border',
    type: 'checkpoint',
    lat: -9.3,
    lng: 32.7667,
    description: 'Tanzania-Zambia border',
    importance: 'major',
    icon: '🛂',
  },
  {
    id: 'sirari-border',
    name: 'Sirari Border',
    type: 'checkpoint',
    lat: -1.25,
    lng: 34.4667,
    description: 'Tanzania-Kenya border (Mara)',
    importance: 'medium',
    icon: '🛂',
  },

  // Fuel Stations (Major Highway Stops)
  {
    id: 'morogoro-fuel',
    name: 'Morogoro Service Station',
    type: 'fuel',
    lat: -6.82,
    lng: 37.67,
    description: 'Major fuel stop',
    importance: 'medium',
    icon: '⛽',
  },
  {
    id: 'dodoma-fuel',
    name: 'Dodoma Service Station',
    type: 'fuel',
    lat: -6.17,
    lng: 35.74,
    description: 'Capital city fuel stop',
    importance: 'medium',
    icon: '⛽',
  },
  {
    id: 'singida-fuel',
    name: 'Singida Service Station',
    type: 'fuel',
    lat: -4.81,
    lng: 34.76,
    description: 'Central route fuel stop',
    importance: 'medium',
    icon: '⛽',
  },

  // Rest Areas
  {
    id: 'mikumi-rest',
    name: 'Mikumi Rest Area',
    type: 'rest',
    lat: -7.4069,
    lng: 36.9772,
    description: 'Rest stop near national park',
    importance: 'medium',
    icon: '🏕️',
  },
  {
    id: 'chalinze-rest',
    name: 'Chalinze Rest Stop',
    type: 'rest',
    lat: -6.64,
    lng: 38.35,
    description: 'Major junction rest area',
    importance: 'medium',
    icon: '🏕️',
  },
];

/**
 * Get landmarks along a route
 * @param routePoints Route coordinates
 * @param maxDistance Maximum distance from route in km
 * @returns Landmarks near the route
 */
export function getLandmarksAlongRoute(
  routePoints: [number, number][],
  maxDistance: number = 50
): Landmark[] {
  if (!routePoints || routePoints.length === 0) return [];

  const nearbyLandmarks: Landmark[] = [];
  const maxDistanceMeters = maxDistance * 1000;

  for (const landmark of landmarks) {
    let minDistance = Infinity;

    // Check distance to each route point
    for (const point of routePoints) {
      const distance = haversineDistance(landmark.lat, landmark.lng, point[0], point[1]);
      minDistance = Math.min(minDistance, distance);
    }

    if (minDistance <= maxDistanceMeters) {
      nearbyLandmarks.push(landmark);
    }
  }

  // Sort by importance and distance
  return nearbyLandmarks.sort((a, b) => {
    const importanceOrder = { major: 0, medium: 1, minor: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get landmark icon component
 */
export function getLandmarkIcon(type: Landmark['type']): string {
  const icons: Record<Landmark['type'], string> = {
    city: '🏙️',
    airport: '✈️',
    port: '🚢',
    station: '🚂',
    landmark: '🏛️',
    fuel: '⛽',
    rest: '🏕️',
    hospital: '🏥',
    checkpoint: '🛂',
  };
  return icons[type] || '📍';
}

/**
 * Filter landmarks by type
 */
export function filterLandmarksByType(
  landmarks: Landmark[],
  types: Landmark['type'][]
): Landmark[] {
  return landmarks.filter((l) => types.includes(l.type));
}

/**
 * Get landmarks by importance
 */
export function filterLandmarksByImportance(
  landmarks: Landmark[],
  importance: Landmark['importance'][]
): Landmark[] {
  return landmarks.filter((l) => importance.includes(l.importance));
}
