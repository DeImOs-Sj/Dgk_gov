import { ScrollView, Text, View } from "react-native";
import { SourceKA } from "@dkg/plugin-dkg-essentials/utils";

import useColors from "@/hooks/useColors";
import KAIcon from "@/components/icons/KAIcon";
import ExternalLink from "@/components/ExternalLink";

import type { SourceKAResolved } from "./CollapsibleItem";

export default function ChatMessageSourceKAsProfileCard({
  ual,
  lastUpdated,
  txHash,
  assertion,
  publisher,
}: SourceKA & SourceKAResolved) {
  const colors = useColors();

  let blockchain = "";
  let txLink = "";
  let explorerLink = "";

  switch (ual.split(":").at(3)?.split("/").at(0)) {
    case "2043":
      blockchain = "NeuroWeb";
      txLink = `neuroweb.subscan.io/tx/${txHash}`;
      explorerLink = `dkg.origintrail.io/explore?ual=${ual}`;
      break;
    case "20430":
      blockchain = "NeuroWeb";
      txLink = `neuroweb-testnet.subscan.io/tx/${txHash}`;
      explorerLink = `dkg-testnet.origintrail.io/explore?ual=${ual}`;
      break;
    case "8453":
      blockchain = "Base";
      txLink = `basescan.org/tx/${txHash}`;
      explorerLink = `dkg.origintrail.io/explore?ual=${ual}`;
      break;
    case "84532":
      blockchain = "Base";
      txLink = `sepolia.basescan.org/tx/${txHash}`;
      explorerLink = `dkg-testnet.origintrail.io/explore?ual=${ual}`;
      break;
    case "100":
      blockchain = "Gnosis";
      txLink = `gnosisscan.io/tx/${txHash}`;
      explorerLink = `dkg.origintrail.io/explore?ual=${ual}`;
      break;
    case "10200":
      blockchain = "Gnosis";
      txLink = `gnosis-chiado.blockscout.com/tx/${txHash}`;
      explorerLink = `dkg-testnet.origintrail.io/explore?ual=${ual}`;
      break;
    default:
      blockchain = "Unknown";
      break;
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        flex: 1,
        padding: 16,
        gap: 24,
        minWidth: 300,
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: "Manrope_800ExtraBold",
            fontSize: 16,
            lineHeight: 24,
            color: colors.text,
          }}
        >
          Knowledge Asset profile
        </Text>
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 10,
            lineHeight: 16,
            color: colors.text,
          }}
        >
          Latest update: {new Date(lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      <View
        style={{
          width: "100%",
          height: 0,
          borderBottomColor: colors.secondary,
          borderBottomWidth: 1,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          gap: 16,
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <View>
          <KAIcon
            width={64}
            height={64}
            fill={colors.secondary}
            stroke={colors.secondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text
              style={{
                color: colors.placeholder,
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                lineHeight: 24,
              }}
            >
              Publisher:
            </Text>
            <Text
              style={{
                color: colors.text,
                fontFamily: "Manrope_500Medium",
                fontSize: 14,
                lineHeight: 24,
                textOverflow: "ellipsis",
                overflow: "hidden",
                wordWrap: "normal",
              }}
            >
              {publisher}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text
              style={{
                color: colors.placeholder,
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                lineHeight: 24,
              }}
            >
              UAL:
            </Text>
            {explorerLink ? (
              <ExternalLink
                href={`https://${explorerLink}`}
                style={{
                  color: colors.secondary,
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  lineHeight: 24,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  wordWrap: "normal",
                  textDecorationLine: "underline",
                }}
              >
                {ual}
              </ExternalLink>
            ) : (
              <Text
                style={{
                  color: colors.secondary,
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  lineHeight: 24,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  wordWrap: "normal",
                }}
              >
                ual
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text
              style={{
                color: colors.placeholder,
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                lineHeight: 24,
              }}
            >
              Blockchain:
            </Text>
            <Text
              style={{
                color: colors.text,
                fontFamily: "Manrope_500Medium",
                fontSize: 14,
                lineHeight: 24,
              }}
            >
              {blockchain}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text
              style={{
                color: colors.placeholder,
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                lineHeight: 24,
              }}
            >
              Transaction:
            </Text>
            {txLink ? (
              <ExternalLink
                href={`https://${txLink}`}
                style={{
                  color: colors.secondary,
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  lineHeight: 24,
                  textDecorationLine: "underline",
                }}
              >
                {txHash}
              </ExternalLink>
            ) : (
              <Text
                style={{
                  color: colors.secondary,
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  lineHeight: 24,
                }}
              >
                txHash
              </Text>
            )}
          </View>
        </View>
      </View>

      <View
        style={{
          width: "100%",
          height: 0,
          borderBottomColor: colors.secondary,
          borderBottomWidth: 1,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <View>
          <Text
            style={{
              color: colors.placeholder,
              fontFamily: "Manrope_400Regular",
              fontSize: 12,
              lineHeight: 16,
            }}
          >
            JSON:
          </Text>
        </View>
        <ScrollView style={{ height: 200 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 12,
              lineHeight: 16,
              fontFamily: "monospace",
              fontWeight: 400,
              flexWrap: "wrap",
              wordWrap: "break-word",
            }}
          >
            {JSON.stringify(assertion, null, 2)}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
