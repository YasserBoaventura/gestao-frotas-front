export interface LocationDTO {
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  status?: string;
}

export interface VehicleLocation {
  id: number;
  veiculo: {        //object veicle
    id: number;
    matricula: string;
    modelo?: string;
  };
  latitude: number;
  longitude: number;
  speed: number;
  status: string;
  timestamp: string;
}
export interface LocationHistoryItem{
    id: number;
  timestamp: string;
  latitude: string;
  longitude: string;
  speed: string;
  status: string;
  color: string;
}
