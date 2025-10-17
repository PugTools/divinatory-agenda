import { Config } from '@/types/divination';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';

interface FinanceiroTabProps {
  config: Config;
  onUpdateConfig: (config: Config) => void;
}

export const FinanceiroTab = ({ config, onUpdateConfig }: FinanceiroTabProps) => {
  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Configurações Financeiras</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pix-key">Chave PIX (CNPJ / CPF)</Label>
          <Input
            id="pix-key"
            value={config.pix}
            onChange={(e) => onUpdateConfig({ ...config, pix: e.target.value })}
            placeholder="Digite sua chave PIX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pix-label">Identificação / Nome da conta</Label>
          <Input
            id="pix-label"
            value={config.pixLabel}
            onChange={(e) => onUpdateConfig({ ...config, pixLabel: e.target.value })}
            placeholder="Nome ou identificação"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base">QR Code PIX (Simulado)</Label>
        <div className="w-48 h-48 bg-gradient-mystical rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-primary/30">
          <QrCode className="h-24 w-24 text-primary/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Integração real requer API de PSP
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Para gerar QR Codes reais, integre com Mercado Pago, PagSeguro ou outro provedor de pagamentos.
        </p>
      </div>
    </Card>
  );
};
