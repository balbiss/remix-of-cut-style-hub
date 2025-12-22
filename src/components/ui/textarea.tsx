import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[120px] w-full rounded-xl text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
  {
    variants: {
      variant: {
        default: [
          "border-2 border-border bg-secondary",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "hover:border-charcoal-500",
        ].join(" "),
        filled: [
          "border-0 bg-charcoal-700",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "hover:bg-charcoal-600",
        ].join(" "),
        premium: [
          "border-2 border-charcoal-500 bg-gradient-to-br from-charcoal-700 to-charcoal-800",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "focus-visible:shadow-inner-gold",
          "hover:border-charcoal-400",
        ].join(" "),
      },
      textareaSize: {
        default: "px-4 py-3 text-base",
        sm: "px-3 py-2 text-sm min-h-[80px] rounded-lg",
        lg: "px-5 py-4 text-lg min-h-[160px]",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, textareaSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
