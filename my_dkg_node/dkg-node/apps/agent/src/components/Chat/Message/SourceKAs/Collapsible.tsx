import { ComponentProps, useState } from "react";
import { ScrollView, ViewProps } from "react-native";

import ChatMessageSourceKAsCollapsibleItem from "./CollapsibleItem";

type SourceKAsCollapsibleItemComponent = React.ReactElement<
  ComponentProps<typeof ChatMessageSourceKAsCollapsibleItem>
>;

export default function ChatMessageSourceKAsCollapsible({
  children,
  style,
  onExpandChange,
  ...props
}: Omit<ViewProps, "children"> & {
  children:
    | SourceKAsCollapsibleItemComponent[]
    | SourceKAsCollapsibleItemComponent;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const [visibleIndex, setVisibleIndex] = useState(-1);

  const arrayChildren = Array.isArray(children) ? children : [children];

  return (
    <ScrollView {...props} style={{ flex: 1 }} contentContainerStyle={style}>
      {arrayChildren.map((child, i) => (
        <ChatMessageSourceKAsCollapsibleItem
          key={child.key ?? i}
          {...child.props}
          collapsed={visibleIndex !== i}
          onPress={() =>
            setVisibleIndex((lastIndex) => {
              const newIndex = lastIndex === i ? -1 : i;
              if ((newIndex === -1) !== (lastIndex === -1))
                onExpandChange?.(newIndex !== -1);

              return newIndex;
            })
          }
        />
      ))}
    </ScrollView>
  );
}

ChatMessageSourceKAsCollapsible.Item = ChatMessageSourceKAsCollapsibleItem;
