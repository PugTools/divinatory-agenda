import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';

interface BookingFormProps {
  valores: Record<string, number>;
  onSubmit: (data: {
    name: string;
    whatsapp: string;
    birthdate: string;
    tipo: string;
  }) => void;
}

export const BookingForm = ({ valores, onSubmit }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    birthdate: '',
    tipo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp || !formData.birthdate || !formData.tipo) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Seu nome completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="(XX) 9XXXX-XXXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">Data de nascimento</Label>
          <div className="relative">
            <Input
              id="birthdate"
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              required
            />
            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de jogo</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o tipo de jogo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(valores).map(([nome, valor]) => (
                <SelectItem key={nome} value={nome}>
                  {nome} — R$ {valor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-primary">
        Confirmar Agendamento
      </Button>
    </form>
  );
};
