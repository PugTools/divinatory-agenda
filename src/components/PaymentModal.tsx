import { Appointment } from '@/types/divination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, QrCode, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  pixKey: string;
  pixLabel: string;
}

export const PaymentModal = ({ appointment, open, onClose, pixKey, pixLabel }: PaymentModalProps) => {
  if (!appointment) return null;

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success('Chave PIX copiada!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            Agendamento Confirmado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Agendamento */}
          <Card className="p-4 space-y-3 bg-gradient-mystical">
            <div>
              <div className="text-sm text-muted-foreground">Nome</div>
              <div className="font-semibold">{appointment.name}</div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Data e Horário</div>
              <div className="font-semibold">
                {new Date(appointment.dataEscolhida).toLocaleDateString('pt-BR')} às {appointment.hora}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Tipo de Jogo</div>
              <div className="font-semibold">{appointment.tipo}</div>
            </div>

            <div className="pt-3 border-t">
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="text-2xl font-bold text-primary">R$ {appointment.valor}</div>
            </div>
          </Card>

          {/* Informações de Pagamento */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Pagamento via PIX</h3>
              <p className="text-sm text-muted-foreground">
                Realize o pagamento para confirmar seu agendamento
              </p>
            </div>

            {/* QR Code Simulado */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-gradient-mystical rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-primary/30">
                <QrCode className="h-24 w-24 text-primary/50 mb-2" />
                <p className="text-xs text-muted-foreground text-center px-4">
                  QR Code PIX
                </p>
              </div>
            </div>

            {/* Chave PIX */}
            <Card className="p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Chave PIX</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                    {pixKey}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyPixKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Favorecido</div>
                <div className="font-medium">{pixLabel}</div>
              </div>
            </Card>

            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm text-center">
                ✨ Após o pagamento, você receberá a confirmação no WhatsApp cadastrado. 
                Sua <strong>Cruz dos Odùs</strong> será preparada pelo sacerdote.
              </p>
            </div>
          </div>

          <Button onClick={onClose} className="w-full bg-gradient-primary">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
