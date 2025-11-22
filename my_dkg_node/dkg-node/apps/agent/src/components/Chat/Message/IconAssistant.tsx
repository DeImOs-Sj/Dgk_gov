import Svg, {
  SvgProps,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

import useColors from "@/hooks/useColors";

export default function ChatMessageIconAssistant(props: SvgProps) {
  const colors = useColors();

  return (
    <Svg width={32} height={32} fill="none" {...props}>
      <Path
        fill="url(#a)"
        fillRule="evenodd"
        d="M16 7.958a8.042 8.042 0 1 0 6.152 13.22l6.088 5.125A15.965 15.965 0 0 1 16 32C7.163 32 0 24.836 0 16 0 7.163 7.163 0 16 0v7.958Zm13.825 16.099-6.877-4.008c.235-.401.436-.825.6-1.267l7.469 2.753c-.325.88-.725 1.723-1.192 2.522ZM24.041 16H32c0-.948-.083-1.876-.241-2.779l-7.839 1.382c.08.454.121.92.121 1.397ZM28.3 5.766l-6.117 5.09a8.09 8.09 0 0 0-.987-.995l5.14-6.074c.71.602 1.368 1.264 1.964 1.98Z"
        clipRule="evenodd"
      />
      <Defs>
        <LinearGradient
          id="a"
          x1={7.037}
          x2={23.47}
          y1={-0.14}
          y2={33.473}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={colors.primary} />
          <Stop offset={1} stopColor={colors.secondary} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
