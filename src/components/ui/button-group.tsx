import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the button group */
  orientation?: "horizontal" | "vertical";
  /** Size applied to all buttons */
  size?: ButtonProps["size"];
  /** Variant applied to all buttons */
  variant?: ButtonProps["variant"];
  /** Whether buttons should fill available space equally */
  fullWidth?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", size, variant, fullWidth, children, ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";
    
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex",
          isHorizontal ? "flex-row" : "flex-col",
          fullWidth && "w-full",
          // Remove inner borders and round only outer edges
          "[&>button]:rounded-none",
          isHorizontal && [
            "[&>button:first-child]:rounded-l-xl",
            "[&>button:last-child]:rounded-r-xl",
            "[&>button:not(:last-child)]:border-r-0",
          ],
          !isHorizontal && [
            "[&>button:first-child]:rounded-t-xl",
            "[&>button:last-child]:rounded-b-xl",
            "[&>button:not(:last-child)]:border-b-0",
          ],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<ButtonProps>(child) && child.type === Button) {
            return React.cloneElement(child, {
              size: child.props.size ?? size,
              variant: child.props.variant ?? variant,
              className: cn(
                fullWidth && "flex-1",
                child.props.className
              ),
            });
          }
          return child;
        })}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };
