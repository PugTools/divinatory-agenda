import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Appointment, Config, PriestProfile } from '@/types/divination';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface GameType {
  id: string;
  name: string;
  value: number;
  description?: string;
  active: boolean;
  sort_order: number;
}

export const useAppData = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [config, setConfig] = useState<Config>({
    pix: '',
    pixLabel: '',
    horarios: [],
    weekdays: [],
    extraDates: []
  });
  const [profile, setProfile] = useState<PriestProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all data when user is authenticated
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadAppointments(),
      loadGameTypes(),
      loadConfig(),
      loadProfile()
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, subdomain, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          display_name: data.display_name || '',
          subdomain: data.subdomain || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url
        });
      }
    } catch (error: any) {
      logger.error('Error loading profile', error);
    }
  };

  const loadAppointments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Map database fields directly to Appointment type
      const transformed: Appointment[] = (data || []).map((apt: any) => ({
        id: apt.id,
        priest_id: apt.priest_id,
        client_name: apt.client_name,
        client_whatsapp: apt.client_whatsapp,
        client_email: apt.client_email,
        client_birthdate: apt.client_birthdate,
        game_type_id: apt.game_type_id,
        game_type_name: apt.game_type_name,
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        valor: Number(apt.valor),
        cruz: apt.cruz,
        status: apt.status,
        payment_status: apt.payment_status,
        payment_id: apt.payment_id,
        notes: apt.notes,
        confirmation_sent: apt.confirmation_sent,
        reminder_sent: apt.reminder_sent,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
      }));

      setAppointments(transformed);
    } catch (error: any) {
      logger.error('Error loading appointments', error);
      toast.error('Erro ao carregar agendamentos');
    }
  };

  const loadGameTypes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_types')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setGameTypes(data || []);
    } catch (error: any) {
      logger.error('Error loading game types', error);
      toast.error('Erro ao carregar tipos de jogos');
    }
  };

  const loadConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('priest_config')
        .select('*')
        .eq('priest_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          pix: data.pix_key || '',
          pixLabel: data.pix_label || '',
          horarios: data.horarios || [],
          weekdays: data.weekdays || [],
          extraDates: data.extra_dates?.map((d: string) => new Date(d).toISOString().split('T')[0]) || []
        });
      }
    } catch (error: any) {
      logger.error('Error loading config', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    if (!user) return;

    try {
      const insertData: any = {
        priest_id: user.id,
        client_name: appointment.client_name,
        client_whatsapp: appointment.client_whatsapp,
        client_email: appointment.client_email,
        client_birthdate: appointment.client_birthdate,
        game_type_id: appointment.game_type_id,
        game_type_name: appointment.game_type_name,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        valor: appointment.valor,
        cruz: appointment.cruz,
        status: appointment.status || 'pending'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Agendamento criado com sucesso!');
      await loadAppointments();
    } catch (error: any) {
      logger.error('Error adding appointment', error);
      toast.error('Erro ao criar agendamento');
    }
  };

  const updateAppointment = async (id: string | number, updates: Partial<Appointment>) => {
    if (!user) return;

    try {
      const dbUpdates: any = {};
      
      if (updates.client_name) dbUpdates.client_name = updates.client_name;
      if (updates.client_whatsapp) dbUpdates.client_whatsapp = updates.client_whatsapp;
      if (updates.client_birthdate) dbUpdates.client_birthdate = updates.client_birthdate;
      if (updates.client_email) dbUpdates.client_email = updates.client_email;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
      if (updates.cruz) dbUpdates.cruz = updates.cruz;
      if (updates.notes) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('appointments')
        .update(dbUpdates)
        .eq('id', String(id));

      if (error) throw error;

      toast.success('Agendamento atualizado!');
      await loadAppointments();
    } catch (error: any) {
      logger.error('Error updating appointment', error);
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const removeAppointment = async (id: string | number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', String(id));

      if (error) throw error;

      toast.success('Agendamento removido!');
      await loadAppointments();
    } catch (error: any) {
      logger.error('Error removing appointment', error);
      toast.error('Erro ao remover agendamento');
    }
  };

  const updateValores = async (valores: Record<string, number>) => {
    if (!user) return;

    try {
      // Update all game types with new values
      const updates = Object.entries(valores).map(([name, value]) => {
        const gameType = gameTypes.find(gt => gt.name === name);
        if (!gameType) return null;

        return supabase
          .from('game_types')
          .update({ value })
          .eq('id', gameType.id);
      }).filter(Boolean);

      await Promise.all(updates);
      toast.success('Valores atualizados!');
      await loadGameTypes();
    } catch (error: any) {
      logger.error('Error updating valores', error);
      toast.error('Erro ao atualizar valores');
    }
  };

  const addGameType = async (name: string, value: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('game_types')
        .insert({
          priest_id: user.id,
          name,
          value,
          active: true,
          sort_order: gameTypes.length + 1
        });

      if (error) throw error;

      toast.success('Tipo de jogo adicionado!');
      await loadGameTypes();
    } catch (error: any) {
      logger.error('Error adding game type', error);
      toast.error('Erro ao adicionar tipo de jogo');
    }
  };

  const removeGameType = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('game_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Tipo de jogo removido!');
      await loadGameTypes();
    } catch (error: any) {
      logger.error('Error removing game type', error);
      toast.error('Erro ao remover tipo de jogo');
    }
  };

  const updateConfig = async (newConfig: Config) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('priest_config')
        .update({
          pix_key: newConfig.pix,
          pix_label: newConfig.pixLabel,
          horarios: newConfig.horarios,
          weekdays: newConfig.weekdays,
          extra_dates: newConfig.extraDates
        })
        .eq('priest_id', user.id);

      if (error) throw error;

      setConfig(newConfig);
      toast.success('Configurações atualizadas!');
    } catch (error: any) {
      logger.error('Error updating config', error);
      toast.error('Erro ao atualizar configurações');
    }
  };

  const updateProfile = async (updates: Partial<PriestProfile>) => {
    if (!user) return;

    try {
      // Check if subdomain is unique (if being updated)
      if (updates.subdomain && updates.subdomain !== profile?.subdomain) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('subdomain', updates.subdomain)
          .neq('id', user.id)
          .maybeSingle();

        if (existing) {
          toast.error('Este identificador já está em uso. Escolha outro.');
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.display_name,
          subdomain: updates.subdomain,
          bio: updates.bio
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Perfil atualizado!');
    } catch (error: any) {
      logger.error('Error updating profile', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  // Convert gameTypes to valores format for backward compatibility
  const valores: Record<string, number> = gameTypes.reduce((acc, gt) => {
    acc[gt.name] = gt.value;
    return acc;
  }, {} as Record<string, number>);

  return {
    agendamentos: appointments,
    valores,
    config,
    profile,
    loading,
    addAppointment,
    updateAppointment,
    removeAppointment,
    updateValores,
    updateConfig,
    updateProfile,
    gameTypes,
    addGameType,
    removeGameType,
    refreshData: loadAllData
  };
};
