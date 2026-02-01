import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary hover:bg-primary/10"
          type="button"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-0 shadow-xl" 
        side="top" 
        align="start"
        sideOffset={8}
      >
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          theme="light"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={2}
          navPosition="bottom"
          perLine={8}
        />
      </PopoverContent>
    </Popover>
  );
}
