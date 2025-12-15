export interface Odu {
  number: number;
  name: string;
  short: string;
  descricao: string;
  orixas: string[];
  ebos: string[];
  icon: string;
}

export interface Cruz {
  top: Odu;
  left: Odu;
  center: Odu;
  right: Odu;
  base: Odu;
}

export interface Appointment {
  id: string | number; // Suporta ambos para transição
  name: string;
  whatsapp: string;
  birthdate: string;
  tipo: string;
  valor: number;
  dataEscolhida: string;
  hora: string;
  cruz: Cruz;
  status: string;
  createdAt: string;
}

export interface Config {
  pix: string;
  pixLabel: string;
  horarios: string[];
  weekdays: number[];
  extraDates: string[];
}

export interface PriestProfile {
  id: string;
  display_name: string;
  subdomain: string;
  bio: string;
  avatar_url: string | null;
}

export interface AppData {
  agendamentos: Appointment[];
  valores: Record<string, number>;
  config: Config;
}
