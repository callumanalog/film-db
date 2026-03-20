"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-center"
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "#fff",
          "--normal-border": "var(--foreground)",
          "--border-radius": "var(--radius-card)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!rounded-card !shadow-lg !border-0 !font-sans !text-sm !font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
