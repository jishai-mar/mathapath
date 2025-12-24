import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ElevenLabsAgentProps {
  agentId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  autoConnect?: boolean;
  onMessage?: (message: any) => void;
  onStatusChange?: (status: 'connected' | 'disconnected') => void;
}

const sizeConfig = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};

export function ElevenLabsAgent({
  agentId = 'agent_4501kd82684tegmad70k26kqzs17',
  size = 'md',
  className,
  autoConnect = false,
  onMessage,
  onStatusChange,
}: ElevenLabsAgentProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      onStatusChange?.('connected');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      onStatusChange?.('disconnected');
    },
    onMessage: (message) => {
      console.log('Agent message:', message);
      onMessage?.(message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    if (conversation.status === 'connected') return;
    
    setIsConnecting(true);
    setPermissionDenied(false);
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // For public agents, pass agentId directly to startSession
      await conversation.startSession({
        agentId,
        clientTools: {},
      } as any);
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  useEffect(() => {
    if (autoConnect) {
      startConversation();
    }
    
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [autoConnect]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Agent Avatar */}
      <motion.div 
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20',
          'border-2 border-border/30',
          sizeConfig[size]
        )}
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
          boxShadow: isConnected 
            ? isSpeaking
              ? ['0 0 0 0 hsl(var(--primary)/0.4)', '0 0 0 20px hsl(var(--primary)/0)', '0 0 0 0 hsl(var(--primary)/0.4)']
              : '0 0 20px hsl(var(--secondary)/0.3)'
            : '0 0 0 0 transparent',
        }}
        transition={{
          duration: isSpeaking ? 1.5 : 0.3,
          repeat: isSpeaking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Inner glow when connected */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-2 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Center icon */}
        <motion.div
          animate={{ 
            scale: isConnecting ? [1, 1.1, 1] : 1,
          }}
          transition={{ 
            duration: 0.8, 
            repeat: isConnecting ? Infinity : 0 
          }}
          className="relative z-10"
        >
          {isConnected ? (
            isSpeaking ? (
              <motion.div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-8 bg-primary rounded-full"
                    animate={{ 
                      scaleY: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <Mic className="w-10 h-10 text-secondary" />
            )
          ) : (
            <MicOff className="w-10 h-10 text-muted-foreground" />
          )}
        </motion.div>

        {/* Listening indicator rings */}
        <AnimatePresence>
          {isConnected && !isSpeaking && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-secondary/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ 
                    scale: [1, 1.3 + i * 0.1],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={isConnected ? (isSpeaking ? 'speaking' : 'listening') : 'disconnected'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-sm text-muted-foreground"
        >
          {isConnecting 
            ? 'Verbinden...' 
            : isConnected 
              ? isSpeaking 
                ? 'Gilbert spreekt...' 
                : 'Gilbert luistert...'
              : permissionDenied 
                ? 'Microfoon toegang geweigerd' 
                : 'Klik om te praten met Gilbert'
          }
        </motion.p>
      </AnimatePresence>

      {/* Connect/Disconnect button */}
      <Button
        variant={isConnected ? 'destructive' : 'default'}
        size="lg"
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        className="gap-2 rounded-full px-6"
      >
        {isConnected ? (
          <>
            <PhoneOff className="w-4 h-4" />
            Stop gesprek
          </>
        ) : (
          <>
            <Phone className="w-4 h-4" />
            {isConnecting ? 'Verbinden...' : 'Start gesprek'}
          </>
        )}
      </Button>
    </div>
  );
}
