import { Appointment } from '@/types/divination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CruzDisplay } from './CruzDisplay';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, Check } from 'lucide-react';

interface AppointmentModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onGeneratePDF: () => void;
  onFinalize?: () => void;
}

const POSITION_LABELS: Record<string, string> = {
  top: 'Topo (Espiritual)',
  left: 'Esquerda (Sombra)',
  center: 'Centro (Essência)',
  right: 'Direita (Dons)',
  base: 'Base (Fundação)'
};

export const AppointmentModal = ({ appointment, open, onClose, onGeneratePDF, onFinalize }: AppointmentModalProps) => {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalhes do Agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 space-y-2">
              <div className="text-sm text-muted-foreground">Cliente</div>
              <div className="font-semibold text-lg">{appointment.name}</div>
              <div className="text-sm text-muted-foreground">{appointment.whatsapp}</div>
              <div className="text-sm text-muted-foreground">Nasc: {appointment.birthdate}</div>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="text-sm text-muted-foreground">Agendamento</div>
              <div className="font-semibold">
                {new Date(appointment.dataEscolhida).toLocaleDateString('pt-BR')} — {appointment.hora}
              </div>
              <div className="text-sm text-muted-foreground">
                Jogo: {appointment.tipo} — R$ {appointment.valor}
              </div>
              <div className="mt-2">
                <Badge variant={appointment.status === 'Confirmado' ? 'default' : 'secondary'}>
                  {appointment.status}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Cruz Visual */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Cruz dos Odùs</h3>
            <CruzDisplay cruz={appointment.cruz} />
          </Card>

          {/* Detailed Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['top', 'left', 'center', 'right', 'base'] as const).map(pos => {
              const odu = appointment.cruz[pos];
              return (
                <Card key={pos} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">{POSITION_LABELS[pos]}</div>
                      <div className="font-semibold text-lg">
                        {odu.name} ({odu.number})
                      </div>
                    </div>
                    <div className="text-3xl">{odu.icon}</div>
                  </div>

                  <p className="text-sm text-muted-foreground">{odu.descricao || odu.short}</p>

                  <div className="space-y-2">
                    <div className="text-xs">
                      <div className="font-semibold">Òrìṣà:</div>
                      <div className="text-muted-foreground">{odu.orixas.join(', ')}</div>
                    </div>

                    {odu.ebos.length > 0 && (
                      <div className="text-xs">
                        <div className="font-semibold">Ebós:</div>
                        <ul className="list-disc ml-5 text-muted-foreground space-y-1">
                          {odu.ebos.map((ebo, idx) => (
                            <li key={idx}>{ebo}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button onClick={onGeneratePDF} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
            {onFinalize && appointment.status !== 'Confirmado' && (
              <Button onClick={onFinalize} className="bg-gradient-primary">
                <Check className="mr-2 h-4 w-4" />
                Finalizar Agendamento
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
