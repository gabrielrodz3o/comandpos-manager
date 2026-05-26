import { Stack } from 'expo-router';
import { palette } from '@theme/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark.bg },
      }}
    />
  );
}
