import { useEffect, useRef, useState } from "react";

import ChatMessage from "./Message";

export default function ChatThinking({ speed = 250 }: { speed?: number }) {
  const [state, setState] = useState(0);

  const t = useRef<number | null>(null);
  useEffect(() => {
    t.current = setInterval(() => setState((state + 1) % 4), speed);

    return () => {
      if (t.current) clearInterval(t.current);
    };
  }, [state, speed]);

  return (
    <ChatMessage icon="assistant">
      <ChatMessage.Content
        content={{
          type: "text",
          text:
            "Thinking" +
            (state === 0 ? "." : state === 1 ? ".." : state === 2 ? "..." : ""),
        }}
      />
    </ChatMessage>
  );
}
