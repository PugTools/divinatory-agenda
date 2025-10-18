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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Agendamento Confirmado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do Agendamento */}
          <Card className="p-3 space-y-2 bg-gradient-mystical">
            <div>
              <div className="text-xs text-muted-foreground">Nome</div>
              <div className="font-semibold text-sm">{appointment.name}</div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground">Data e Horário</div>
              <div className="font-semibold text-sm">
                {new Date(appointment.dataEscolhida).toLocaleDateString('pt-BR')} às {appointment.hora}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Tipo de Jogo</div>
              <div className="font-semibold text-sm">{appointment.tipo}</div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Valor Total</div>
              <div className="text-xl font-bold text-primary">R$ {appointment.valor}</div>
            </div>
          </Card>

          {/* Informações de Pagamento */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-sm mb-1">Pagamento via PIX</h3>
              <p className="text-xs text-muted-foreground">
                Realize o pagamento para confirmar
              </p>
            </div>

            {/* QR Code Simulado */}
            <div className="flex justify-center">
              <div className="w-36 h-36 bg-gradient-mystical rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-primary/30">
                <QrCode className="h-16 w-16 text-primary/50 mb-1" />
                <p className="text-xs text-muted-foreground text-center px-2">
                  QR Code PIX
                </p>
              </div>
            </div>

            {/* Chave PIX */}
            <Card className="p-3 space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Chave PIX</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-2 py-1.5 rounded text-xs font-mono break-all">
                    {pixKey}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyPixKey}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Favorecido</div>
                <div className="font-medium text-sm">{pixLabel}</div>
              </div>
            </Card>

            <div className="bg-accent/50 p-3 rounded-lg">
              <p className="text-xs text-center">
                ✨ Após o pagamento, você receberá a confirmação no WhatsApp. 
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
