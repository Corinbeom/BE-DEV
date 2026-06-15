import type { ChatTurn } from "../api/types";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ChatTurn }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(720px,88%)] whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm leading-6",
          isUser
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground",
        )}
      >
        {message.content || (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </span>
        )}
      </div>
    </div>
  );
}
