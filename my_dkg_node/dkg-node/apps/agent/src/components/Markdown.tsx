import { PropsWithChildren, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import RNMarkdownDisplay, {
  MarkdownProps,
  RenderRules,
} from "react-native-markdown-display";
// import * as Linking from "expo-linking";
import { Image } from "expo-image";

import useColors from "@/hooks/useColors";
import ExternalLink from "./ExternalLink";

const renderRules: RenderRules = {
  link: (node, children, parent, styles) => {
    return (
      <ExternalLink
        key={node.key}
        href={node.attributes.href}
        style={styles.link}
      >
        {children}
      </ExternalLink>
    );
  },
  image: (
    node,
    children,
    parent,
    styles,
    allowedImageHandlers,
    defaultImageHandler,
  ) => {
    const src = node.attributes.src;
    const show =
      allowedImageHandlers.filter((value) => {
        return src.toLowerCase().startsWith(value.toLowerCase());
      }).length > 0;

    if (show === false && defaultImageHandler === null) {
      return null;
    }

    return (
      <Image
        key={node.key}
        accessible
        accessibilityLabel={node.attributes.alt}
        style={styles.image}
        source={{ uri: show === true ? src : `${defaultImageHandler}${src}` }}
        alt={node.attributes.alt}
      />
    );
  },
};

export default function Markdown({
  style,
  testID,
  ...props
}: PropsWithChildren<MarkdownProps & { testID?: string }>) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        heading1: {
          color: colors.text,
          fontSize: 32,
          fontFamily: "SpaceGrotesk_700Bold",
          marginBottom: 8,
        },
        heading2: {
          color: colors.text,
          fontSize: 24,
          fontFamily: "SpaceGrotesk_500Medium",
          marginBottom: 8,
        },
        heading3: {
          color: colors.text,
          fontSize: 20,
          fontFamily: "SpaceGrotesk_500Medium",
          marginBottom: 8,
        },
        heading4: {
          color: colors.text,
          fontSize: 18,
          fontFamily: "Manrope_500Medium",
        },
        heading5: {
          color: colors.text,
          fontSize: 16,
          fontFamily: "Manrope_500Medium",
        },
        heading6: {
          color: colors.text,
          fontSize: 16,
          fontFamily: "Manrope_400Regular",
        },
        text: {},
        paragraph: {
          color: colors.text,
          fontSize: 16,
          fontFamily: "Manrope_400Regular",
          lineHeight: 24,
          marginBottom: 16,
          marginTop: 0,
        },
        strong: {
          fontFamily: "Manrope_600SemiBold",
          color: colors.text,
        },
        em: {
          fontFamily: "Manrope_400Regular",
          fontStyle: "italic",
          color: colors.text,
        },
        link: {
          color: colors.primary,
          // textDecorationLine: "underline",
        },
        blockquote: {
          backgroundColor: colors.card,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
          paddingLeft: 16,
          paddingVertical: 8,
          marginVertical: 16,
          fontFamily: "Manrope_400Regular",
          fontStyle: "italic",
        },
        code_inline: {
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 14,
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 4,
        },
        code_block: {
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 14,
          padding: 16,
          borderRadius: 8,
          marginVertical: 16,
        },
        fence: {
          backgroundColor: colors.card,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 14,
          padding: 16,
          borderRadius: 8,
          marginVertical: 16,
        },
        list_item: {
          color: colors.text,
          fontSize: 16,
          fontFamily: "Manrope_400Regular",
          lineHeight: 24,
          marginBottom: 8,
        },
        bullet_list: {
          marginVertical: 12,
        },
        ordered_list: {
          marginVertical: 12,
        },
        hr: {
          backgroundColor: colors.text,
          height: 1,
          marginVertical: 24,
        },
        table: {
          borderWidth: 1,
          borderColor: colors.secondary,
          marginVertical: 16,
        },
        thead: {
          backgroundColor: colors.card,
        },
        th: {
          color: colors.text,
          fontSize: 16,
          fontFamily: "Manrope_600SemiBold",
          padding: 12,
          borderWidth: 1,
          borderColor: colors.secondary,
        },
        td: {
          color: colors.text,
          fontSize: 16,
          fontFamily: "Manrope_400Regular",
          padding: 12,
          borderWidth: 1,
          borderColor: colors.secondary,
        },
        tr: {
          borderBottomWidth: 1,
          borderBottomColor: colors.secondary,
        },
        ...style,
      }),
    [style, colors],
  );

  if (testID) {
    return (
      <View testID={testID}>
        <RNMarkdownDisplay {...props} rules={renderRules} style={styles} />
      </View>
    );
  }

  return <RNMarkdownDisplay {...props} rules={renderRules} style={styles} />;
}
