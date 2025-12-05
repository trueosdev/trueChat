"use client";

import { AvatarImage } from "./avatar";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

interface ThemeAvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarImage> {
  avatarUrl?: string | null;
}

/**
 * AvatarImage component that automatically uses theme-appropriate default avatar
 */
export function ThemeAvatarImage({ avatarUrl, ...props }: ThemeAvatarImageProps) {
  // If avatarUrl is empty/null or is one of our default avatar paths, 
  // treat it as null so useAvatarUrl can provide the theme-aware default
  let finalUrl = avatarUrl;
  if (!avatarUrl || avatarUrl.trim() === "" || 
      avatarUrl === "/noAvatar.jpg" || 
      avatarUrl === "/noAvatar.png" || 
      avatarUrl === "/noAvatarDark.png") {
    finalUrl = null;
  }
  
  const themeAwareUrl = useAvatarUrl(finalUrl);
  return <AvatarImage {...props} src={themeAwareUrl} />;
}

