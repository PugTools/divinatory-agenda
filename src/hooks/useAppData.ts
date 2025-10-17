import { useState, useEffect } from 'react';
import { AppData, Appointment, Config } from '@/types/divination';

const STORAGE_KEY = 'divinatorio_data_v22';

const DEFAULT_VALUES: Record<string, number> = {
  'Ifá (Opón Ifá / Ikin / Opele)': 80,
  'Merindilogun (Jogo de 16 búzios)': 70,
  'Erindilogun (Jogo de 12 búzios)': 60,
  'Obi (Oráculo de 4 colas)': 40,
  'Oráculo de Ossain': 50,
  'Consulta Espiritual Completa': 120,
  'Odù Individual': 55,
  'Ebó e Recomendações Especiais': 150
};

const DEFAULT_CONFIG: Config = {
  pix: '43487501000157',
  pixLabel: 'Conta Sacerdote',
  horarios: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  weekdays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  extraDates: []
};

export const useAppData = () => {
  const [data, setData] = useState<AppData>({
    agendamentos: [],
    valores: DEFAULT_VALUES,
    config: DEFAULT_CONFIG
  });

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          agendamentos: parsed.agendamentos || [],
          valores: parsed.valores || DEFAULT_VALUES,
          config: parsed.config || DEFAULT_CONFIG
        });
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, []);

  const saveData = (newData: AppData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  };

  const addAppointment = (appointment: Appointment) => {
    const newData = {
      ...data,
      agendamentos: [...data.agendamentos, appointment]
    };
    saveData(newData);
  };

  const updateAppointment = (id: number, updates: Partial<Appointment>) => {
    const newData = {
      ...data,
      agendamentos: data.agendamentos.map(a =>
        a.id === id ? { ...a, ...updates } : a
      )
    };
    saveData(newData);
  };

  const removeAppointment = (id: number) => {
    const newData = {
      ...data,
      agendamentos: data.agendamentos.filter(a => a.id !== id)
    };
    saveData(newData);
  };

  const updateValores = (valores: Record<string, number>) => {
    saveData({ ...data, valores });
  };

  const updateConfig = (config: Config) => {
    saveData({ ...data, config });
  };

  return {
    ...data,
    addAppointment,
    updateAppointment,
    removeAppointment,
    updateValores,
    updateConfig
  };
};
