import { Appointment } from '@/types/divination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Clock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

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
  const [generatingPix, setGeneratingPix] = useState(false);

  useEffect(() => {
    if (open && appointment) {
      loadOrGeneratePix();
    }
  }, [open, appointment]);

  const loadOrGeneratePix = async () => {
    if (!appointment?.id || !appointment?.priest_id) return;

    try {
      setLoading(true);
      const appointmentId = String(appointment.id);
      
      // First try to load existing transaction
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (error) throw error;
      
      // If transaction exists but has no PIX code, generate one
      if (data && !data.pix_copy_paste) {
        await generatePix();
      } else if (data) {
        setTransaction(data);
      } else {
        // No transaction exists, generate PIX
        await generatePix();
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePix = async () => {
    if (!appointment?.id || !appointment?.priest_id) return;

    try {
      setGeneratingPix(true);
      
      const response = await supabase.functions.invoke('generate-pix', {
        body: {
          appointmentId: appointment.id,
          priestId: appointment.priest_id,
        },
      });

      if (response.error) throw response.error;

      // Reload transaction with updated PIX code
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('appointment_id', appointment.id)
        .maybeSingle();

      if (data) {
        setTransaction(data);
        toast.success('Código PIX gerado com sucesso!');
      }
    } catch (error) {
      console.error('Error generating PIX:', error);
      toast.error('Erro ao gerar código PIX. Tente novamente.');
    } finally {
      setGeneratingPix(false);
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
                <div className="font-semibold">{appointment.client_name}</div>
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
                {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} às {appointment.scheduled_time}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Tipo de Consulta</div>
              <div className="font-semibold">{appointment.game_type_name}</div>
            </div>

            <div className="pt-3 border-t border-primary/20">
              <div className="text-xs text-muted-foreground">Valor Total</div>
              <div className="text-2xl font-bold text-primary">
                R$ {typeof appointment.valor === 'number' ? appointment.valor.toFixed(2) : appointment.valor}
              </div>
            </div>
          </Card>

          {/* Informações de Pagamento */}
          {loading || generatingPix ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {generatingPix ? 'Gerando código PIX...' : 'Carregando...'}
              </p>
            </div>
          ) : transaction?.status !== 'paid' ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-1">Pagamento via PIX</h3>
                <p className="text-sm text-muted-foreground">
                  Realize o pagamento para confirmar sua consulta
                </p>
              </div>

              {/* QR Code PIX */}
              {transaction?.pix_copy_paste ? (
                <Card className="p-4 border-primary/20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-xs text-muted-foreground">Escaneie o QR Code</div>
                    <div className="bg-white p-3 rounded-lg">
                      <QRCode
                        value={transaction.pix_copy_paste}
                        size={180}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Aponte a câmera do app do seu banco para o QR Code
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 border-warning/20 bg-warning/5">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-center text-muted-foreground">
                      Não foi possível gerar o código PIX automaticamente.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generatePix}
                      disabled={generatingPix}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar código PIX
                    </Button>
                  </div>
                </Card>
              )}

              {/* Chave PIX */}
              <Card className="p-4 space-y-3 border-primary/20">
                <div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {transaction?.pix_copy_paste ? 'Código Copia e Cola' : 'Chave PIX'}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all max-h-20 overflow-y-auto">
                      {transaction?.pix_copy_paste || pixKey}
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
