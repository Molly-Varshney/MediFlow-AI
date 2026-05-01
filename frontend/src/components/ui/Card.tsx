import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  /** Adds a hover lift effect. NOT forwarded to the DOM. */
  hover?: boolean;
  /** Controls internal padding size. NOT forwarded to the DOM. */
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      title,
      subtitle,
      footer,
      children,
      hover = false,
      padding = "md",
      ...props
    },
    ref
  ) => {
    const paddingMap = {
      none: "",
      sm:   "p-4",
      md:   "p-6",
      lg:   "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-xl shadow-sm border border-bgSoft overflow-hidden",
          hover && "cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-md",
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="p-6 pb-0">
            {title    && <h3 className="font-display text-primary text-xl font-semibold">{title}</h3>}
            {subtitle && <p className="text-secondary text-sm mt-1">{subtitle}</p>}
          </div>
        )}
        <div className={cn(paddingMap[padding])}>{children}</div>
        {footer && <div className="p-6 bg-white border-t border-bgSoft pt-4">{footer}</div>}
      </div>
    );
  }
);
Card.displayName = "Card";
