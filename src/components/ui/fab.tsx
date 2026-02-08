import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fabVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        surface: "bg-card text-card-foreground hover:bg-accent border border-border",
        tertiary: "bg-accent text-accent-foreground hover:bg-accent/80",
      },
      size: {
        sm: "h-10 w-10 [&_svg]:h-4 [&_svg]:w-4",
        md: "h-14 w-14 [&_svg]:h-6 [&_svg]:w-6",
        lg: "h-16 w-16 [&_svg]:h-7 [&_svg]:w-7",
        extended: "h-14 px-6 gap-3 [&_svg]:h-6 [&_svg]:w-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface FABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  /** For extended FAB, show label text */
  label?: string;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, variant, size, label, children, ...props }, ref) => {
    const isExtended = !!label || size === "extended";
    
    return (
      <button
        className={cn(
          fabVariants({ 
            variant, 
            size: isExtended ? "extended" : size, 
            className 
          })
        )}
        ref={ref}
        {...props}
      >
        {children}
        {label && <span className="font-semibold text-base">{label}</span>}
      </button>
    );
  }
);
FAB.displayName = "FAB";

export { FAB, fabVariants };
