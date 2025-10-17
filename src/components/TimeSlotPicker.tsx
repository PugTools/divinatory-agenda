import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  availableSlots: string[];
  occupiedSlots: string[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export const TimeSlotPicker = ({ availableSlots, occupiedSlots, selectedTime, onSelectTime }: TimeSlotPickerProps) => {
  if (availableSlots.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhum horário disponível neste dia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {availableSlots.map(slot => {
        const isOccupied = occupiedSlots.includes(slot);
        const isSelected = selectedTime === slot;

        return (
          <Button
            key={slot}
            onClick={() => !isOccupied && onSelectTime(slot)}
            disabled={isOccupied}
            className={cn(
              'h-12',
              isOccupied && 'bg-destructive/10 text-destructive hover:bg-destructive/10',
              isSelected && !isOccupied && 'bg-primary text-primary-foreground',
              !isOccupied && !isSelected && 'bg-accent/50 text-accent-foreground hover:bg-accent'
            )}
          >
            {isOccupied ? `${slot} (Ocupado)` : slot}
          </Button>
        );
      })}
    </div>
  );
};
