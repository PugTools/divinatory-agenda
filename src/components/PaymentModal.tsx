import { Appointment } from '@/types/divination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface PaymentModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  pixKey: string;
  pixLabel: string;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  pix_copy_paste?: string;
  pix_qr_code?: string;
  external_id?: string;
  created_at: string;
}

export const PaymentModal = ({ appointment, open, onClose, pixKey, pixLabel }: PaymentModalProps) => {
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && appointment) {
      loadTransaction();
    }
  }, [open, appointment]);

  const loadTransaction = async () => {
    if (!appointment?.id) return;

    try {
      setLoading(true);
      const appointmentId = String(appointment.id);
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (error) throw error;
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const copyPixKey = () => {
    if (transaction?.pix_copy_paste) {
      navigator.clipboard.writeText(transaction.pix_copy_paste);
      toast.success('Código PIX copiado!');
    } else {
      navigator.clipboard.writeText(pixKey);
      toast.success('Chave PIX copiada!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Agendamento Confirmado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do Agendamento */}
          <Card className="p-4 space-y-3 bg-gradient-mystical border-primary/20">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Cliente</div>
                <div className="font-semibold">{appointment.name}</div>
              </div>
              {transaction && (
                <Badge 
                  variant={transaction.status === 'paid' ? 'default' : 'outline'}
                  className={transaction.status === 'paid' ? 'bg-success' : 'border-warning text-warning'}
                >
                  {transaction.status === 'paid' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Pago
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              )}
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground">Data e Horário</div>
              <div className="font-semibold">
                {new Date(appointment.dataEscolhida).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} às {appointment.hora}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Tipo de Consulta</div>
              <div className="font-semibold">{appointment.tipo}</div>
            </div>

            <div className="pt-3 border-t border-primary/20">
              <div className="text-xs text-muted-foreground">Valor Total</div>
              <div className="text-2xl font-bold text-primary">
                R$ {typeof appointment.valor === 'number' ? appointment.valor.toFixed(2) : appointment.valor}
              </div>
            </div>
          </Card>

          {/* Informações de Pagamento */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transaction?.status !== 'paid' ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-1">Pagamento via PIX</h3>
                <p className="text-sm text-muted-foreground">
                  Realize o pagamento para confirmar sua consulta
                </p>
              </div>

              {/* Chave PIX */}
              <Card className="p-4 space-y-3 border-primary/20">
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Chave PIX</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                      {pixKey}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyPixKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground">Favorecido</div>
                  <div className="font-medium">{pixLabel}</div>
                </div>

                {transaction?.external_id && (
                  <div>
                    <div className="text-xs text-muted-foreground">ID da Transação</div>
                    <div className="text-xs font-mono text-muted-foreground">{transaction.external_id}</div>
                  </div>
                )}
              </Card>

              <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">📱 Instruções:</p>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Selecione a opção PIX</li>
                  <li>Cole a chave PIX copiada</li>
                  <li>Confirme o pagamento de R$ {typeof appointment.valor === 'number' ? appointment.valor.toFixed(2) : appointment.valor}</li>
                </ol>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-xs text-center">
                  ✨ Após o pagamento, você receberá a confirmação. 
                  Sua <strong>Cruz dos Odùs</strong> será preparada pelo sacerdote.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-success/10 border border-success/20 p-4 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
              <h3 className="font-semibold text-success mb-1">Pagamento Confirmado!</h3>
              <p className="text-sm text-muted-foreground">
                Seu agendamento está confirmado. Você receberá um lembrete antes da consulta.
              </p>
            </div>
          )}

          <Button onClick={onClose} className="w-full bg-gradient-primary">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
