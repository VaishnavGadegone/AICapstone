export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  isError?: boolean;
  timestamp: number;
  sources?: Source[];
}

export enum SchemeType {
  SHAKTI = 'Mission Shakti',
  VATSALYA = 'Mission Vatsalya',
  POSHAN = 'Poshan 2.0',
  GENERAL = 'General Inquiry'
}

export interface SchemeConfig {
  id: SchemeType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string; // Emoji character for simplicity
  focusAreas: string[];
}