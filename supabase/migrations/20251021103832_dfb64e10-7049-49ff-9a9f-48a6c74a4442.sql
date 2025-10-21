-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (one per priest)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  display_name TEXT, -- Nome místico/espiritual
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  subdomain TEXT UNIQUE, -- ex: "babalorixajose"
  custom_domain TEXT, -- opcional
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create priest_config table
CREATE TABLE public.priest_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priest_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  pix_key TEXT DEFAULT '',
  pix_label TEXT DEFAULT '',
  horarios TEXT[] DEFAULT ARRAY['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  weekdays INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6],
  extra_dates DATE[] DEFAULT ARRAY[]::DATE[],
  whatsapp_api_token TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  theme_color TEXT DEFAULT '#7C3AED',
  logo_url TEXT,
  welcome_message TEXT DEFAULT 'Bem-vindo! Agende sua consulta espiritual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create game_types table
CREATE TABLE public.game_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  client_birthdate DATE NOT NULL,
  game_type_id UUID REFERENCES public.game_types(id),
  game_type_name TEXT, -- Backup do nome caso o tipo seja deletado
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  cruz JSONB, -- Cruz dos Odùs
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false
);

-- Create notifications_log table
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'confirmation', 'reminder', 'payment'
  status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT
);

-- Create payment_transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'expired', 'refunded'
  payment_method TEXT DEFAULT 'pix',
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  external_id TEXT, -- ID da Mercado Pago/PagSeguro
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priest_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public can view active profiles"
  ON public.profiles FOR SELECT
  USING (is_active = true);

-- RLS Policies for priest_config
CREATE POLICY "Priests can view their own config"
  ON public.priest_config FOR SELECT
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can update their own config"
  ON public.priest_config FOR UPDATE
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can insert their own config"
  ON public.priest_config FOR INSERT
  WITH CHECK (auth.uid() = priest_id);

-- RLS Policies for game_types
CREATE POLICY "Priests can view their own game types"
  ON public.game_types FOR SELECT
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can insert their own game types"
  ON public.game_types FOR INSERT
  WITH CHECK (auth.uid() = priest_id);

CREATE POLICY "Priests can update their own game types"
  ON public.game_types FOR UPDATE
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can delete their own game types"
  ON public.game_types FOR DELETE
  USING (auth.uid() = priest_id);

CREATE POLICY "Public can view active game types"
  ON public.game_types FOR SELECT
  USING (active = true);

-- RLS Policies for appointments
CREATE POLICY "Priests can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can insert their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = priest_id);

CREATE POLICY "Priests can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = priest_id);

-- RLS Policies for notifications_log
CREATE POLICY "Priests can view their own notifications"
  ON public.notifications_log FOR SELECT
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can insert their own notifications"
  ON public.notifications_log FOR INSERT
  WITH CHECK (auth.uid() = priest_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Priests can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = priest_id);

CREATE POLICY "Priests can insert their own transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = priest_id);

-- Trigger to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to create default config and game types when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default config
  INSERT INTO public.priest_config (priest_id)
  VALUES (NEW.id);
  
  -- Create default game types
  INSERT INTO public.game_types (priest_id, name, value, description, sort_order) VALUES
    (NEW.id, 'Ifá (Opón Ifá / Ikin / Opele)', 80, 'Consulta tradicional de Ifá', 1),
    (NEW.id, 'Merindilogun (Jogo de 16 búzios)', 70, 'Jogo com 16 búzios', 2),
    (NEW.id, 'Erindilogun (Jogo de 12 búzios)', 60, 'Jogo com 12 búzios', 3),
    (NEW.id, 'Obi (Oráculo de 4 colas)', 40, 'Oráculo de 4 colas', 4),
    (NEW.id, 'Oráculo de Ossain', 50, 'Consulta com Ossain', 5),
    (NEW.id, 'Consulta Espiritual Completa', 120, 'Consulta completa', 6),
    (NEW.id, 'Odù Individual', 55, 'Leitura de Odù', 7),
    (NEW.id, 'Ebó e Recomendações Especiais', 150, 'Ebó e orientações', 8);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priest_config_updated_at
  BEFORE UPDATE ON public.priest_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();