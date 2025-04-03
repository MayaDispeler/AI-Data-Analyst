  import React, { useState, KeyboardEvent } from 'react';
  import { Button } from './ui/button';
  import { Textarea } from './ui/textarea';
  import {
    Send,
    BarChart3,
    PieChart,
    LineChart,
    FileJson,
    Table as TableIcon,
    FileText,
  } from 'lucide-react';
  import { cn } from '@/lib/utils';
  import { auth, db } from "@/lib/firebase";
  import { addDoc, collection, serverTimestamp } from "firebase/firestore";

  interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    onFormatChange?: (format: string) => void;
    currentFormat?: string;
    theme?: 'light' | 'dark';
    scroll?: React.RefObject<HTMLDivElement>;
    setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  }

  const formatOptions = [
    { icon: FileText, label: 'Text', value: 'text' },
    { icon: FileJson, label: 'JSON', value: 'json' },
    { icon: TableIcon, label: 'Table', value: 'table' },
    { icon: BarChart3, label: 'Bar', value: 'bar_chart' },
    { icon: PieChart, label: 'Pie', value: 'pie_chart' },
    { icon: LineChart, label: 'Line', value: 'line_chart' },
  ];

  export const ChatInput: React.FC<ChatInputProps> = ({ 
    onSend, 
    disabled,
    onFormatChange,
    currentFormat,
    theme = 'light',
    scroll,
    setMessages
  }) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()
        || isLoading
      ) return;

      const { uid, photoURL } = auth.currentUser || {};
    
      if (!uid) {
        alert("You must be signed in to send messages.");
        return;
      }

      try {
        setIsLoading(true);
        
        // Create user message object
        const userMessage = {
          type: 'user' as const,
          content: message.trim(),
          format: currentFormat || 'text',
          createdAt: serverTimestamp(),
          avatar: photoURL || "/user-avatar.png",
          name: "",
          userId: uid
        };
        
        // Add user message to UI
        setMessages?.(prev => [...prev, userMessage]);
    
        // Send to AI backend
        const response = await fetch("http://127.0.0.1:8000/query/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            format: currentFormat || 'text'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to get response from AI");
        }

        // Create AI message
        const aiMessage = {
          type: 'assistant' as const,
          content: data.message || data.result,
          format: currentFormat || 'text',
          createdAt: serverTimestamp(),
          avatar: "https://kissflow.com/hubfs/Logo-Verticle-Light.svg",
          name: "",
          userId: uid,
          ...(data.query && { query: data.query }),
          ...(data.chart && { chart: data.chart })
        };

        // Add AI message to UI
        setMessages?.(prev => [...prev, aiMessage]);

        // Store messages in Firestore
        await Promise.all([
          addDoc(collection(db, "chats", uid, "messages"), userMessage),
          addDoc(collection(db, "chats", uid, "messages"), aiMessage)
        ]);

        onSend(message);
        setMessage('');

      } catch (error) {
        console.error("Error:", error);
        
        // Add error message as a separate AI message
        const errorMessage = {
          type: 'assistant' as const,
          content: error instanceof Error ? error.message : "Failed to get AI response. Please try again.",
          format: 'text',
          createdAt: serverTimestamp(),
          avatar: "/error-icon.png",
          name: "",
          userId: uid
        };
        
        setMessages?.(prev => [...prev, errorMessage]);
        await addDoc(collection(db, "chats", uid, "messages"), errorMessage);
      } finally {
        setIsLoading(false);
        scroll?.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    return (
      <div className="flex flex-col w-full">
        {/* Messages Container (Ensuring Enough Bottom Space) */}
        <div className="flex-1 overflow-auto pb-24">
          {/* Messages will be rendered above this component */}
        </div>

        {/* Chat Input Floating at Bottom with No Border */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-3xl flex flex-col items-center">
          <div className="w-full">
            <form onSubmit={handleSubmit} className="relative bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-4">
              {/* Text Input */}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your data... (Press Enter to send, Shift+Enter for new line)"
                className="w-full min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded-lg p-3"
                style={{ paddingBottom: "16px" }}
                disabled={disabled || isLoading}
              />
              
              {/* Send Button */}
              <Button 
                type="submit" 
                disabled={disabled || isLoading || !message.trim()}
                className="absolute right-4 bottom-4 h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                size="icon"
              >
                {isLoading ? "..." : <Send className="w-4 h-4" />}
              </Button>

              {/* Format Buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = currentFormat === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      className={`h-8 px-2 text-xs rounded-md flex items-center ${
                        isSelected ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 hover:bg-blue-50"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();  // Prevent form submission
                        e.stopPropagation(); // Stop event bubbling
                        onFormatChange?.(option.value);
                      }}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {option.label}
                    </Button>

                  );
                })}
              </div>
            </form>
          </div>

          {/* AI Disclaimer Below Input */}
          <p className="text-center text-xs text-gray-500 mt-2">
            AI responses may not always be accurate. Double-check critical information.
          </p>
        </div>
      </div>
    );
  }
  export default ChatInput;