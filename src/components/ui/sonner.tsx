"use client"

import { useEffect } from "react"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { TOAST_EVENT_NAME } from "@/components/toast"

/** Listens for `showToastViaEvent` and forwards to Sonner. */
function SonnerToastBridge() {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail === "string" && detail.length > 0) toast(detail)
    }
    window.addEventListener(TOAST_EVENT_NAME, handler)
    return () => window.removeEventListener(TOAST_EVENT_NAME, handler)
  }, [])
  return null
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
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
    <SonnerToastBridge />
    </>
  )
}

export { Toaster }
