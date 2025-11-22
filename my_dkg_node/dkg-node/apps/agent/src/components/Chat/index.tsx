import type { PropsWithChildren } from "react";

import ChatInput from "./Input";
import ChatMessages from "./Messages";
import ChatMessage from "./Message";
import ChatThinking from "./Thinking";

export default function Chat(props: PropsWithChildren) {
  return <>{props.children}</>;
}

Chat.Input = ChatInput;
Chat.Messages = ChatMessages;
Chat.Message = ChatMessage;
Chat.Thinking = ChatThinking;
