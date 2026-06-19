import { Tabs } from 'expo-router';
import { Text, ColorValue, View, Image } from 'react-native';
import { palette } from '@theme/colors';

const ComandiTabIcon = ({ focused }: { focused: boolean }) => (
  <View
    style={{
      width: 40,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? palette.dark.primaryDim : 'transparent',
    }}
  >
    <Image source={require('../../assets/comandi.png')} style={{ width: 26, height: 26, borderRadius: 7 }} resizeMode="contain" />
  </View>
);

const TabIcon = ({ emoji, color, focused }: { emoji: string; color: ColorValue; focused: boolean }) => (
  <View
    style={{
      width: 40,
      height: 34,
      borderRadius: 11,
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
        tabBarActiveTintColor: palette.dark.primary,
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
        name="comandi"
        options={{
          title: 'Comandi',
          tabBarIcon: ({ focused }) => <ComandiTabIcon focused={focused} />,
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
