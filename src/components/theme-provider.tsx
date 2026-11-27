"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  return (
    <div suppressHydrationWarning>
      <NextThemesProvider 
        {...props}
        forcedTheme="dark"
        enableSystem={false}
        defaultTheme="dark"
        attribute="class"
      >
        {children}
      </NextThemesProvider>
    </div>
  )
}