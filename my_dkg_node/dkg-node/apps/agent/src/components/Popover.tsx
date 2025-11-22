import { useState, cloneElement } from "react";
import { Modal, Pressable } from "react-native";

import type { PopoverProps } from "./Popover.web";

export default function Popover({ from, children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {typeof from === "function"
        ? from(isOpen, setIsOpen)
        : cloneElement(from, { onPress: () => setIsOpen(true) })}
      <Modal
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        transparent
      >
        <Pressable
          onPress={() => setIsOpen(false)}
          style={{
            padding: 16,
            backgroundColor: "#0c0c0c80",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          {children}
        </Pressable>
      </Modal>
    </>
  );
}
