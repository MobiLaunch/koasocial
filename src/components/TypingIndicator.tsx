import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  usernames: string[];
  className?: string;
}

export function TypingIndicator({ usernames, className }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const displayText = usernames.length === 1 
    ? `${usernames[0]} is typing`
    : usernames.length === 2 
      ? `${usernames[0]} and ${usernames[1]} are typing`
      : `${usernames[0]} and ${usernames.length - 1} others are typing`;

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
      {/* Animated blob */}
      <div className="flex items-center gap-1">
        <span className="typing-blob w-2.5 h-2.5 bg-primary rounded-full" />
        <span className="typing-blob w-2.5 h-2.5 bg-primary rounded-full" />
        <span className="typing-blob w-2.5 h-2.5 bg-primary rounded-full" />
      </div>
      
      {/* Text */}
      <span className="text-sm text-muted-foreground animate-pulse">
        {displayText}
      </span>
    </div>
  );
}
