import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Viewport, type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { SessionProviderWrapper } from "@/components/session-provider";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: "TakoBin - Paste Anything",
  description: "A paste bin alternative with syntax highlighting and file uploads",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TakoBin"
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <head>
        <script src="/pwa.js" defer></script>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProviderWrapper>
            <TRPCReactProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <div className="flex-1">{children}</div>
                <footer className="border-t py-6 md:py-0 px-4 md:px-6">
                  <div className="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row max-w-full mx-auto">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                      Built with Next.js, Tailwind CSS, and shadcn/ui.
                    </p>
                  </div>
                </footer>
              </div>
              <Toaster />
            </TRPCReactProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
