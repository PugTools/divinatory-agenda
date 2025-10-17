import { Appointment } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';

interface AppointmentsTabProps {
  agendamentos: Appointment[];
  onOpenAppointment: (appointment: Appointment) => void;
  onRemoveAppointment: (id: number) => void;
}

export const AppointmentsTab = ({ agendamentos, onOpenAppointment, onRemoveAppointment }: AppointmentsTabProps) => {
  if (agendamentos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum agendamento registrado ainda.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Agendamentos</h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Jogo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agendamentos.map(appointment => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.name}</TableCell>
                <TableCell>{appointment.whatsapp}</TableCell>
                <TableCell className="text-sm">{appointment.tipo}</TableCell>
                <TableCell>{new Date(appointment.dataEscolhida).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{appointment.hora}</TableCell>
                <TableCell>
                  <Badge variant={appointment.status === 'Confirmado' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenAppointment(appointment)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Remover este agendamento?')) {
                        onRemoveAppointment(appointment.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
