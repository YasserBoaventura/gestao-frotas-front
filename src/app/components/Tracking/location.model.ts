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
