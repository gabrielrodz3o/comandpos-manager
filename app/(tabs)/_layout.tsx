import { Tabs } from 'expo-router';
import { Text, ColorValue, View } from 'react-native';
import { palette } from '@theme/colors';

const TabIcon = ({ emoji, color, focused }: { emoji: string; color: ColorValue; focused: boolean }) => (
  <View
    style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? palette.dark.primaryDim : 'transparent',
    }}
  >
    <Text style={{ fontSize: 19, color }}>{emoji}</Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.dark.text,
        tabBarInactiveTintColor: palette.dark.textMuted,
        tabBarStyle: {
          backgroundColor: palette.dark.surface,
          borderTopColor: palette.dark.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 6,
          paddingBottom: 24,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="⚡" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="📊" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="📈" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Operación',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="📦" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="⚙️" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
