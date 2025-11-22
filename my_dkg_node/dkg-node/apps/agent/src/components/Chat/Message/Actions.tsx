import { View, ViewProps } from "react-native";

import Button from "@/components/Button";
import CopyIcon from "@/components/icons/CopyIcon";
import StartAgainIcon from "@/components/icons/StartAgainIcon";

export default function ChatMessageActions(
  props: ViewProps & {
    onCopyAnswer: () => void;
    onStartAgain: () => void;
  },
) {
  return (
    <View
      {...props}
      style={[
        {
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        props.style,
      ]}
    >
      <Button
        color="secondary"
        flat
        icon={CopyIcon}
        iconMode="fill"
        text="Copy answer"
        onPress={props.onCopyAnswer}
      />
      <Button
        color="secondary"
        flat
        icon={StartAgainIcon}
        iconMode="stroke"
        text="Start again"
        onPress={props.onStartAgain}
        testID="start-again-button"
      />
    </View>
  );
}
