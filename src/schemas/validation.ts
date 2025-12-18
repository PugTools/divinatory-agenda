import { z } from 'zod';

/**
 * Validation schemas for form inputs
 * Protects against injection attacks and data corruption
 */

// Booking form validation
export const bookingSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  whatsapp: z.string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'WhatsApp deve estar no formato (XX) XXXXX-XXXX'),
  
  birthdate: z.string()
    .refine((date) => {
      const d = new Date(date);
      const now = new Date();
      const minDate = new Date('1900-01-01');
      return d < now && d > minDate;
    }, 'Data de nascimento inválida'),
  
  tipo: z.string().min(1, 'Selecione um tipo de jogo')
});

// Sign up form validation
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase(),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter letras maiúsculas, minúsculas e números'),
  
  fullName: z.string()
    .trim()
    .min(2, 'Nome completo deve ter pelo menos 2 caracteres')
    .max(100, 'Nome completo deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  displayName: z.string()
    .trim()
    .min(2, 'Nome de exibição deve ter pelo menos 2 caracteres')
    .max(50, 'Nome de exibição deve ter no máximo 50 caracteres')
});

// Login form validation
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Email inválido')
    .toLowerCase(),
  
  password: z.string()
    .min(1, 'Senha é obrigatória')
});

// Game type validation
export const gameTypeSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  value: z.number()
    .positive('Valor deve ser positivo')
    .max(10000, 'Valor deve ser no máximo R$ 10.000')
});

// Config validation
export const configSchema = z.object({
  pix_key: z.string()
    .trim()
    .max(255, 'Chave PIX deve ter no máximo 255 caracteres'),
  
  pix_label: z.string()
    .trim()
    .max(100, 'Nome do beneficiário deve ter no máximo 100 caracteres'),
  
  horarios: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido')),
  
  weekdays: z.array(z.number().min(0).max(6)),
  
  extra_dates: z.array(z.string())
});

// Subdomain validation - advanced rules
export const subdomainSchema = z.string()
  .trim()
  .toLowerCase()
  .min(3, 'Identificador deve ter pelo menos 3 caracteres')
  .max(30, 'Identificador deve ter no máximo 30 caracteres')
  .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, 'Deve começar com letra, terminar com letra/número, e conter apenas letras, números e hífens')
  .refine((val) => !val.includes('--'), 'Não pode conter hífens consecutivos')
  .refine((val) => !RESERVED_SUBDOMAINS.includes(val), 'Este identificador está reservado');

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  'admin', 'api', 'app', 'auth', 'blog', 'cdn', 'dashboard', 
  'dev', 'docs', 'ftp', 'help', 'login', 'mail', 'pop', 'smtp',
  'ssl', 'staging', 'static', 'support', 'test', 'www', 'webmail',
  'sacerdote', 'priest', 'sistema', 'system', 'config', 'settings'
];

export type BookingFormData = z.infer<typeof bookingSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type GameTypeFormData = z.infer<typeof gameTypeSchema>;
export type ConfigFormData = z.infer<typeof configSchema>;
export type SubdomainData = z.infer<typeof subdomainSchema>;
