import { forwardRef } from "react";
import { ScrollView, ViewProps } from "react-native";

export default forwardRef<ScrollView, ViewProps>(
  function ChatMessages(props, ref) {
    return (
      <ScrollView
        ref={ref}
        {...props}
        style={[
          {
            flex: 1,
            paddingVertical: 16,
          },
          props.style,
        ]}
      >
        {props.children}
      </ScrollView>
    );
  },
);
