"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      className="toaster group"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
        },
        classNames: {
          toast: "group toast backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ease-out transform",
          title: "text-sm font-semibold leading-tight",
          description: "text-sm opacity-90 mt-1",
          actionButton: "bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          cancelButton: "bg-white/10 hover:bg-white/20 text-white/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          closeButton: "bg-white/10 hover:bg-white/20 text-white/80 border border-white/10 rounded-lg transition-colors",
          success: "bg-emerald-600/90 text-white border-emerald-500/30",
          error: "bg-red-600/90 text-white border-red-500/30",
          info: "bg-slate-800/90 text-white border-slate-700/30",
          warning: "bg-amber-600/90 text-white border-amber-500/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }