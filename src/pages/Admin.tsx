import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { AppointmentModal } from '@/components/AppointmentModal';
import { Dashboard } from '@/components/admin/Dashboard';
import { AppointmentsTab } from '@/components/admin/AppointmentsTab';
import { ValoresTab } from '@/components/admin/ValoresTab';
import { ConfigTab } from '@/components/admin/ConfigTab';
import { FinanceiroTab } from '@/components/admin/FinanceiroTab';
import { ProfileTab } from '@/components/admin/ProfileTab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Appointment } from '@/types/divination';
import { generatePDF } from '@/utils/pdf-generator';
import { Sparkles, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const Admin = () => {
  const { user, signOut } = useAuth();
  const {
    agendamentos,
    valores,
    config,
    profile,
    updateAppointment,
    removeAppointment,
    updateValores,
    updateConfig,
    updateProfile,
    gameTypes,
    addGameType,
    removeGameType,
    refreshData
  } = useAppData();

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleGeneratePDF = () => {
    if (!currentAppointment) return;
    try {
      generatePDF(currentAppointment, {
        pix: config.pix,
        pixLabel: config.pixLabel
      });
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF.');
      console.error(error);
    }
  };

  const handleFinalizeAppointment = () => {
    if (!currentAppointment) return;
    updateAppointment(currentAppointment.id, { status: 'Confirmado' });
    setShowAppointmentModal(false);
    toast.success('Agendamento finalizado!');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie seus agendamentos e configurações
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-4 py-2">
                {user?.email}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestão de Consultas</h2>
              <p className="text-muted-foreground">Visualize estatísticas e gerencie seus serviços</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Salvo automaticamente
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
              <TabsTrigger value="agendamentos">📅 Agendamentos</TabsTrigger>
              <TabsTrigger value="valores">💰 Valores</TabsTrigger>
              <TabsTrigger value="config">⚙️ Config</TabsTrigger>
              <TabsTrigger value="perfil">👤 Perfil</TabsTrigger>
              <TabsTrigger value="financeiro">💳 Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <Dashboard agendamentos={agendamentos} valores={valores} subdomain={profile?.subdomain} />
            </TabsContent>

            <TabsContent value="agendamentos" className="mt-6">
              <AppointmentsTab
                agendamentos={agendamentos}
                onOpenAppointment={(apt) => {
                  setCurrentAppointment(apt);
                  setShowAppointmentModal(true);
                }}
                onRemoveAppointment={removeAppointment}
              />
            </TabsContent>

            <TabsContent value="valores" className="mt-6">
              <ValoresTab 
                gameTypes={gameTypes} 
                onUpdateValores={updateValores}
                onAddGameType={addGameType}
                onRemoveGameType={removeGameType}
                onRefresh={refreshData}
              />
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <ConfigTab config={config} onUpdateConfig={updateConfig} />
            </TabsContent>

            <TabsContent value="perfil" className="mt-6">
              <ProfileTab profile={profile} onUpdateProfile={updateProfile} />
            </TabsContent>

            <TabsContent value="financeiro" className="mt-6">
              <FinanceiroTab config={config} onUpdateConfig={updateConfig} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Appointment Details Modal */}
      <AppointmentModal
        appointment={currentAppointment}
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onGeneratePDF={handleGeneratePDF}
        onFinalize={handleFinalizeAppointment}
      />
    </div>
  );
};

export default Admin;
