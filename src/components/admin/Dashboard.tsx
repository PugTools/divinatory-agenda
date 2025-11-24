import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment } from '@/types/divination';
import { Calendar, TrendingUp, Package, Share2, Copy, ExternalLink, CheckCircle, Lock, QrCode, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import QRCodeSVG from 'react-qr-code';

interface DashboardProps {
  agendamentos: Appointment[];
  valores: Record<string, number>;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const Dashboard = ({ agendamentos, valores }: DashboardProps) => {
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const futureCount = agendamentos.filter(a => {
    const date = new Date(a.dataEscolhida);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }).length;

  // Calculate appointments per day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  agendamentos.forEach(a => {
    const d = new Date(a.dataEscolhida);
    dayCounts[d.getDay()]++;
  });

  const chartData = DAY_NAMES.map((name, idx) => ({
    name,
    agendamentos: dayCounts[idx]
  }));

  // Get current site URL
  const hostname = window.location.hostname;
  const isPreview = hostname.includes('lovableproject.com');
  const isPublished = hostname.includes('lovable.app');
  
  // If it's a preview link, show a message to publish first
  const siteUrl = isPreview 
    ? 'Publique primeiro para obter o link público'
    : window.location.origin;
  
  const canCopy = !isPreview;

  const copyUrl = () => {
    if (!canCopy) {
      toast.error('Publique o projeto primeiro para obter o link público');
      return;
    }
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    toast.success('Link copiado! Compartilhe com seus clientes.');
    setTimeout(() => setCopied(false), 2000);
  };

  const openPublicSite = () => {
    if (!canCopy) {
      toast.error('Publique o projeto primeiro');
      return;
    }
    window.open(siteUrl, '_blank');
  };

  const previewAsClient = () => {
    if (!canCopy) {
      toast.error('Publique o projeto primeiro');
      return;
    }
    navigator.clipboard.writeText(siteUrl);
    toast.success('Link copiado!', {
      description: (
        <div className="space-y-2 mt-2">
          <p className="font-semibold">Como testar como cliente:</p>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Abra uma janela anônima:
              <ul className="list-disc list-inside ml-4 text-xs mt-1">
                <li>Chrome/Edge: Ctrl+Shift+N (Win) ou ⌘+Shift+N (Mac)</li>
                <li>Firefox: Ctrl+Shift+P (Win) ou ⌘+Shift+P (Mac)</li>
                <li>Safari: ⌘+Shift+N</li>
              </ul>
            </li>
            <li>Cole o link copiado (Ctrl+V ou ⌘+V)</li>
            <li>Veja exatamente o que seus clientes veem!</li>
          </ol>
        </div>
      ),
      duration: 10000,
    });
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = 'qrcode-agenda.png';
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR Code baixado com sucesso!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6">
      {/* Compartilhar Link Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  Link da Agenda Pública
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    Para Clientes
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Este é o link que seus <strong>clientes</strong> usam para agendar consultas
                </p>
                <p className="text-xs text-warning mt-1">
                  ⚠️ <strong>Importante:</strong> Este NÃO é o link de login do sacerdote. É a agenda pública para clientes!
                </p>
              </div>
            </div>
          </div>

          {/* URL Display */}
          {isPreview ? (
            <div className="bg-warning/10 backdrop-blur-sm rounded-lg p-4 border-2 border-warning/30">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="text-warning mt-0.5">⚠️</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning">Link de Preview Detectado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      O link atual (<code className="text-xs">lovableproject.com</code>) é apenas para preview e requer login no Lovable.
                    </p>
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold">📝 Como obter o link público:</p>
                  <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Clique no botão <strong>"Publish"</strong> no topo da tela</li>
                    <li>Após publicar, um novo link terminando em <code className="text-xs bg-primary/10 px-1 rounded">.lovable.app</code> será gerado</li>
                    <li>Use esse link <code className="text-xs bg-primary/10 px-1 rounded">.lovable.app</code> para compartilhar com clientes</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-primary/30">
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm font-mono text-primary break-all">
                  {siteUrl}
                </code>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyUrl}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1 text-success" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openPublicSite}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={previewAsClient}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Preview Cliente
                  </Button>
                  <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10"
                        disabled={!canCopy}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>QR Code da Agenda</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-center p-6 bg-white rounded-lg">
                          <QRCodeSVG
                            id="qr-code-svg"
                            value={siteUrl}
                            size={256}
                            level="H"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground text-center">
                            Compartilhe este QR Code para clientes acessarem sua agenda facilmente
                          </p>
                          <Button
                            onClick={downloadQRCode}
                            className="w-full"
                            variant="default"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar QR Code
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-xs font-medium">Copie o link</p>
                <p className="text-xs text-muted-foreground">Clique em "Copiar"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-xs font-medium">Compartilhe</p>
                <p className="text-xs text-muted-foreground">WhatsApp, redes sociais</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-xs font-medium">Receba agendamentos</p>
                <p className="text-xs text-muted-foreground">Clientes agendam online</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <div className="bg-accent/30 border border-accent/50 p-3 rounded-lg">
              <p className="text-xs">
                <strong>💡 Dica de teste:</strong> Para ver como seus clientes veem a agenda, abra o link em uma{' '}
                <strong>janela anônima</strong> (Ctrl+Shift+N) ou faça logout antes de visualizar.
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg">
              <p className="text-xs">
                <strong>ℹ️ Diferença importante:</strong> Este link (<strong>página pública</strong>) é diferente do link de login do sacerdote (<code className="text-xs">/login</code>) e da área administrativa (<code className="text-xs">/admin</code>).
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Card */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Resumo e Estatísticas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-4 bg-gradient-mystical">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total de agendamentos</div>
              <div className="text-3xl font-bold text-primary">{agendamentos.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-mystical">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Agendamentos futuros</div>
              <div className="text-3xl font-bold text-accent">{futureCount}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-mystical">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-gold" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tipos de jogos</div>
              <div className="text-3xl font-bold text-gold">{Object.keys(valores).length}</div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h4 className="font-semibold mb-4">Agendamentos por dia da semana</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="agendamentos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      </Card>
    </div>
  );
};
