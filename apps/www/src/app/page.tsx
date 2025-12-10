"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { FooterText } from "@/components/footer-text";
import { Terminal } from "@/components/terminal/terminal";
import { useTerminal } from "@/hooks/useTerminal";
import { useEffect, useState } from "react";

export default function Home() {
  const { isTerminalMode } = useTerminal();
  const [defaultLayout, setDefaultLayout] = useState<number[] | undefined>(undefined);

  useEffect(() => {
    // Client-side only access to cookies
    const layoutCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("react-resizable-panels:layout="));
    if (layoutCookie) {
      const layoutValue = layoutCookie.split("=")[1];
      try {
        setDefaultLayout(JSON.parse(decodeURIComponent(layoutValue)));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  if (isTerminalMode) {
    return <Terminal />;
  }

  return (
    <>
      <div className="z-10 border border-black dark:border-white rounded-lg max-w-5xl w-full h-3/4 text-sm flex">
        <ChatLayout defaultLayout={defaultLayout} navCollapsedSize={8} />
      </div>
      <FooterText />
    </>
  );
}