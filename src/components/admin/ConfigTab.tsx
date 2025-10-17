import { useState } from 'react';
import { Config } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'lucide-react';

interface ConfigTabProps {
  config: Config;
  onUpdateConfig: (config: Config) => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DEFAULT_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '14:00', '14:30', '15:00', '15:30', '16:00', '17:00'
];

export const ConfigTab = ({ config, onUpdateConfig }: ConfigTabProps) => {
  const [customSlotsStr, setCustomSlotsStr] = useState('');
  const [newExtraDate, setNewExtraDate] = useState('');

  const toggleHorario = (slot: string) => {
    const newHorarios = config.horarios.includes(slot)
      ? config.horarios.filter(h => h !== slot)
      : [...config.horarios, slot];
    onUpdateConfig({ ...config, horarios: newHorarios });
  };

  const addCustomSlots = () => {
    const parts = customSlotsStr.split(',').map(s => s.trim()).filter(Boolean);
    const newHorarios = [...config.horarios];
    parts.forEach(p => {
      if (!newHorarios.includes(p)) newHorarios.push(p);
    });
    onUpdateConfig({ ...config, horarios: newHorarios });
    setCustomSlotsStr('');
  };

  const toggleWeekday = (day: number) => {
    const newWeekdays = config.weekdays.includes(day)
      ? config.weekdays.filter(d => d !== day)
      : [...config.weekdays, day];
    onUpdateConfig({ ...config, weekdays: newWeekdays });
  };

  const addExtraDate = () => {
    if (!newExtraDate) {
      alert('Escolha uma data.');
      return;
    }
    if (!config.extraDates.includes(newExtraDate)) {
      onUpdateConfig({ ...config, extraDates: [...config.extraDates, newExtraDate] });
    }
    setNewExtraDate('');
  };

  const removeExtraDate = (date: string) => {
    onUpdateConfig({ ...config, extraDates: config.extraDates.filter(d => d !== date) });
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Configurações — Dias e Horários</h3>

      {/* Horários */}
      <div className="space-y-4">
        <div>
          <Label className="text-base mb-3 block">Horários disponíveis</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Clique para ativar/desativar horários
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SLOTS.map(slot => (
              <Button
                key={slot}
                size="sm"
                variant={config.horarios.includes(slot) ? 'default' : 'outline'}
                onClick={() => toggleHorario(slot)}
              >
                {slot}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm mb-2 block">Adicionar horários personalizados</Label>
          <div className="flex gap-2">
            <Input
              value={customSlotsStr}
              onChange={(e) => setCustomSlotsStr(e.target.value)}
              placeholder="08:30,13:30"
              className="flex-1"
            />
            <Button onClick={addCustomSlots} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Separe múltiplos horários com vírgula
          </p>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="space-y-3">
        <Label className="text-base">Dias da semana em que atende</Label>
        <div className="flex flex-wrap gap-3">
          {DAY_NAMES.map((day, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${idx}`}
                checked={config.weekdays.includes(idx)}
                onCheckedChange={() => toggleWeekday(idx)}
              />
              <label
                htmlFor={`day-${idx}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {day}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Datas extras */}
      <div className="space-y-3">
        <Label className="text-base">Datas extras liberadas</Label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={newExtraDate}
            onChange={(e) => setNewExtraDate(e.target.value)}
          />
          <Button onClick={addExtraDate} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {config.extraDates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.extraDates.map(date => (
              <Badge key={date} variant="secondary" className="gap-2">
                {new Date(date).toLocaleDateString('pt-BR')}
                <button onClick={() => removeExtraDate(date)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
