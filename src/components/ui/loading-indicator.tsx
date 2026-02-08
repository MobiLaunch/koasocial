import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show as indeterminate (continuous) */
  indeterminate?: boolean;
  /** Progress value 0-100 for determinate mode */
  value?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color variant using design tokens */
  variant?: "primary" | "secondary" | "accent";
}

const LoadingIndicator = React.forwardRef<HTMLDivElement, LoadingIndicatorProps>(
  ({ className, indeterminate = true, value = 0, size = "md", variant = "primary", ...props }, ref) => {
    const heights = {
      sm: "h-1",
      md: "h-1.5",
      lg: "h-2",
    };

    const colors = {
      primary: "bg-primary",
      secondary: "bg-secondary",
      accent: "bg-accent-foreground",
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : value}
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted/30",
          heights[size],
          className
        )}
        {...props}
      >
        {indeterminate ? (
          <div
            className={cn(
              "h-full rounded-full animate-loading-slide",
              colors[variant]
            )}
            style={{ width: "30%" }}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              colors[variant]
            )}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        )}
      </div>
    );
  }
);
LoadingIndicator.displayName = "LoadingIndicator";

export { LoadingIndicator };
