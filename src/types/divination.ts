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

/**
 * Appointment interface aligned with database schema
 * Uses database field names for consistency
 */
export interface Appointment {
  id: string;
  priest_id?: string;
  client_name: string;
  client_whatsapp: string;
  client_email?: string | null;
  client_birthdate: string;
  game_type_id?: string | null;
  game_type_name: string | null;
  scheduled_date: string;
  scheduled_time: string;
  valor: number;
  cruz: Cruz | null;
  status: string | null;
  payment_status?: string | null;
  payment_id?: string | null;
  notes?: string | null;
  confirmation_sent?: boolean | null;
  reminder_sent?: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
}

/**
 * @deprecated Use Appointment with database field names instead
 * Legacy interface for backward compatibility during migration
 */
export interface LegacyAppointment {
  id: string | number;
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

/**
 * Helper to convert database appointment to legacy format
 * @deprecated Use new Appointment interface directly
 */
export const toLegacyAppointment = (apt: Appointment): LegacyAppointment => ({
  id: apt.id,
  name: apt.client_name,
  whatsapp: apt.client_whatsapp,
  birthdate: apt.client_birthdate,
  tipo: apt.game_type_name || '',
  valor: apt.valor,
  dataEscolhida: apt.scheduled_date,
  hora: apt.scheduled_time,
  cruz: apt.cruz as Cruz,
  status: apt.status || 'pending',
  createdAt: apt.created_at || new Date().toISOString(),
});

/**
 * Helper to convert legacy appointment to database format
 * @deprecated Use new Appointment interface directly
 */
export const fromLegacyAppointment = (legacy: LegacyAppointment): Partial<Appointment> => ({
  id: String(legacy.id),
  client_name: legacy.name,
  client_whatsapp: legacy.whatsapp,
  client_birthdate: legacy.birthdate,
  game_type_name: legacy.tipo,
  scheduled_date: legacy.dataEscolhida,
  scheduled_time: legacy.hora,
  valor: legacy.valor,
  cruz: legacy.cruz,
  status: legacy.status,
  created_at: legacy.createdAt,
});

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
