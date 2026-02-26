import { useEffect } from "react";
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { useAuthStore } from "../src/store/auth.store";
import { colors } from "../src/utils/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    CormorantGaramond_500Medium,
    CormorantGaramond_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Apply Inter as global default for ALL Text and TextInput components
      // This means every <Text> in the app uses Inter automatically
      if (Text.defaultProps == null) (Text as any).defaultProps = {};
      (Text as any).defaultProps.style = { fontFamily: "Inter_400Regular" };
      if (TextInput.defaultProps == null) (TextInput as any).defaultProps = {};
      (TextInput as any).defaultProps.style = {
        fontFamily: "Inter_400Regular",
      };
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      // Logged in but on auth screen, redirect to tabs
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !inAuthGroup) {
      // Not logged in and not on auth screen, redirect to auth
      router.replace("/(auth)");
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="portal/[id]"
          options={{
            presentation: "card",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="connection/[id]"
          options={{
            presentation: "card",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
