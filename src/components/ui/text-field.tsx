"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Spacing between label and input — applied to all TextField usages */
const LABEL_TO_INPUT_GAP = "mb-1";
/** Label text style (style guide: text-ui / 13px). Uses .text-field-label from globals so font-size always applies. */
const LABEL_CLASSES = "text-field-label";

export interface TextFieldProps extends Omit<React.ComponentProps<typeof Input>, "id"> {
  id: string;
  label: string;
  /** Optional node after the label (e.g. "Forgot password?" link) */
  labelSuffix?: React.ReactNode;
  /** Optional prefix shown inside the input (e.g. "@ ") that stays visible while typing */
  prefix?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, labelSuffix, prefix, className, inputClassName, type, value, ...inputProps }, ref) => {
    const [revealPassword, setRevealPassword] = React.useState(false);
    const isPassword = type === "password";
    const hasValue = typeof value === "string" && value.length > 0;
    const showReveal = isPassword && hasValue;
    const inputType = isPassword && revealPassword ? "text" : type;

    const input = (
      <Input
        ref={ref}
        id={id}
        type={inputType}
        value={value}
        className={cn(
          prefix
            ? "flex-1 min-w-0 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 pl-0"
            : "bg-background",
          showReveal && "pr-10",
          inputClassName
        )}
        {...inputProps}
      />
    );

    const inputWithReveal =
      isPassword && !prefix ? (
        <div className="relative w-full">
          {input}
          {showReveal && (
            <button
              type="button"
              onClick={() => setRevealPassword((p) => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={revealPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {revealPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}
        </div>
      ) : (
        input
      );

    return (
      <div className={cn("space-y-0 mb-1.5", className)}>
        {labelSuffix ? (
          <div className={cn(LABEL_TO_INPUT_GAP, "flex items-center justify-between")}>
            <label htmlFor={id} className={LABEL_CLASSES}>
              {label}
            </label>
            {labelSuffix}
          </div>
        ) : (
          <label htmlFor={id} className={cn(LABEL_TO_INPUT_GAP, "block", LABEL_CLASSES)}>
            {label}
          </label>
        )}
        {prefix ? (
          <div className="flex min-h-10 w-full items-baseline rounded-card border border-input bg-background">
            <span className="shrink-0 pl-2.5 font-sans text-ui text-muted-foreground leading-10" aria-hidden>
              {prefix}
            </span>
            {inputWithReveal}
          </div>
        ) : (
          inputWithReveal
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";

export { TextField };
