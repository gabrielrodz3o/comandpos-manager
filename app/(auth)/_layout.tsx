import { Stack } from 'expo-router';
import { palette } from '@theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark.bg },
        animation: 'fade',
      }}
    />
  );
}
