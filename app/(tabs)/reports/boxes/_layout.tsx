import { Stack } from 'expo-router';
import { palette } from '@theme/colors';

// Ancla: `index` (listado de cajas) queda SIEMPRE bajo el detalle [id], así
// "atrás" desde un cierre de caja vuelve al listado, nunca fuera del tab.
export const unstable_settings = { initialRouteName: 'index' };

export default function BoxesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark.bg },
      }}
    />
  );
}
