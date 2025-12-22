import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-card-foreground",
        elevated: "bg-gradient-to-br from-card to-card/80 border-border shadow-card text-card-foreground",
        glass: "glass text-card-foreground",
        selected: "bg-card border-2 border-primary shadow-gold text-card-foreground",
        bento: "bg-gradient-to-br from-card via-card to-muted/20 border-border shadow-card hover:shadow-card-hover hover:border-primary/20 text-card-foreground",
        premium: [
          "relative bg-gradient-to-br from-charcoal-700 to-charcoal-900",
          "border border-charcoal-600",
          "shadow-card",
          "text-card-foreground",
          "before:absolute before:inset-0 before:rounded-2xl before:p-[1px]",
          "before:bg-gradient-to-br before:from-primary/30 before:via-transparent before:to-transparent",
          "before:pointer-events-none before:opacity-0 before:transition-opacity before:duration-300",
          "hover:border-primary/30 hover:shadow-card-hover hover:shadow-gold",
          "hover:before:opacity-100",
          "hover:-translate-y-0.5",
        ].join(" "),
        stat: [
          "relative overflow-hidden",
          "bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900",
          "border border-charcoal-600",
          "shadow-lg",
          "text-card-foreground",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:pointer-events-none",
        ].join(" "),
        interactive: [
          "bg-card border-border text-card-foreground cursor-pointer",
          "hover:bg-card-hover hover:border-primary/30",
          "hover:shadow-card-hover hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-card",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-display text-xl font-medium leading-none tracking-wide uppercase", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
