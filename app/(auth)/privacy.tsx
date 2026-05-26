import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette } from '@theme/colors';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={{ marginBottom: 20 }}>
    <Text
      style={{
        color: palette.dark.text,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 6,
      }}
    >
      {title}
    </Text>
    <Text style={{ color: palette.dark.textDim, fontSize: 13, lineHeight: 20 }}>{children}</Text>
  </View>
);

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: palette.dark.soft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '600' }}>‹</Text>
        </Pressable>
        <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 }}>
          Privacidad
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 16 }}>
          Última actualización: {new Date().toLocaleDateString('es-DO')}
        </Text>

        <Section title="1. Información que recopilamos">
          Recopilamos información de autenticación (email, nombre, foto) cuando inicias sesión, y
          datos operativos de tu negocio (ventas, empleados, inventario, finanzas) necesarios para
          mostrar los reportes solicitados.
        </Section>

        <Section title="2. Cómo usamos tu información">
          Usamos tu información exclusivamente para: (1) autenticar tu acceso, (2) mostrar los
          datos de tu negocio en la aplicación móvil, (3) enviar notificaciones push relevantes
          que tú hayas habilitado, y (4) mejorar la experiencia de la aplicación.
        </Section>

        <Section title="3. Almacenamiento local">
          La aplicación almacena en tu dispositivo: tu token de autenticación, preferencias de la
          aplicación, y una caché temporal de los últimos reportes consultados (válida por 24
          horas). Estos datos se eliminan al cerrar sesión.
        </Section>

        <Section title="4. Compartir con terceros">
          No vendemos ni compartimos tu información personal con terceros. Los datos transitan
          entre tu dispositivo y el servidor de tu empresa de forma cifrada (HTTPS/TLS).
        </Section>

        <Section title="5. Análisis de errores">
          Si está habilitado, usamos Sentry para registrar errores técnicos de forma anónima. No
          se registran datos financieros ni personales identificables.
        </Section>

        <Section title="6. Notificaciones push">
          Si habilitas notificaciones, tu dispositivo recibe un token único de Expo. Este token se
          guarda en el servidor de tu empresa exclusivamente para enviarte alertas operativas.
        </Section>

        <Section title="7. Tus derechos">
          Puedes desactivar notificaciones, cerrar sesión (lo cual elimina todos los datos locales)
          o solicitar la eliminación de tu cuenta contactando al administrador de tu empresa.
        </Section>

        <Section title="8. Contacto">
          Para preguntas sobre privacidad: soporte@comandpos.com
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
