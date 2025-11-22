import { useState } from "react";
import { View, ViewProps } from "react-native";
import type { SourceKA } from "@dkg/plugin-dkg-essentials/utils";

import ChatMessageSourceKAsCollapsible from "./SourceKAs/Collapsible";
import ChatMessageSourceKAsChip from "./SourceKAs/Chip";
import ChatMessageSourceKAsModal from "./SourceKAs/Modal";
import ChatMessageSourceKAsMoreChip from "./SourceKAs/MoreChip";
import ChatMessageSourceKAsProfileCard from "./SourceKAs/ProfileCard";
import type { SourceKAResolver } from "./SourceKAs/CollapsibleItem";

const minChipWidth = 225;
const chipGap = 8;
const minLastChipWidth = 80;

// type SourceKAsChipComponent = React.ReactElement<
//   ComponentProps<typeof SourceKAsChip>
// >;

export default function ChatMessageSourceKAs({
  kas,
  resolver,
  style,
  ...props
}: Omit<ViewProps, "children"> & {
  kas: SourceKA[];
  resolver: SourceKAResolver;

  //children?: SourceKAsChipComponent[] | SourceKAsChipComponent;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewWidth, setViewWidth] = useState(0);

  // const childrenArray = !children
  //   ? []
  //   : Array.isArray(children)
  //     ? children
  //     : [children];

  const numberOfVisibleChips =
    (minChipWidth + chipGap) * kas.length - chipGap <= viewWidth
      ? kas.length
      : Math.floor((viewWidth - minLastChipWidth) / (minChipWidth + chipGap));

  const numberOfHiddenChips = kas.length - numberOfVisibleChips;

  if (!kas.length) return null;

  return (
    <View
      {...props}
      style={[{ width: "100%", height: 64, flexDirection: "row" }, style]}
      onLayout={(e) => {
        setViewWidth(e.nativeEvent.layout.width);
      }}
    >
      {kas.map(
        (ka, i) =>
          i < numberOfVisibleChips && (
            <ChatMessageSourceKAsChip
              key={i}
              title={ka.title}
              issuer={ka.issuer}
              onPress={() => setModalVisible(true)}
              style={{ minWidth: minChipWidth, flex: 1, marginRight: chipGap }}
            />
          ),
      )}
      {numberOfHiddenChips > 0 && (
        <ChatMessageSourceKAsMoreChip
          moreNumber={numberOfHiddenChips}
          zeroVisible={numberOfVisibleChips === 0}
          style={{ minWidth: minLastChipWidth }}
          onPress={() => setModalVisible(true)}
        />
      )}

      <ChatMessageSourceKAsModal
        kas={kas}
        resolver={resolver}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

ChatMessageSourceKAs.Chip = ChatMessageSourceKAsChip;
ChatMessageSourceKAs.MoreChip = ChatMessageSourceKAsMoreChip;
ChatMessageSourceKAs.Modal = ChatMessageSourceKAsModal;
ChatMessageSourceKAs.Collapsible = ChatMessageSourceKAsCollapsible;
ChatMessageSourceKAs.ProfileCard = ChatMessageSourceKAsProfileCard;
