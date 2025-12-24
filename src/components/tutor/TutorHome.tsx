import { useState, useRef, useEffect, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Settings, Loader2 } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";
import { MinimalExerciseView } from "./MinimalExerciseView";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "tutor";
  content: string;
  timestamp: Date;
}

interface Exercise {
  question: string;
  hints: string[];
  difficulty: string;
}

export function TutorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [studentName, setStudentName] = useState<string>("");
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ElevenLabs conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice connected");
      setIsVoiceActive(true);
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log("Voice disconnected");
      setIsVoiceActive(false);
    },
    onMessage: (message) => {
      if (message.source === "ai" && message.message) {
        addMessage("tutor", message.message);
      }
    },
    onError: (error) => {
      console.error("Voice error:", error);
      setIsVoiceActive(false);
      setIsConnecting(false);
    },
  });

  // Load student name
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, display_name")
        .eq("id", user.id)
        .single();
      if (data) {
        setStudentName(data.first_name || data.display_name || "");
      }
    };
    loadProfile();
  }, [user]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = studentName
        ? `Hey ${studentName}! What would you like to work on today?`
        : "Hey! What would you like to work on today?";
      addMessage("tutor", greeting);
    }
  }, [studentName]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: "user" | "tutor", content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addMessage("user", userMessage);
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.map((m) => ({
        role: m.role === "tutor" ? "assistant" : "user",
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ask-tutor", {
        body: {
          message: userMessage,
          conversationHistory,
          context: currentExercise
            ? `Current exercise: ${currentExercise.question}`
            : undefined,
        },
      });

      if (error) throw error;

      const response = data?.response || "I'm here to help. What would you like to learn?";
      addMessage("tutor", response);

      // Check if response contains an exercise
      if (data?.exercise) {
        setCurrentExercise(data.exercise);
      }
    } catch (err) {
      console.error("Tutor error:", err);
      addMessage("tutor", "I had trouble processing that. Let's try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = useCallback(async () => {
    if (isVoiceActive) {
      await conversation.endSession();
      setIsVoiceActive(false);
    } else {
      setIsConnecting(true);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const { data, error } = await supabase.functions.invoke(
          "elevenlabs-conversation-token",
          { body: { mode: "token" } }
        );

        if (error || !data?.token) {
          throw new Error("Failed to get voice token");
        }

        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
        });
      } catch (err) {
        console.error("Voice connection failed:", err);
        setIsConnecting(false);
      }
    }
  }, [isVoiceActive, conversation]);

  const handleExerciseAnswer = (answer: string) => {
    addMessage("user", `My answer: ${answer}`);
    // The tutor will evaluate via the next message
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="font-display text-xl text-foreground">Learn</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-4">
        {/* Exercise view (when active) */}
        <AnimatePresence>
          {currentExercise && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <MinimalExerciseView
                question={currentExercise.question}
                hints={currentExercise.hints}
                onAnswer={handleExerciseAnswer}
                onDismiss={() => setCurrentExercise(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation */}
        <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
          <div className="space-y-4 py-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === "user" ? "user-bubble" : "tutor-bubble"
                    }`}
                  >
                    <MathRenderer latex={message.content} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="tutor-bubble">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Button
              variant={isVoiceActive ? "default" : "outline"}
              size="icon"
              onClick={toggleVoice}
              disabled={isConnecting}
              className={`shrink-0 rounded-full h-11 w-11 ${
                isVoiceActive ? "bg-primary animate-pulse-gentle" : ""
              }`}
            >
              {isConnecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isVoiceActive ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type or tap mic to speak..."
              className="flex-1 h-11 rounded-full bg-card border-border/50 px-5"
              disabled={isVoiceActive}
            />

            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isVoiceActive}
              className="shrink-0 rounded-full h-11 w-11"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {isVoiceActive && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground mt-3"
            >
              {conversation.isSpeaking ? "Tutor is speaking..." : "Listening..."}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
