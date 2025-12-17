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
  const [allPriests, setAllPriests] = useState<PriestProfile[]>([]);
  const [showPriestSelection, setShowPriestSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectPriest();
  }, []);

  const detectPriest = async () => {
    setLoading(true);

    try {
      const hostname = window.location.hostname;
      
      // Check for priest parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const subdomainParam = urlParams.get('priest');
      
      // First, load all active priests for potential selection
      const { data: allPriestsData, error: allPriestsError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, avatar_url, subdomain, custom_domain, is_active')
        .eq('is_active', true);

      if (!allPriestsError && allPriestsData) {
        setAllPriests(allPriestsData);
      }

      let profileData: PriestProfile | null = null;

      if (subdomainParam) {
        // URL has priest parameter - find by subdomain
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, bio, avatar_url, subdomain, custom_domain, is_active')
          .eq('subdomain', subdomainParam)
          .eq('is_active', true)
          .maybeSingle();

        if (!error) profileData = data;
      } else if (
        hostname.includes('localhost') || 
        hostname.includes('127.0.0.1') ||
        hostname.includes('lovableproject.com') ||
        hostname.includes('lovable.app')
      ) {
        // Development/Lovable mode - check if there are multiple priests
        if (allPriestsData && allPriestsData.length > 1) {
          // Multiple priests available - show selection
          setShowPriestSelection(true);
          setLoading(false);
          return;
        } else if (allPriestsData && allPriestsData.length === 1) {
          // Only one priest - use it directly
          profileData = allPriestsData[0];
        }
      } else {
        // Production mode - detect from subdomain or custom domain
        const subdomain = hostname.split('.')[0];
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, bio, avatar_url, subdomain, custom_domain, is_active')
          .eq('is_active', true)
          .or(`subdomain.eq.${subdomain},custom_domain.eq.${hostname}`)
          .maybeSingle();

        if (!error) profileData = data;
      }

      if (!profileData) {
        // If there are priests available, show selection
        if (allPriestsData && allPriestsData.length > 0) {
          setShowPriestSelection(true);
        }
        setLoading(false);
        return;
      }

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
      // Silent error - no console.log in production
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: {
    client_name: string;
    client_whatsapp: string;
    client_email?: string;
    client_birthdate: string;
    game_type_id: string | null;
    game_type_name: string;
    scheduled_date: string;
    scheduled_time: string;
    valor: number;
    cruz: any;
  }): Promise<any> => {
    if (!priestId) {
      throw new Error('Priest not detected');
    }

    // Generate appointment ID client-side to avoid SELECT after INSERT
    const appointmentId = crypto.randomUUID();

    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        id: appointmentId,
        priest_id: priestId,
        ...appointmentData,
        status: 'pending',
        payment_status: 'pending'
      });

    if (appointmentError) {
      throw appointmentError;
    }
    
    // Create PIX payment transaction
    const transactionId = crypto.randomUUID();
    try {
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          id: transactionId,
          priest_id: priestId,
          appointment_id: appointmentId,
          amount: appointmentData.valor,
          status: 'pending',
          payment_method: 'pix',
          external_id: `PIX-${Date.now()}-${appointmentId.substring(0, 8)}`,
        });

      if (!transactionError) {
        // Update appointment with payment_id
        await supabase
          .from('appointments')
          .update({ payment_id: transactionId })
          .eq('id', appointmentId);
      }
    } catch (error) {
      // Silent error handling for payment transaction
    }

    // Return the appointment data for the payment modal
    return {
      id: appointmentId,
      ...appointmentData,
      priest_id: priestId,
      status: 'pending',
      payment_status: 'pending'
    };
  };

  const getOccupiedSlots = async (date: string): Promise<string[]> => {
    if (!priestId) return [];

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_time')
        .eq('priest_id', priestId)
        .eq('scheduled_date', date)
        .neq('status', 'cancelled');

      if (error) throw error;
      return data.map(apt => apt.scheduled_time);
    } catch (error) {
      return [];
    }
  };

  return {
    priestId,
    profile,
    config,
    gameTypes,
    allPriests,
    showPriestSelection,
    loading,
    createAppointment,
    getOccupiedSlots
  };
};
