
export interface ApiResponse<T> {
  timestamp: string;
  message: string;
  data: T;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LastLocationRow {
  userId: string;
  sessionId: string;
  status: string;
  active: boolean;
  stale: boolean;
  ts: string;
  lat: number;
  lon: number;
  accuracyM: number;
  speedMps: number;
  headingDeg: number;
}

export interface SessionRow {
  sessionId: string;
  userId?: string;
  username?: string;
  startTime: string;
  stopTime: string;
  status: 'ACTIVE' | 'STOPPED' | 'ARCHIVED' | 'EXPIRED' | 'ABORTED';
  lastPointAt: string;
}

export interface SessionPage {
  items: SessionRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Bbox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export interface SessionSummaryResponse {
  sessionId: string;
  polyline: string;
  simplifiedPolyline: string;
  distanceM: number;
  durationS: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  pointsCount: number;
  bbox: Bbox;
  rawPointsPrunedAt?: string;
}

export interface PointRow {
  ts: string;
  lat: number;
  lon: number;
  accuracyM?: number;
  speedMps?: number;
  headingDeg?: number;
}

export interface StreamTokenResponse {
  token: string;
  expiresAt: string;
}
