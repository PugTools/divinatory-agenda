import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Appointment, Config } from '@/types/divination';
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
      loadConfig()
    ]);
    setLoading(false);
  };

  const loadAppointments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Transform to old format
      const transformed: Appointment[] = (data || []).map((apt: any) => ({
        id: apt.id,
        name: apt.client_name,
        whatsapp: apt.client_whatsapp,
        birthdate: apt.client_birthdate,
        tipo: apt.game_type_name || '',
        valor: Number(apt.valor),
        dataEscolhida: apt.scheduled_date,
        hora: apt.scheduled_time,
        cruz: apt.cruz,
        status: apt.status,
        createdAt: apt.created_at
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
        client_name: appointment.name,
        client_whatsapp: appointment.whatsapp,
        client_birthdate: appointment.birthdate,
        game_type_name: appointment.tipo,
        scheduled_date: appointment.dataEscolhida,
        scheduled_time: appointment.hora,
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
      
      if (updates.name) dbUpdates.client_name = updates.name;
      if (updates.whatsapp) dbUpdates.client_whatsapp = updates.whatsapp;
      if (updates.birthdate) dbUpdates.client_birthdate = updates.birthdate;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
      if (updates.cruz) dbUpdates.cruz = updates.cruz;

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

  // Convert gameTypes to valores format for backward compatibility
  const valores: Record<string, number> = gameTypes.reduce((acc, gt) => {
    acc[gt.name] = gt.value;
    return acc;
  }, {} as Record<string, number>);

  return {
    agendamentos: appointments,
    valores,
    config,
    loading,
    addAppointment,
    updateAppointment,
    removeAppointment,
    updateValores,
    updateConfig,
    gameTypes,
    addGameType,
    removeGameType,
    refreshData: loadAllData
  };
};
