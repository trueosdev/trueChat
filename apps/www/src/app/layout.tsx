import type { Metadata } from "next";
import { Questrial } from "next/font/google";
import "./globals.css";
import "./terminal.css";
import "@shadcn-chat/ui/styles.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { AuthProvider } from "@/components/auth/auth-provider";
import { TerminalModeProvider } from "@/components/terminal/terminal-mode-provider";

const questrial = Questrial({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "trueChats",
  description: "Always true.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={questrial.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TerminalModeProvider>
            <main className="flex h-[calc(100dvh)] flex-col items-center justify-center p-4 md:px-24 py-32 gap-4">
              {children}
            </main>
            </TerminalModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
