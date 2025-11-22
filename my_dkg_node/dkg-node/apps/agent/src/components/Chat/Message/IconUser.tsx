import Svg, { SvgProps, Rect, Path } from "react-native-svg";

import useColors from "@/hooks/useColors";

export default function ChatMessageIconUser(props: SvgProps) {
  const colors = useColors();

  return (
    <Svg width={32} height={32} fill="none" {...props}>
      <Rect width={32} height={32} fill={colors.primary} rx={16} />
      <Path
        fill={colors.primaryText}
        d="M12.316 11.817c0 2.01 1.653 3.647 3.683 3.647s3.683-1.637 3.683-3.647-1.653-3.647-3.683-3.647-3.683 1.637-3.683 3.647ZM23.148 21.656c0-3.04-2.498-5.511-5.565-5.511h-3.167c-3.067 0-5.565 2.471-5.565 5.51 0 1.22 1 2.212 2.233 2.212h9.83c1.233 0 2.234-.991 2.234-2.211Z"
      />
    </Svg>
  );
}
