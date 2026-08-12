import { useTheme } from "@/hooks/useTheme";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function MainLayout() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      iconColor={{
        default: colors.textSecondary,
        selected: colors.primary,
      }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home" }}
        />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Icon
          sf={{ default: "flame", selected: "flame.fill" }}
          md={{ default: "local_fire_department", selected: "local_fire_department" }}
        />
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="journal">
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
          md={{ default: "book", selected: "book" }}
        />
        <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md={{ default: "settings", selected: "settings" }}
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
