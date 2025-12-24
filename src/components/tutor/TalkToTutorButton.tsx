import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConversationalTutor } from './ConversationalTutor';
import { Phone, MessageCircle } from 'lucide-react';

interface TalkToTutorButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'floating';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function TalkToTutorButton({ 
  variant = 'primary', 
  size = 'default',
  className = '',
  showLabel = true 
}: TalkToTutorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'floating') {
    return (
      <>
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
          {/* Talk button */}
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full h-14 w-14 p-0 shadow-lg bg-primary hover:bg-primary/90"
            title="Talk to your tutor"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>

        <ConversationalTutor isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  const buttonVariant = variant === 'primary' ? 'default' : variant === 'secondary' ? 'secondary' : 'ghost';

  return (
    <>
      <Button
        variant={buttonVariant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`gap-2 ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        {showLabel && 'Talk to tutor'}
      </Button>

      <ConversationalTutor isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
