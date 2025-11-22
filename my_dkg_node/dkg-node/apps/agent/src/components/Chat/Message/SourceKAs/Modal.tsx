import { Modal, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { SourceKA } from "@dkg/plugin-dkg-essentials/utils";

import useColors from "@/hooks/useColors";
import Background from "@/components/layout/Background";

import ChatMessageSourceKAsCollapsible from "./Collapsible";
import type { SourceKAResolver } from "./CollapsibleItem";

export default function ChatMessageSourceKAsModal(props: {
  kas: SourceKA[];
  resolver: SourceKAResolver;
  visible?: boolean;
  onClose?: () => void;
}) {
  const colors = useColors();

  const modalWidth = useSharedValue(800);
  const modalHeight = useSharedValue(500);

  function handleExpand(isExpanded: boolean) {
    if (isExpanded) {
      modalWidth.value = withTiming(1200);
      modalHeight.value = withTiming(600);
    } else {
      modalWidth.value = withTiming(800);
      modalHeight.value = withTiming(500);
    }
  }

  const sizeStyle = useAnimatedStyle(() => ({
    maxHeight: modalHeight.value,
    maxWidth: modalWidth.value,
  }));

  return (
    <Modal
      animationType="fade"
      visible={props.visible}
      onRequestClose={props.onClose}
      transparent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#00000040",
          padding: 20,
        }}
      >
        <Animated.View
          style={[
            {
              width: "100%",
              height: "100%",
              borderRadius: 8,
              overflow: "hidden",
            },
            sizeStyle,
          ]}
        >
          <Background>
            <View
              style={{
                flex: 1,
                paddingTop: 32,
                paddingBottom: 24,
                position: "relative",
              }}
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.secondary}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                }}
                onPress={props.onClose}
              />
              <ChatMessageSourceKAsCollapsible
                style={{ gap: 24, paddingHorizontal: 24 }}
                onExpandChange={handleExpand}
              >
                {props.kas.map((ka, index) => (
                  <ChatMessageSourceKAsCollapsible.Item
                    key={index}
                    {...ka}
                    resolver={props.resolver}
                  />
                ))}
              </ChatMessageSourceKAsCollapsible>
            </View>
          </Background>
        </Animated.View>
      </View>
    </Modal>
  );
}
