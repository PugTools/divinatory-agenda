import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriestProfile {
  id: string;
  display_name: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  // Sensitive fields removed for public access
}

interface PriestConfig {
  pix_key: string;
  pix_label: string;
  horarios: string[];
  weekdays: number[];
  extra_dates: string[];
  theme_color: string;
  logo_url: string | null;
  welcome_message: string;
}

interface GameType {
  id: string;
  name: string;
  value: number;
  description: string | null;
}

export const usePriestContext = () => {
  const [priestId, setPriestId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PriestProfile | null>(null);
  const [config, setConfig] = useState<PriestConfig | null>(null);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectPriest();
  }, []);

  const detectPriest = async () => {
    setLoading(true);

    try {
      const hostname = window.location.hostname;
      console.log('Detecting priest for hostname:', hostname);
      
      // For development, we'll use a query parameter or default to first priest
      const urlParams = new URLSearchParams(window.location.search);
      const subdomainParam = urlParams.get('priest');
      
      // Only fetch non-sensitive display information for public access
      let query = supabase
        .from('profiles')
        .select('id, display_name, bio, avatar_url, subdomain, custom_domain, is_active')
        .eq('is_active', true);

      if (subdomainParam) {
        // Development mode with query parameter
        console.log('Using priest parameter:', subdomainParam);
        query = query.eq('subdomain', subdomainParam);
      } else if (
        hostname.includes('localhost') || 
        hostname.includes('127.0.0.1') ||
        hostname.includes('lovableproject.com') ||
        hostname.includes('lovable.app')
      ) {
        // Development/Lovable mode - get first active priest
        console.log('Using first active priest (dev mode)');
        query = query.limit(1);
      } else {
        // Production mode - detect from subdomain or custom domain
        const subdomain = hostname.split('.')[0];
        console.log('Using subdomain/domain detection:', subdomain, hostname);
        query = query.or(`subdomain.eq.${subdomain},custom_domain.eq.${hostname}`);
      }

      const { data: profileData, error: profileError } = await query.maybeSingle();

      if (profileError) {
        console.error('Error loading priest:', profileError);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.warn('No priest profile found for this domain');
        setLoading(false);
        return;
      }

      console.log('Priest detected:', profileData.display_name);

      setPriestId(profileData.id);
      setProfile(profileData);

      // Load priest config
      const { data: configData, error: configError } = await supabase
        .from('priest_config')
        .select('*')
        .eq('priest_id', profileData.id)
        .single();

      if (!configError && configData) {
        setConfig({
          pix_key: configData.pix_key || '',
          pix_label: configData.pix_label || '',
          horarios: configData.horarios || [],
          weekdays: configData.weekdays || [],
          extra_dates: configData.extra_dates || [],
          theme_color: configData.theme_color || '#7C3AED',
          logo_url: configData.logo_url,
          welcome_message: configData.welcome_message || 'Bem-vindo! Agende sua consulta espiritual'
        });
      }

      // Load game types
      const { data: gameTypesData, error: gameTypesError } = await supabase
        .from('game_types')
        .select('id, name, value, description')
        .eq('priest_id', profileData.id)
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (!gameTypesError && gameTypesData) {
        setGameTypes(gameTypesData);
      }

    } catch (error) {
      console.error('Error detecting priest:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: {
    client_name: string;
    client_whatsapp: string;
    client_birthdate: string;
    game_type_id: string | null;
    game_type_name: string;
    scheduled_date: string;
    scheduled_time: string;
    valor: number;
    cruz: any;
  }): Promise<string> => {
    if (!priestId) {
      throw new Error('Priest not detected');
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        priest_id: priestId,
        ...appointmentData,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;
    
    // Create PIX payment transaction
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          priest_id: priestId,
          appointment_id: appointment.id,
          amount: appointmentData.valor,
          status: 'pending',
          payment_method: 'pix',
          external_id: `PIX-${Date.now()}-${appointment.id.substring(0, 8)}`,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating payment transaction:', transactionError);
      } else {
        // Update appointment with payment_id
        await supabase
          .from('appointments')
          .update({ payment_id: transaction.id })
          .eq('id', appointment.id);
      }
    } catch (error) {
      console.error('Error in payment transaction creation:', error);
    }

    return appointment.id;
  };

  const getOccupiedSlots = async (date: string): Promise<string[]> => {
    if (!priestId) return [];

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_time')
        .eq('priest_id', priestId)
        .eq('scheduled_date', date);

      if (error) throw error;
      return data.map(apt => apt.scheduled_time);
    } catch (error) {
      console.error('Error loading occupied slots:', error);
      return [];
    }
  };

  return {
    priestId,
    profile,
    config,
    gameTypes,
    loading,
    createAppointment,
    getOccupiedSlots
  };
};
