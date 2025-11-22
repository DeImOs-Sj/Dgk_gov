import Svg, { SvgProps, Rect, Path } from "react-native-svg";

export default function StartAgainIcon(props: SvgProps) {
  return (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Rect width={23} height={23} x={0.5} y={0.5} rx={11} />
      <Path
        strokeLinecap="square"
        d="M7 8v3m0 0h3m-3 0 2.32-2.18a4.5 4.5 0 1 1-1.065 4.68"
      />
    </Svg>
  );
}
