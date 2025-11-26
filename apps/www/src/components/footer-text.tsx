"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LoopingGif } from "./looping-gif";

export function FooterText() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm text-black dark:text-white max-w-5xl w-full justify-end">
        <span>made with love - trueOS.dev</span>
        <div className="w-8 h-8" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="flex items-center gap-2 text-sm text-black dark:text-white max-w-5xl w-full justify-end">
      <span>made with love - trueOS.dev</span>
      <LoopingGif 
        src={currentTheme === "light" ? "/kittyLight.gif" : "/kitty.gif"}
        alt="kitty" 
        width={32} 
        height={32}
        className="inline-block"
      />
    </div>
  );
}

