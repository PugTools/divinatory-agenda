-- Fix search_path for handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
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

-- Fix search_path for handle_new_profile function
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;
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

-- Fix search_path for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priest_config_updated_at
  BEFORE UPDATE ON public.priest_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();