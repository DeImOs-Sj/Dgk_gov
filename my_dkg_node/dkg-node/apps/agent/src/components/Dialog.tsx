import {
  createContext,
  useState,
  PropsWithChildren,
  useCallback,
  useContext,
} from "react";
import { View, Text, Modal } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";
import Background from "@/components/layout/Background";

import Button from "./Button";

type DialogInfo = {
  type: "error" | "success";
  title: string;
  message: string;
  button?: {
    text: string;
    onPress: () => void;
    hideCloseButton?: boolean;
  };
};

const DialogContext = createContext<{
  dialog: DialogInfo | null;
  showDialog: (info: DialogInfo) => void;
  hideDialog: () => void;
}>({
  dialog: null,
  showDialog: () => {},
  hideDialog: () => {},
});

export const useDialog = () => {
  const { showDialog } = useContext(DialogContext);
  return { showDialog };
};

function DialogProvider(props: PropsWithChildren) {
  const [dialogInfo, setDialogInfo] = useState<DialogInfo | null>(null);

  const showDialog = useCallback((info: DialogInfo) => {
    setDialogInfo(info);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogInfo(null);
  }, []);

  return (
    <DialogContext.Provider
      value={{ dialog: dialogInfo, showDialog, hideDialog }}
    >
      {props.children}
    </DialogContext.Provider>
  );
}

export default function Dialog() {
  const { dialog, hideDialog } = useContext(DialogContext);
  const colors = useColors();

  return (
    <Modal
      animationType="fade"
      visible={!!dialog}
      onRequestClose={hideDialog}
      transparent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#00000080",
          padding: 20,
        }}
      >
        <View
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 480,
            borderRadius: 16,
            overflow: "hidden",
            //
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Background gradientWidth="100%" gradientHeight="150%">
            <View
              style={{
                padding: 24,
                flexDirection: "row",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 40,
                  backgroundColor: colors.primary,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={dialog?.type === "error" ? "warning" : "checkmark"}
                  size={24}
                  color={colors.primaryText}
                />
              </View>
              <View style={{ gap: 16, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 32,
                    lineHeight: 32,
                    fontFamily: "SpaceGrotesk_500Medium",
                    color: colors.text,
                  }}
                >
                  {dialog?.title}
                </Text>
                {dialog?.message && (
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 24,
                      fontFamily: "Manrope_400Regular",
                      color: colors.text,
                    }}
                  >
                    {dialog?.message}
                  </Text>
                )}
                {dialog?.button && (
                  <Button
                    color="primary"
                    text={dialog.button.text}
                    onPress={() => {
                      dialog.button!.onPress();
                      hideDialog();
                    }}
                  />
                )}
              </View>
            </View>
            {!dialog?.button?.hideCloseButton && (
              <Ionicons
                name="close"
                size={24}
                color={colors.secondary}
                onPress={hideDialog}
                style={{ position: "absolute", top: 10, right: 10 }}
              />
            )}
          </Background>
        </View>
      </View>
    </Modal>
  );
}

Dialog.Provider = DialogProvider;
