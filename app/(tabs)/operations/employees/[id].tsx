import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, LoadingState } from '@components/ui';
import { SectionCard } from '@components/dashboard/SectionCard';
import { KpiCard } from '@components/dashboard/KpiCard';
import { palette, shadow } from '@theme/colors';
import { fmtCurrency } from '@utils/format';
import { useEmployees } from '@hooks/useOperations';
import type { EmployeeBasic } from '@/types/operations';

const initials = (name: string): string =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

const fmtDate = (raw?: string | null): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const yearsBetween = (start?: string | null, end?: string | null): string => {
  if (!start) return '—';
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  const days = Math.floor((b - a) / 86_400_000);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return `${years}a ${months}m`;
  if (months > 0) return `${months}m`;
  return `${days}d`;
};

const POCKETBASE_PHOTO_URL = (photo: string) =>
  `https://pocketbase.gcoderd.com/api/files/persons/${photo}`;

const KvRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({
  label,
  value,
  valueColor,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      borderBottomWidth: 0.5,
      borderBottomColor: palette.dark.border,
      gap: 12,
    }}
  >
    <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    <Text
      style={{
        color: valueColor ?? palette.dark.text,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
      }}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

export default function EmployeeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const employeeId = Number(id);

  const listQ = useEmployees();
  const employee = listQ.data?.find((e) => e.id === employeeId);

  const isLoading = listQ.isLoading && !employee;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={listQ.isRefetching} onRefresh={() => listQ.refetch()} />
        }
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 8,
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
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: palette.dark.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              DETALLE DE EMPLEADO
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <LoadingState
              label="Cargando empleado…"
              hint="Trayendo información del empleado."
            />
          </View>
        ) : !employee ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Empleado no encontrado.
              </Text>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            <HeroCard data={employee} />
            <KpisRow data={employee} />
            <PositionCard data={employee} />
            {employee.business_unit_name || employee.location_name ? (
              <LocationCard data={employee} />
            ) : null}
            <CompensationCard data={employee} />
            <InfoBanner />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────

const HeroCard: React.FC<{ data: EmployeeBasic }> = ({ data }) => {
  const isActive = data.status_id === 1;
  const photoUrl = data.photo ? POCKETBASE_PHOTO_URL(data.photo) : null;

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 22,
        padding: 22,
        ...shadow.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          />
        ) : (
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>
              {initials(data.full_name)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1,
            }}
          >
            {data.employee_code ?? '—'}
          </Text>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '800',
              marginTop: 2,
              letterSpacing: -0.4,
            }}
            numberOfLines={2}
          >
            {data.full_name}
          </Text>
          {data.job_title_name ? (
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
              {data.job_title_name}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 16, gap: 8, flexWrap: 'wrap' }}>
        <View
          style={{
            backgroundColor: isActive ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              color: isActive ? '#34D399' : '#FCA5A5',
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 0.5,
            }}
          >
            ● {data.employee_status_name?.toUpperCase() ?? (isActive ? 'ACTIVO' : 'INACTIVO')}
          </Text>
        </View>
        {data.department_name ? (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
              {data.department_name}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
};

const KpisRow: React.FC<{ data: EmployeeBasic }> = ({ data }) => {
  const hasSalary = Number(data.monthly_salary ?? 0) > 0;
  const hasHire = !!data.hire_date;

  if (!hasSalary && !hasHire) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {hasSalary ? (
        <KpiCard
          label="Salario"
          value={fmtCurrency(data.monthly_salary)}
          emoji="💰"
          hint="mensual"
        />
      ) : null}
      {hasHire ? (
        <KpiCard
          label="Antigüedad"
          value={yearsBetween(data.hire_date)}
          emoji="📅"
          hint={`desde ${fmtDate(data.hire_date).split(' de ').slice(0, 2).join(' ')}`}
        />
      ) : null}
    </View>
  );
};

const PositionCard: React.FC<{ data: EmployeeBasic }> = ({ data }) => (
  <SectionCard title="Posición" emoji="💼">
    <KvRow label="Código de empleado" value={data.employee_code ?? '—'} />
    {data.job_title_name ? <KvRow label="Cargo" value={data.job_title_name} /> : null}
    {data.department_name ? <KvRow label="Departamento" value={data.department_name} /> : null}
    {data.employee_status_name ? (
      <KvRow
        label="Status"
        value={data.employee_status_name}
        valueColor={data.status_id === 1 ? palette.dark.success : palette.dark.danger}
      />
    ) : null}
  </SectionCard>
);

const LocationCard: React.FC<{ data: EmployeeBasic }> = ({ data }) => (
  <SectionCard title="Ubicación" emoji="📍">
    {data.business_unit_name ? (
      <KvRow label="Unidad de negocio" value={data.business_unit_name} />
    ) : null}
    {data.location_name ? <KvRow label="Sucursal" value={data.location_name} /> : null}
  </SectionCard>
);

const CompensationCard: React.FC<{ data: EmployeeBasic }> = ({ data }) => {
  const salary = Number(data.monthly_salary ?? 0);
  if (salary <= 0 && !data.hire_date) return null;
  const yearly = salary * 12;
  const hourly = salary > 0 ? salary / (8 * 23) : 0;

  return (
    <SectionCard title="Compensación e historia" emoji="💰">
      {salary > 0 ? (
        <>
          <KvRow
            label="Salario mensual"
            value={fmtCurrency(salary)}
            valueColor={palette.dark.success}
          />
          <KvRow label="Salario anual estimado" value={fmtCurrency(yearly)} />
          <KvRow label="Por hora estimado" value={fmtCurrency(hourly)} />
        </>
      ) : null}
      {data.hire_date ? (
        <>
          <KvRow label="Fecha de ingreso" value={fmtDate(data.hire_date)} />
          <KvRow label="Antigüedad" value={yearsBetween(data.hire_date)} />
        </>
      ) : null}
    </SectionCard>
  );
};

const InfoBanner: React.FC = () => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#FFFBEB',
      borderWidth: 1,
      borderColor: '#FDE68A',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 4,
    }}
  >
    <Text style={{ fontSize: 16 }}>ℹ️</Text>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#92400E', fontSize: 11, fontWeight: '700' }}>
        Información personal completa
      </Text>
      <Text style={{ color: '#92400E', fontSize: 11, marginTop: 2, lineHeight: 16 }}>
        Para ver NSS, género, nacionalidad, religión, contactos y documentos del empleado, abre el
        expediente desde el sistema web.
      </Text>
    </View>
  </View>
);
