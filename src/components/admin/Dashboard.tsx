import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment } from '@/types/divination';
import { Calendar, TrendingUp, Package } from 'lucide-react';

interface DashboardProps {
  agendamentos: Appointment[];
  valores: Record<string, number>;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const Dashboard = ({ agendamentos, valores }: DashboardProps) => {
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

  return (
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
  );
};
