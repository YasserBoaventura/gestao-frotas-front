export interface LocationDTO {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  status?: string;
}

export interface VehicleLocation {
  id: number;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  status: string;
  timestamp: Date;
}
export interface LocationHistoryItem{
    id: number;
  time: string;
  latitude: string;
  longitude: string;
  speed: string;
  status: string;
  color: string;
}
