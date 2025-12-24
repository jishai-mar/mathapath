import { useEffect } from 'react';

interface GlobalElevenLabsWidgetProps {
  agentId?: string;
}

export function GlobalElevenLabsWidget({
  agentId = 'agent_4501kd82684tegmad70k26kqzs17',
}: GlobalElevenLabsWidgetProps) {
  useEffect(() => {
    // Check if widget already exists to prevent duplicates
    const existingWidget = document.querySelector('elevenlabs-convai');
    if (existingWidget) {
      return;
    }

    // Create and append the ElevenLabs widget element to body
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', agentId);
    document.body.appendChild(widget);

    return () => {
      // Cleanup on unmount
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.remove();
      }
    };
  }, [agentId]);

  // This component doesn't render anything visible - the widget floats on the page
  return null;
}
