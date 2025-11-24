export interface SatelliteData {
  id: number;
  name: string; // Added real name
  position: [number, number, number]; // x, y, z
  color: string;
  country: string;
  company: string;
  type: string;
  altitude: number;
}

export enum CountryOwner {
  USA = 'USA',
  China = 'China',
  Russia = 'Russia',
  EU = 'European Union',
  India = 'India',
  Japan = 'Japan',
  SpaceX = 'SpaceX (USA)',
  Private = 'Private Corporation',
  International = 'International',
}

export interface DetailedSatelliteInfo {
  description: string;
  mission: string;
  launchDate: string;
  status: string;
}