import React, { useState, useEffect } from 'react';
import Message from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Loader2, User, Database } from 'lucide-react';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  content: string;
  type: 'user' | 'assistant';
  name: string;
  avatar: string;
  format?: string;
  query?: string;
  chart?: string;
  createdAt?: any;
  userId?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<string>('text');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const messageEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setMessages([]);
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      return;
    }

    const q = query(
      collection(db, "chats", user.uid, "messages"),
      orderBy("createdAt", "asc")
    );

    setIsLoading(true);

    // Set up real-time listener
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const loadedMessages: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.text || data.content) {
            loadedMessages.push({
              content: data.text || data.content,
              type: data.type || (data.name === "User" ? "user" : "assistant"),
              name: data.name,
              avatar: data.avatar || "/user-avatar.png",
              format: data.format,
              query: data.query,
              chart: data.chart,
              createdAt: data.createdAt,
              userId: data.uid || data.userId
            });
          }
        });
        setMessages(loadedMessages);
        setIsLoading(false);
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      (error) => {
        console.error("Error loading messages:", error);
        setIsLoading(false);
        setMessages([]);
      }
    );

    setUnsubscribe(() => unsub);

    return () => {
      unsub();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      setMessages([]);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSendMessage = async (message: string) => {
    if (!user) return;
    // The actual implementation is in ChatInput
    console.log('Message sent:', message);
  };

  const handleFormatChange = (format: string) => {
    setCurrentFormat(format);
  };

  return (
    <div className={`flex h-screen flex-col ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <header className={`px-8 py-6 border-b ${
        theme === 'light' 
          ? 'bg-white border-gray-200' 
          : 'bg-gray-900/50 border-gray-800'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className={`text-3xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            QueryX
          </h1>
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/database-setup')}
              className={`h-10 w-10 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}
              title="Connect your database"
            >
              <Database className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className={`h-10 w-10 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            {user && (
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user.photoURL || ''} 
                  alt={user.displayName || 'User avatar'}
                />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            )}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className={`text-base px-6 py-2 h-10 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto pb-48">
          <div className="max-w-7xl mx-auto px-8 pt-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <Message
                    key={index}
                    {...message}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12 text-xl">
                Start a conversation by asking a question about your data
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent h-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <ChatInput 
              onSend={(message) => console.log('Message sent:', message)}
              disabled={isLoading}
              onFormatChange={setCurrentFormat}
              currentFormat={currentFormat}
              theme={theme}
              scroll={messageEndRef}
              setMessages={setMessages}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;