import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles following Figma TextField Outlined design
          "flex h-10 w-full rounded-lg border bg-background px-3 py-2",
          // Typography - 14px, font-weight 400, line-height 1.57
          "text-sm font-normal leading-[1.57]",
          // Border styles - default state
          "border-[rgba(145,158,171,0.2)]",
          // Hover state
          "hover:border-[rgba(145,158,171,0.32)]",
          // Focus state - following design system
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0",
          // Placeholder styling
          "placeholder:text-[rgba(145,158,171,0.6)]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[rgba(145,158,171,0.08)]",
          // Error state
          error && "border-destructive focus-visible:border-destructive",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Transition for smooth interactions
          "transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }