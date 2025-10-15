// types/index.ts
export interface MqttStatus {
  connected: boolean;
  broker: string | null;
  clientId: string | null;
  lastChecked: string | null;
}

export interface Sensor {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  lastReading?: number;
  unit?: string;
}

export interface Camera {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'error';
}

export interface Configuration {
  mqtt: {
    broker: string;
    username: string;
    password: string;
    autoConnect: boolean;
    autoPolling: boolean;
  };
  recording: {
    autoStart: boolean;
    duration: number;
    format: string;
  };
  cameras: Camera[];
  sensors: Sensor[];
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}