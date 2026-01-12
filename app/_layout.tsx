import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/auth.store';
import { colors } from '../src/utils/theme';

export default function RootLayout() {
  const { loadUser, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // Logged in but on auth screen, redirect to tabs
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      // Not logged in and not on auth screen, redirect to auth
      router.replace('/(auth)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

  if (isLoading) {
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
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="portal/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="connection/[id]"
          options={{
            presentation: 'card',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
