import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Calendar } from '@/components/Calendar';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { BookingForm } from '@/components/BookingForm';
import { AppointmentModal } from '@/components/AppointmentModal';
import { LoginModal } from '@/components/admin/LoginModal';
import { Dashboard } from '@/components/admin/Dashboard';
import { AppointmentsTab } from '@/components/admin/AppointmentsTab';
import { ValoresTab } from '@/components/admin/ValoresTab';
import { ConfigTab } from '@/components/admin/ConfigTab';
import { FinanceiroTab } from '@/components/admin/FinanceiroTab';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Appointment } from '@/types/divination';
import { calculateCruz } from '@/utils/cruz-calculator';
import { generatePDF } from '@/utils/pdf-generator';
import { Sparkles, Lock, Save, FileDown } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const {
    agendamentos,
    valores,
    config,
    addAppointment,
    updateAppointment,
    removeAppointment,
    updateValores,
    updateConfig
  } = useAppData();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Booking state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

  // Admin state
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (user: string, pass: string): boolean => {
    if (user === 'admin' && pass === '12345') {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      toast.success('Login realizado com sucesso!');
      return true;
    }
    return false;
  };

  const handleBookingSubmit = (formData: {
    name: string;
    whatsapp: string;
    birthdate: string;
    tipo: string;
  }) => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário.');
      return;
    }

    // Check if slot is still available
    const isOccupied = agendamentos.some(
      a => a.dataEscolhida === selectedDate && a.hora === selectedTime
    );

    if (isOccupied) {
      toast.error('Este horário foi ocupado. Escolha outro.');
      setSelectedTime(null);
      return;
    }

    try {
      const cruz = calculateCruz(formData.birthdate);

      const appointment: Appointment = {
        id: Date.now(),
        name: formData.name,
        whatsapp: formData.whatsapp,
        birthdate: formData.birthdate,
        tipo: formData.tipo,
        valor: valores[formData.tipo] || 0,
        dataEscolhida: selectedDate,
        hora: selectedTime,
        cruz,
        status: 'Pendente',
        createdAt: new Date().toISOString()
      };

      addAppointment(appointment);
      setCurrentAppointment(appointment);
      setShowAppointmentModal(true);
      setSelectedDate(null);
      setSelectedTime(null);

      toast.success('Agendamento confirmado!');
    } catch (error) {
      toast.error('Erro ao criar agendamento.');
      console.error(error);
    }
  };

  const getOccupiedSlots = (date: string): string[] => {
    return agendamentos
      .filter(a => a.dataEscolhida === date)
      .map(a => a.hora);
  };

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
                    Sistema de Agendamento Espiritual Divinatório
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Agendamentos, Cruz dos Odùs e gestão completa
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Acesso Sacerdote
                </Button>
              ) : (
                <Badge variant="secondary" className="px-4 py-2">
                  Usuário: admin
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isLoggedIn ? (
          // Public Booking Area
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Agende seu Jogo Divinatório
                  </h2>
                  <p className="text-muted-foreground">
                    Escolha a data, horário e preencha seus dados para receber sua Cruz dos Odùs
                  </p>
                </div>

                {/* Step 1: Calendar */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">1) Escolha a data</h3>
                  <Calendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    weekdays={config.weekdays}
                    extraDates={config.extraDates}
                  />
                </div>

                {/* Step 2: Time Slots */}
                {selectedDate && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">
                      2) Horários disponíveis em {new Date(selectedDate).toLocaleDateString('pt-BR')}
                    </h3>
                    <TimeSlotPicker
                      availableSlots={config.horarios}
                      occupiedSlots={getOccupiedSlots(selectedDate)}
                      selectedTime={selectedTime}
                      onSelectTime={setSelectedTime}
                    />
                  </div>
                )}

                {/* Step 3: Form */}
                {selectedDate && selectedTime && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-lg">3) Seus dados e tipo de jogo</h3>
                    <BookingForm valores={valores} onSubmit={handleBookingSubmit} />
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          // Admin Area
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Painel Administrativo</h2>
                <p className="text-muted-foreground">Gerencie agendamentos, valores e configurações</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''}
                </Badge>
                <Button variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Salvo automaticamente
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
                <TabsTrigger value="agendamentos">📅 Agendamentos</TabsTrigger>
                <TabsTrigger value="valores">💰 Valores</TabsTrigger>
                <TabsTrigger value="config">⚙️ Config</TabsTrigger>
                <TabsTrigger value="financeiro">💳 Financeiro</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-6">
                <Dashboard agendamentos={agendamentos} valores={valores} />
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
                <ValoresTab valores={valores} onUpdateValores={updateValores} />
              </TabsContent>

              <TabsContent value="config" className="mt-6">
                <ConfigTab config={config} onUpdateConfig={updateConfig} />
              </TabsContent>

              <TabsContent value="financeiro" className="mt-6">
                <FinanceiroTab config={config} onUpdateConfig={updateConfig} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {/* Appointment Details Modal */}
      <AppointmentModal
        appointment={currentAppointment}
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onGeneratePDF={handleGeneratePDF}
        onFinalize={isLoggedIn ? handleFinalizeAppointment : undefined}
      />
    </div>
  );
};

export default Index;
