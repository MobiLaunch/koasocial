import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function Logo({ size = 'md', linkTo, className }: LogoProps) {
  const textSize = sizeClasses[size];

  const content = (
    <div className={cn("flex items-center", className)}>
      <span className={cn(
        "font-logo font-bold text-foreground tracking-tight",
        textSize
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
