import LayoutPill from "./LayoutPill";
import PoweredBy from "./Footer/PoweredBy";
import FooterLinks from "./Footer/FooterLinks";

export default function Footer({
  mode = "default",
}: {
  mode?: "default" | "login";
}) {
  return (
    <LayoutPill style={mode === "login" && { backgroundColor: "transparent" }}>
      <PoweredBy
        style={[
          { flex: 1 },
          mode === "default" && { marginLeft: 32 },
          mode === "login" && { justifyContent: "center" },
        ]}
      />
      {mode === "default" && (
        <FooterLinks style={{ flex: 1, marginRight: 32 }} />
      )}
    </LayoutPill>
  );
}
