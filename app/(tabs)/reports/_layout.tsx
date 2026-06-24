import { Stack } from 'expo-router';
import { palette } from '@theme/colors';

// Ancla del tab Reportes: garantiza que `index` (el listado de reportes) quede
// SIEMPRE en la base del stack, incluso cuando se navega directo a una caja
// desde otro tab (Hoy/Dashboard) o desde una notificación. Sin esto, un push
// cross-tab a reports/boxes/[id] dejaba el stack con solo el detalle → "atrás"
// salía del tab y caía en Hoy, y no se podía ver el listado de reportes.
export const unstable_settings = { initialRouteName: 'index' };

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark.bg },
      }}
    />
  );
}
