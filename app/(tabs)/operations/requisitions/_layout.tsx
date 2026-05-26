import { Stack } from 'expo-router';
import { palette } from '@theme/colors';

export default function RequisitionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark.bg },
      }}
    />
  );
}
