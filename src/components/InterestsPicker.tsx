import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SUGGESTED_INTERESTS = [
  '🎨 Art', '📚 Books', '💻 Coding', '🎮 Gaming', '🎵 Music',
  '📷 Photography', '🌱 Nature', '✈️ Travel', '🍳 Cooking', '🎬 Movies',
  '🏃 Fitness', '🐾 Pets', '🔬 Science', '📱 Tech', '🎭 Theater',
  '⚽ Sports', '🧘 Wellness', '🎯 Design', '📝 Writing', '🌍 Environment',
];

interface InterestsPickerProps {
  interests: string[];
  onChange: (interests: string[]) => void;
  maxInterests?: number;
}

export function InterestsPicker({ 
  interests, 
  onChange, 
  maxInterests = 10 
}: InterestsPickerProps) {
  const [inputValue, setInputValue] = useState('');

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && !interests.includes(trimmed) && interests.length < maxInterests) {
      onChange([...interests, trimmed]);
    }
    setInputValue('');
  };

  const removeInterest = (interest: string) => {
    onChange(interests.filter(i => i !== interest));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest(inputValue);
    }
  };

  const availableSuggestions = SUGGESTED_INTERESTS.filter(
    s => !interests.includes(s)
  );

  return (
    <div className="space-y-4">
      {/* Current interests */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Badge
              key={interest}
              variant="secondary"
              className="pl-3 pr-1.5 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors gap-1.5 group"
            >
              {interest}
              <button
                onClick={() => removeInterest(interest)}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add custom interest */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom interest..."
          className="rounded-xl h-10 bg-accent/30 border-transparent focus:border-primary/50"
          disabled={interests.length >= maxInterests}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addInterest(inputValue)}
          disabled={!inputValue.trim() || interests.length >= maxInterests}
          className="rounded-xl h-10 w-10 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggested interests */}
      {availableSuggestions.length > 0 && interests.length < maxInterests && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Suggested interests
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addInterest(suggestion)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border border-border",
                  "bg-background hover:bg-accent hover:border-primary/50",
                  "transition-all duration-200 hover:scale-105"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-muted-foreground text-right">
        {interests.length}/{maxInterests} interests
      </p>
    </div>
  );
}
