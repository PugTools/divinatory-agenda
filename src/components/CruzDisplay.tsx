import { Cruz } from '@/types/divination';
import { Card } from '@/components/ui/card';

interface CruzDisplayProps {
  cruz: Cruz;
}

export const CruzDisplay = ({ cruz }: CruzDisplayProps) => {
  return (
    <div className="flex flex-col items-center space-y-6 py-6">
      {/* Top */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border-2 border-primary bg-gradient-mystical flex items-center justify-center shadow-md">
          <div className="text-2xl font-bold text-primary">{cruz.top.number}</div>
        </div>
        <div className="text-sm font-semibold mt-2">{cruz.top.name}</div>
        <div className="text-xs text-muted-foreground">{cruz.top.icon}</div>
      </div>

      {/* Middle row: left - center - right */}
      <div className="flex items-center justify-center gap-8">
        {/* Left */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-accent bg-background flex items-center justify-center shadow-sm">
            <div className="text-xl font-bold text-accent">{cruz.left.number}</div>
          </div>
          <div className="text-xs mt-1 max-w-[80px] text-center">{cruz.left.name}</div>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary bg-gradient-primary flex items-center justify-center shadow-glow">
            <div className="text-2xl font-bold text-primary-foreground">{cruz.center.number}</div>
          </div>
          <div className="text-sm font-semibold mt-2">{cruz.center.name}</div>
          <div className="text-xs text-muted-foreground">{cruz.center.icon}</div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-accent bg-background flex items-center justify-center shadow-sm">
            <div className="text-xl font-bold text-accent">{cruz.right.number}</div>
          </div>
          <div className="text-xs mt-1 max-w-[80px] text-center">{cruz.right.name}</div>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border-2 border-primary bg-gradient-mystical flex items-center justify-center shadow-md">
          <div className="text-2xl font-bold text-primary">{cruz.base.number}</div>
        </div>
        <div className="text-sm font-semibold mt-2">{cruz.base.name}</div>
        <div className="text-xs text-muted-foreground">{cruz.base.icon}</div>
      </div>
    </div>
  );
};
