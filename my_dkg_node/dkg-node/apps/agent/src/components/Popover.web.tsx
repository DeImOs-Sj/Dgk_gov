import { useState, cloneElement, PropsWithChildren, ReactElement } from "react";
import { Popover as ReactTinyPopover } from "react-tiny-popover";

export type PopoverProps = PropsWithChildren<{
  from:
    | ReactElement<{ onPress?: () => void } & any>
    | ((
        isOpen: boolean,
        setIsOpen: (isOpen: boolean | ((isOpen: boolean) => boolean)) => void,
      ) => ReactElement);
}>;

export default function Popover({ from, children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ReactTinyPopover
      positions={["bottom", "top"]}
      align="end"
      isOpen={isOpen}
      onClickOutside={() => setIsOpen(false)}
      padding={10}
      content={children}
      reposition
    >
      {typeof from === "function"
        ? from(isOpen, setIsOpen)
        : cloneElement(from, { onPress: () => setIsOpen((o) => !o) })}
    </ReactTinyPopover>
  );
}
