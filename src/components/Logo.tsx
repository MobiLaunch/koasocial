import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  linkTo?: string;
  className?: string;
}

const sizeClasses = {
  sm: {
    icon: 'h-8 w-8 rounded-xl text-sm',
    text: 'text-xl',
  },
  md: {
    icon: 'h-10 w-10 rounded-2xl text-xl',
    text: 'text-2xl',
  },
  lg: {
    icon: 'h-12 w-12 rounded-2xl text-2xl',
    text: 'text-3xl',
  },
};

export function Logo({ size = 'md', showIcon = true, linkTo, className }: LogoProps) {
  const sizes = sizeClasses[size];

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && (
        <div className={cn(
          "koa-gradient flex items-center justify-center",
          sizes.icon
        )}>
          <span>🐨</span>
        </div>
      )}
      <span className={cn(
        "font-logo font-bold text-foreground tracking-tight",
        sizes.text
      )}>
        koasocial
        <span className="text-primary">.</span>
      </span>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
