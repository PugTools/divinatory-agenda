import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePriestContext } from '@/hooks/usePriestContext';
import { Calendar } from '@/components/Calendar';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { BookingForm } from '@/components/BookingForm';
import { PaymentModal } from '@/components/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sparkles, Lock, Loader2 } from 'lucide-react';
import { calculateCruz } from '@/utils/cruz-calculator';
import { toast } from 'sonner';

const Index = () => {
  const {
    priestId,
    profile,
    config,
    gameTypes,
    loading,
    createAppointment,
    getOccupiedSlots
  } = usePriestContext();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowBookingSheet(true);
    
    // Load occupied slots for this date
    const slots = await getOccupiedSlots(date);
    setOccupiedSlots(slots);
  };

  const handleBookingSubmit = async (formData: {
    name: string;
    whatsapp: string;
    birthdate: string;
    tipo: string;
  }) => {
    if (!selectedDate || !selectedTime || !priestId) {
      toast.error('Selecione data e horário.');
      return;
    }

    // Check if slot is still available
    const currentOccupiedSlots = await getOccupiedSlots(selectedDate);
    if (currentOccupiedSlots.includes(selectedTime)) {
      toast.error('Este horário foi ocupado. Escolha outro.');
      setSelectedTime(null);
      return;
    }

    try {
      const cruz = calculateCruz(formData.birthdate);
      const gameType = gameTypes.find(gt => gt.name === formData.tipo);

      const appointment = await createAppointment({
        client_name: formData.name,
        client_whatsapp: formData.whatsapp,
        client_birthdate: formData.birthdate,
        game_type_id: gameType?.id || '',
        game_type_name: formData.tipo,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        valor: gameType?.value || 0,
        cruz
      });

      setCurrentAppointment(appointment);
      setShowBookingSheet(false);
      setShowPaymentModal(true);
      setSelectedDate(null);
      setSelectedTime(null);

      toast.success('Agendamento criado! Complete o pagamento.');
    } catch (error) {
      toast.error('Erro ao criar agendamento.');
      console.error(error);
    }
  };

  // Convert gameTypes to valores format for BookingForm
  const valores: Record<string, number> = gameTypes.reduce((acc, gt) => {
    acc[gt.name] = gt.value;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mystical">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!priestId || !profile || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mystical p-4">
        <Card className="p-8 max-w-md text-center">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sacerdote não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            Não foi possível identificar o sacerdote para este site.
          </p>
          <div className="space-y-2">
            <Link to="/cadastro">
              <Button className="w-full">Cadastrar como Sacerdote</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Acesso Sacerdote
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

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
                    {profile.display_name || profile.full_name || 'Consultas Espirituais'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {config.welcome_message}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/cadastro'}
              >
                Cadastro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/login'}
              >
                <Lock className="mr-2 h-4 w-4" />
                Acesso Sacerdote
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
                  onSelectDate={handleDateSelect}
                  weekdays={config.weekdays}
                  extraDates={config.extra_dates}
                />
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        appointment={currentAppointment}
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        pixKey={config.pix_key}
        pixLabel={config.pix_label}
      />

      {/* Booking Sheet */}
      <Sheet open={showBookingSheet} onOpenChange={setShowBookingSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Agendar Consulta
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Data selecionada */}
            <div className="p-3 bg-gradient-mystical rounded-lg">
              <div className="text-sm text-muted-foreground">Data Selecionada</div>
              <div className="font-semibold">
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Step 2: Horários */}
            <div className="space-y-3">
              <h3 className="font-semibold">2) Escolha o horário</h3>
              <TimeSlotPicker
                availableSlots={config.horarios}
                occupiedSlots={occupiedSlots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            </div>

            {/* Step 3: Formulário */}
            {selectedTime && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">3) Seus dados</h3>
                <BookingForm valores={valores} onSubmit={handleBookingSubmit} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
