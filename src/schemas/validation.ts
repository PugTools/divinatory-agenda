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

// PIX key validation helpers
const CPF_REGEX = /^\d{11}$/;
const CNPJ_REGEX = /^\d{14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+55\d{10,11}$/;
const EVP_REGEX = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// CPF validation with check digits
function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf[10])) return false;
  
  return true;
}

// CNPJ validation with check digits
function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cnpj[12])) return false;
  
  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cnpj[13])) return false;
  
  return true;
}

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp' | 'invalid';

export function detectPixKeyType(key: string): PixKeyType {
  const cleanKey = key.trim();
  
  // Remove formatting from CPF/CNPJ for validation
  const digitsOnly = cleanKey.replace(/\D/g, '');
  
  // Check CPF (11 digits)
  if (CPF_REGEX.test(digitsOnly) && isValidCPF(digitsOnly)) {
    return 'cpf';
  }
  
  // Check CNPJ (14 digits)
  if (CNPJ_REGEX.test(digitsOnly) && isValidCNPJ(digitsOnly)) {
    return 'cnpj';
  }
  
  // Check Email
  if (EMAIL_REGEX.test(cleanKey)) {
    return 'email';
  }
  
  // Check Phone (+55XXXXXXXXXXX)
  const phoneDigits = cleanKey.replace(/[\s()-]/g, '');
  if (PHONE_REGEX.test(phoneDigits) || /^\+55\d{10,11}$/.test(phoneDigits)) {
    return 'phone';
  }
  
  // Check EVP (random key - UUID format)
  if (EVP_REGEX.test(cleanKey)) {
    return 'evp';
  }
  
  return 'invalid';
}

export function formatPixKeyForDisplay(type: PixKeyType): string {
  switch (type) {
    case 'cpf': return 'CPF';
    case 'cnpj': return 'CNPJ';
    case 'email': return 'E-mail';
    case 'phone': return 'Telefone';
    case 'evp': return 'Chave Aleatória';
    default: return 'Inválido';
  }
}

// PIX key validation schema
export const pixKeySchema = z.string()
  .trim()
  .min(1, 'Chave PIX é obrigatória')
  .max(255, 'Chave PIX deve ter no máximo 255 caracteres')
  .refine((val) => {
    if (!val) return true; // Empty is handled by min()
    return detectPixKeyType(val) !== 'invalid';
  }, 'Chave PIX inválida. Use CPF, CNPJ, e-mail, telefone (+55) ou chave aleatória (UUID)');

// Config validation
export const configSchema = z.object({
  pix_key: pixKeySchema.optional().or(z.literal('')),
  
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
