import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { palette } from '@theme/colors';
import {
  IconBolt,
  IconGrid,
  IconTrend,
  IconBox,
  IconSettings,
  type IconProps,
} from '@components/ui';

const TabIcon = ({
  Icon,
  color,
  focused,
}: {
  Icon: (p: IconProps) => React.ReactElement;
  color: string;
  focused: boolean;
}) => (
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
    <Icon color={focused ? palette.dark.primary : color} size={21} strokeWidth={focused ? 2.1 : 1.8} />
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
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={IconBolt} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={IconGrid} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={IconTrend} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Operación',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={IconBox} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={IconSettings} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
