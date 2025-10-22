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

export type BookingFormData = z.infer<typeof bookingSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type GameTypeFormData = z.infer<typeof gameTypeSchema>;
export type ConfigFormData = z.infer<typeof configSchema>;
