import { TutoringMode } from '@/contexts/TutorSessionContext';
import { cn } from '@/lib/utils';
import { Lightbulb, BookOpen, CheckCircle2 } from 'lucide-react';

interface TutoringModeSelectorProps {
  mode: TutoringMode;
  onModeChange: (mode: TutoringMode) => void;
  disabled?: boolean;
}

const modeConfig: Record<TutoringMode, { icon: typeof Lightbulb; label: string; description: string }> = {
  hint: {
    icon: Lightbulb,
    label: 'Hints',
    description: 'Guide me with hints',
  },
  solution: {
    icon: BookOpen,
    label: 'Full Solution',
    description: 'Show me the steps',
  },
  'quick-check': {
    icon: CheckCircle2,
    label: 'Quick Check',
    description: 'Check my answer',
  },
};

export function TutoringModeSelector({ mode, onModeChange, disabled }: TutoringModeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
      {(Object.keys(modeConfig) as TutoringMode[]).map((modeKey) => {
        const config = modeConfig[modeKey];
        const Icon = config.icon;
        const isActive = mode === modeKey;

        return (
          <button
            key={modeKey}
            onClick={() => onModeChange(modeKey)}
            disabled={disabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={config.description}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
