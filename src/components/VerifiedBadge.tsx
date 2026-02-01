import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  tier?: 'founder' | 'notable' | 'verified' | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const tierConfig = {
  founder: {
    label: 'Founder',
    description: 'Platform founder',
    colorClass: 'text-primary', // Uses the orange/coral primary color
  },
  notable: {
    label: 'Notable',
    description: 'Notable figure',
    colorClass: 'text-primary',
  },
  verified: {
    label: 'Verified',
    description: 'Verified account',
    colorClass: 'text-blue-500',
  },
};

const sizeConfig = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function VerifiedBadge({ 
  tier = 'verified', 
  size = 'md', 
  className,
  showTooltip = true 
}: VerifiedBadgeProps) {
  if (!tier) return null;

  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.verified;
  const sizeClass = sizeConfig[size];

  const badge = (
    <BadgeCheck 
      className={cn(
        sizeClass,
        config.colorClass,
        'inline-block flex-shrink-0',
        className
      )} 
    />
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center cursor-help">
          {badge}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
