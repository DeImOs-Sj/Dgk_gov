import {
  createContext,
  useState,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { View, Text, ViewProps } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Background from "@/components/layout/Background";

type AlertInfo = {
  id: string;
  type: "error";
  title: string;
  message: string;
  timeout?: number;
};

const AlertsContext = createContext<{
  alerts: AlertInfo[];
  showAlert: (opts: Omit<AlertInfo, "id">) => void;
  hideAlert: (id: string) => void;
  clearAlerts: () => void;
}>({
  alerts: [],
  showAlert: () => {},
  hideAlert: () => {},
  clearAlerts: () => {},
});

export const useAlerts = () => {
  const { showAlert, clearAlerts } = useContext(AlertsContext);
  return { showAlert, clearAlerts };
};

function AlertsProvider(props: PropsWithChildren) {
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);

  const showAlert = useCallback((opts: Omit<AlertInfo, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((alerts) => [...alerts, { id, ...opts }]);
  }, []);

  const hideAlert = useCallback(
    (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id)),
    [],
  );

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return (
    <AlertsContext.Provider
      value={{ alerts, showAlert, hideAlert, clearAlerts }}
    >
      {props.children}
    </AlertsContext.Provider>
  );
}

const animationSpeed = 500;
const visibleCount = 3;

function Alert({
  id,
  title,
  message,
  order: orderProp,
  timeout,
  onClose,
}: AlertInfo & { order: number; onClose: () => void }) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const order = useSharedValue(orderProp);

  useEffect(() => {
    order.value = withTiming(orderProp, { duration: animationSpeed });
  }, [orderProp, order]);

  const isFirst = orderProp === 0;
  const timeoutProgress = useSharedValue(0);
  useEffect(() => {
    let t: number | undefined;
    if (isFirst && timeout) {
      t = setTimeout(onClose, timeout);
      timeoutProgress.value = withTiming(1, { duration: timeout });
    }
    return () => {
      clearTimeout(t);
      timeoutProgress.value = 0;
    };
  }, [isFirst, timeout, onClose, timeoutProgress]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateY: order.value * 16 },
        { scale: 1 - order.value / 15 },
      ],
    }),
    [order],
  );

  const progressStyle = useAnimatedStyle(
    () => ({
      width: `${(1 - timeoutProgress.value) * 100}%`,
    }),
    [timeoutProgress],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(animationSpeed)}
      exiting={FadeOut.duration(animationSpeed)}
      style={[
        {
          maxWidth: 380,
          borderRadius: 16,
          overflow: "hidden",
          position: "absolute",
          zIndex: visibleCount - orderProp,
        },
        colorScheme === "light" && {
          borderColor: colors.text + "40",
          borderWidth: 1,
        },
        animatedStyle,
      ]}
    >
      <Background gradientWidth="125%" gradientHeight="200%">
        <View
          style={{
            flex: 1,
            padding: 16,
            gap: 16,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              borderRadius: 40,
              width: 40,
              height: 40,
              backgroundColor: colors.primary,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="warning" size={24} color={colors.primaryText} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              style={{
                fontSize: 14.5,
                lineHeight: 20,
                fontFamily: "Manrope_600SemiBold",
                color: colors.text,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 18,
                fontFamily: "Manrope_400Regular",
                color: colors.placeholder,
                flexWrap: "wrap",
              }}
            >
              {message}
            </Text>
          </View>
          <View style={{ pointerEvents: "auto" }}>
            <Ionicons
              name="close"
              size={16}
              color={colors.secondary}
              onPress={() => onClose()}
            />
          </View>
        </View>
        {isFirst && timeout && (
          <View style={{ width: "100%", paddingHorizontal: 16 }}>
            <Animated.View
              style={[
                {
                  height: 2,
                  backgroundColor: colors.primary,
                },
                progressStyle,
              ]}
            />
          </View>
        )}
      </Background>
    </Animated.View>
  );
}

export default function Alerts(props: Omit<ViewProps, "children">) {
  const { alerts, hideAlert } = useContext(AlertsContext);

  return (
    <View {...props} style={[{ position: "relative" }, props.style]}>
      {alerts.slice(0, visibleCount).map((alert, index) => (
        <Alert
          key={alert.id}
          {...alert}
          order={index}
          onClose={() => hideAlert(alert.id)}
        />
      ))}
    </View>
  );
}

Alerts.Provider = AlertsProvider;
