import React from "react";
export type ChatPosition = "bottom-right" | "bottom-left";
export type ChatSize = "sm" | "md" | "lg" | "xl" | "full";
interface ExpandableChatProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: ChatPosition;
    size?: ChatSize;
    icon?: React.ReactNode;
}
declare const ExpandableChat: React.FC<ExpandableChatProps>;
declare const ExpandableChatHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const ExpandableChatBody: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const ExpandableChatFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter, };
//# sourceMappingURL=expandable-chat.d.ts.map