
import React from 'react';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  format?: string;
  query?: string;
  chart?: string;
  avatar?: string;
  name?: string;
  userId?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  format,
  query,
  chart,
  avatar,
  name
}) => {
  return (
    <div className={cn(
      "flex items-start w-full p-4 space-x-4",
      type === 'assistant' ? 'flex-row' : 'flex-row-reverse'
    )}>
      {/* Avatar aligned with message */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden">
        <img 
          src={avatar} 
          alt={type === 'user' ? 'User Avatar' : 'Assistant Avatar'} 
          className="w-full h-full object-cover"
        />
      </div>
    
      {/* Message Content */}
      <div className="flex flex-col space-y-1 max-w-[80%]">
        {name && (
          <p className="text-sm font-medium text-muted-foreground">{name}</p>
        )}
        {chart ? (
          <div className="rounded-lg overflow-hidden">
            <img src={chart} alt="Data Visualization" className="w-full max-w-2xl" />
          </div>
        ) : type === "assistant" && (format === "table" || format === "json") ? (
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
            {content}
          </pre>
        ) : (
          <p className="text-sm leading-relaxed text-foreground">{content}</p>
        )}
    
        {query && (
          <div className="mt-2 p-2 rounded-lg bg-muted/50">
            <p className="font-mono text-xs text-muted-foreground">SQL: {query}</p>
          </div>
        )}
      </div>
    </div>    
  );
};