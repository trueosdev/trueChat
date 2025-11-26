import { cookies } from "next/headers";
import { ChatLayout } from "@/components/chat/chat-layout";
import { LoopingGif } from "@/components/looping-gif";

export default function Home() {
  const layout = cookies().get("react-resizable-panels:layout");
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;

  return (
    <>
      <div className="z-10 border rounded-lg max-w-5xl w-full h-3/4 text-sm flex">
        <ChatLayout defaultLayout={defaultLayout} navCollapsedSize={8} />
      </div>
      <div className="flex items-center gap-2 text-sm text-black dark:text-white max-w-5xl w-full justify-end">
        <span>made with love - trueOS.dev</span>
        <LoopingGif 
          src="/kitty.gif" 
          alt="kitty" 
          width={32} 
          height={32}
          className="inline-block"
        />
      </div>
    </>
  );
}