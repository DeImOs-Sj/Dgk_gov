import Svg, { SvgProps, Path } from "react-native-svg";

export default function AttachFileIcon(props: SvgProps) {
  return (
    <Svg fill="none" viewBox="0 0 18 20" {...props}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m17.099 9.054-7.658 7.658a5.003 5.003 0 0 1-7.075-7.075l7.658-7.658a3.335 3.335 0 0 1 4.717 4.716l-7.667 7.659a1.668 1.668 0 0 1-2.358-2.359L11.79 4.93"
      />
    </Svg>
  );
}
