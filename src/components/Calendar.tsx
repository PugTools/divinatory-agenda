import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  disabledDates?: string[];
  weekdays: number[];
  extraDates: string[];
}

interface CalendarDay {
  date: string;
  dayNumber: number;
  disabled: boolean;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Calendar = ({ selectedDate, onSelectDate, disabledDates = [], weekdays, extraDates }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Debug: log weekdays to console
  console.log('Calendar weekdays config:', weekdays);

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: CalendarDay[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      // Create date at noon to avoid timezone issues
      const date = new Date(currentYear, currentMonth, i, 12, 0, 0);
      
      // Format as YYYY-MM-DD without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;
      
      const isPast = date < today;
      const weekdayAllowed = weekdays.includes(date.getDay());
      const extraAllowed = extraDates.includes(iso);
      const isOccupied = disabledDates.includes(iso);
      const allowed = !isPast && (weekdayAllowed || extraAllowed) && !isOccupied;

      // Debug log for first few days
      if (i <= 3) {
        console.log(`Day ${i} (${DAY_NAMES[date.getDay()]}):`, {
          weekday: date.getDay(),
          weekdayAllowed,
          isPast,
          allowed
        });
      }

      days.push({
        date: iso,
        dayNumber: i,
        disabled: !allowed
      });
    }

    return days;
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-lg min-w-[160px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Dias liberados: {weekdays.map(d => DAY_NAMES[d]).join(', ')}
        </div>
      </div>

      <div className="grid grid-cols-7 text-sm text-center text-muted-foreground mb-2 gap-2">
        {DAY_NAMES.map(day => (
          <div key={day} className="font-medium">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => (
          <button
            key={day.date}
            onClick={() => !day.disabled && onSelectDate(day.date)}
            disabled={day.disabled}
            className={cn(
              'min-h-[44px] rounded-lg border flex items-center justify-center font-medium text-sm transition-all',
              day.disabled && 'bg-muted text-muted-foreground cursor-not-allowed opacity-50',
              !day.disabled && selectedDate === day.date && 'bg-primary text-primary-foreground shadow-md',
              !day.disabled && selectedDate !== day.date && 'bg-background hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {day.dayNumber}
          </button>
        ))}
      </div>
    </div>
  );
};
