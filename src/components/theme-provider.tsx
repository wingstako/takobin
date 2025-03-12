"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Use React.ComponentProps to extract the props type from NextThemesProvider
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}