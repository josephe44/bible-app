import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const router = useRouter();
  const { state } = useApp();
  const { background, primary } = useTheme();

  useEffect(() => {
    if (state.isLoading) return;

    if (state.plan) {
      // User has an active plan
      router.replace('/(main)/home');
    } else {
      // No active plan, go to onboarding
      router.replace('/(onboarding)/welcome');
    }
  }, [state.isLoading, state.plan, router]);

  return (
    <View style={{ flex: 1, backgroundColor: background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={primary} />
    </View>
  );
}
