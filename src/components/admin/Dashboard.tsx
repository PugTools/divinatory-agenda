import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment } from '@/types/divination';
import { Calendar, TrendingUp, Package, Share2, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface DashboardProps {
  agendamentos: Appointment[];
  valores: Record<string, number>;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const Dashboard = ({ agendamentos, valores }: DashboardProps) => {
  const [copied, setCopied] = useState(false);
  
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
  const siteUrl = window.location.origin;

  const copyUrl = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    toast.success('Link copiado! Compartilhe com seus clientes.');
    setTimeout(() => setCopied(false), 2000);
  };

  const openPublicSite = () => {
    window.open(siteUrl, '_blank');
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
                  Compartilhe sua Agenda
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    Público
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Envie este link para seus clientes agendarem consultas
                </p>
              </div>
            </div>
          </div>

          {/* URL Display */}
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-primary/30">
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm font-mono text-primary break-all">
                {siteUrl}
              </code>
              <div className="flex gap-2">
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
                  Visualizar
                </Button>
              </div>
            </div>
          </div>

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
