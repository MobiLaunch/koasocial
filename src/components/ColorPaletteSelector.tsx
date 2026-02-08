import { useState, useEffect } from 'react';
import { Check, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { palettes, applyPalette, getStoredPalette, type ColorPalette } from '@/lib/palettes';
import { cn } from '@/lib/utils';

export function ColorPaletteSelector() {
  const [selectedPalette, setSelectedPalette] = useState<string>('Coral Sunset');

  useEffect(() => {
    const stored = getStoredPalette();
    if (stored) {
      setSelectedPalette(stored.name);
    }
  }, []);

  const handleSelect = (palette: ColorPalette) => {
    setSelectedPalette(palette.name);
    applyPalette(palette);
  };

  return (
    <Card className="rounded-3xl border-0 koa-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          Color Theme
        </CardTitle>
        <CardDescription className="pl-13">Choose your preferred color palette</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {palettes.map((palette) => {
            const isSelected = selectedPalette === palette.name;
            return (
              <button
                key={palette.name}
                onClick={() => handleSelect(palette)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                  isSelected 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                )}
              >
                {/* Color swatches */}
                <div className="flex gap-1">
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm"
                    style={{ backgroundColor: `hsl(${palette.primary})` }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm"
                    style={{ backgroundColor: `hsl(${palette.secondary})` }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm"
                    style={{ backgroundColor: `hsl(${palette.accent})` }}
                  />
                </div>
                
                {/* Label */}
                <span className="text-xs font-medium text-center leading-tight">
                  {palette.name}
                </span>
                
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
