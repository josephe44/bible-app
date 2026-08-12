import { CustomSplashScreen } from "@/components/ui/CustomSplashScreen";
import { AppProvider } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
        <Stack.Screen name="(main)" options={{ animation: "fade" }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [isSplashAnimationComplete, setIsSplashAnimationComplete] =
    useState(false);

  useEffect(() => {
    if (loaded || error) {
      // Hide the native splash screen as quickly as possible
      // so our custom one can take over.
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppProvider>
      <View style={{ flex: 1 }}>
        <RootLayoutNav />
        {!isSplashAnimationComplete && (
          <CustomSplashScreen
            onAnimationComplete={() => setIsSplashAnimationComplete(true)}
          />
        )}
      </View>
    </AppProvider>
  );
}
