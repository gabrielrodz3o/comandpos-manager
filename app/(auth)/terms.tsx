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

export default function TermsScreen() {
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
          Términos de Servicio
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 16 }}>
          Última actualización: {new Date().toLocaleDateString('es-DO')}
        </Text>

        <Section title="1. Aceptación de los términos">
          Al usar ComandPOS Manager aceptas estos términos. Si no estás de acuerdo, no uses la
          aplicación.
        </Section>

        <Section title="2. Licencia de uso">
          ComandPOS Manager es una herramienta administrativa para clientes con suscripción
          activa al sistema ComandPOS. La licencia es personal e intransferible.
        </Section>

        <Section title="3. Acceso autorizado">
          Solo personas autorizadas por el administrador de tu empresa pueden acceder. Mantén tus
          credenciales seguras y reporta cualquier acceso no autorizado.
        </Section>

        <Section title="4. Uso aceptable">
          No intentes acceder a datos de otras empresas, hacer ingeniería inversa de la
          aplicación, o usar la información para fines ajenos a la operación de tu negocio.
        </Section>

        <Section title="5. Disponibilidad">
          Hacemos esfuerzos razonables para mantener la aplicación disponible, pero no
          garantizamos disponibilidad 100%. Las actualizaciones pueden requerir reinstalación.
        </Section>

        <Section title="6. Datos del negocio">
          Los datos mostrados pertenecen a tu empresa. ComandPOS solo provee la herramienta para
          visualizarlos. Tu empresa es responsable de la precisión y respaldo de los datos.
        </Section>

        <Section title="7. Limitación de responsabilidad">
          ComandPOS no es responsable de decisiones de negocio tomadas con base en los datos
          mostrados. Verifica siempre la información crítica antes de tomar acciones financieras
          importantes.
        </Section>

        <Section title="8. Cambios en los términos">
          Podemos actualizar estos términos. Los cambios serán notificados en la aplicación.
        </Section>

        <Section title="9. Contacto">
          Para preguntas: soporte@comandpos.com
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
