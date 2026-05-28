import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, LoadingState } from '@components/ui';
import { SectionCard } from '@components/dashboard/SectionCard';
import { palette, shadow } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useInvoiceDetail } from '@hooks/useManagement';
import { exportAndSharePdf } from '@utils/exportPdf';
import { useBusinessStore } from '@store/useBusinessStore';
import { buName } from '@utils/format';

const STATUS_STYLE: Record<number, { label: string; bg: string; color: string }> = {
  1: { label: 'Activa', bg: '#ECFDF5', color: '#065F46' },
  2: { label: 'Anulada', bg: '#FEF2F2', color: '#991B1B' },
  3: { label: 'Pagada', bg: '#DBEAFE', color: '#1E3A8A' },
  4: { label: 'Crédito', bg: '#FEF3C7', color: '#92400E' },
};

const fmtDateTime = (raw?: string): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
};

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
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: palette.dark.border,
      gap: 10,
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

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = Number(id);
  const bu = useBusinessStore((s) => s.activeBusinessUnit);

  const { data, isLoading, isRefetching, refetch, error } = useInvoiceDetail(invoiceId || null);

  const inv = data;
  const items = inv?.items ?? [];
  const sty = STATUS_STYLE[inv?.status_id ?? 1] ?? STATUS_STYLE[1];

  const handleExportPdf = async () => {
    if (!inv) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await exportAndSharePdf({
        title: `Factura ${inv.invoice_ncf ?? inv.invoice_number ?? '—'}`,
        subtitle: inv.client_name ?? inv.customer_name ?? '—',
        businessName: buName(bu),
        locationName: inv.location_description ?? inv.location_name,
        dateRange: fmtDateTime(inv.emission_date),
        sections: [
          {
            title: 'Información del cliente',
            rows: [
              { label: 'Cliente', value: inv.client_name ?? inv.customer_name ?? '—' },
              { label: 'RNC/Cédula', value: inv.client_rnc ?? '—' },
              { label: 'Teléfono', value: inv.client_phone ?? '—' },
              { label: 'Email', value: inv.client_email ?? '—' },
              { label: 'Dirección', value: inv.client_address ?? '—' },
            ],
          },
          {
            title: 'Items',
            rows: items.map((it) => ({
              label: `${it.quantity}× ${it.item_name}`,
              value: fmtCurrency(it.total_amount),
            })),
          },
          {
            title: 'Totales',
            rows: [
              ...(inv.subtotal_amount
                ? [{ label: 'Subtotal', value: fmtCurrency(inv.subtotal_amount) }]
                : []),
              ...(inv.discount_amount
                ? [
                    {
                      label: 'Descuento',
                      value: fmtCurrency(inv.discount_amount),
                      negative: true,
                    },
                  ]
                : []),
              ...(inv.taxes_amount
                ? [{ label: 'ITBIS', value: fmtCurrency(inv.taxes_amount) }]
                : []),
              ...(inv.invoice_tip
                ? [{ label: 'Propina', value: fmtCurrency(inv.invoice_tip) }]
                : []),
              { label: 'TOTAL', value: fmtCurrency(inv.total_amount), positive: true },
            ],
          },
        ],
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
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
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: palette.dark.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              FACTURA
            </Text>
            <Text
              style={{ color: palette.dark.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.4 }}
            >
              {inv?.invoice_ncf ?? inv?.invoice_number ?? '—'}
            </Text>
          </View>
          {inv ? (
            <Pressable
              onPress={handleExportPdf}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: palette.dark.surface,
                borderWidth: 1,
                borderColor: palette.dark.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 13 }}>📄</Text>
              <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '700' }}>PDF</Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <LoadingState label="Cargando factura…" />
          </View>
        ) : error ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>
                Error
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar la factura.'}
              </Text>
            </Card>
          </View>
        ) : !inv ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Factura no encontrada.
              </Text>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {/* Hero */}
            <Card variant="default">
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: palette.dark.textMuted,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                >
                  TOTAL FACTURA
                </Text>
                <View
                  style={{
                    backgroundColor: sty.bg,
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 7,
                  }}
                >
                  <Text
                    style={{ color: sty.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}
                  >
                    {sty.label.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: palette.dark.text,
                  fontSize: 30,
                  fontWeight: '800',
                  letterSpacing: -0.8,
                }}
              >
                {fmtCurrency(inv.total_amount, inv.currency_code ?? 'DOP')}
              </Text>
              <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 4 }}>
                {fmtDateTime(inv.emission_date)}
              </Text>
            </Card>

            {/* Cliente */}
            <SectionCard title="Cliente" emoji="👤">
              <KvRow label="Nombre" value={inv.client_name ?? inv.customer_name ?? '—'} />
              <KvRow label="RNC / Cédula" value={inv.client_rnc ?? '—'} />
              {inv.client_phone ? <KvRow label="Teléfono" value={inv.client_phone} /> : null}
              {inv.client_email ? <KvRow label="Email" value={inv.client_email} /> : null}
              {inv.client_address ? <KvRow label="Dirección" value={inv.client_address} /> : null}
            </SectionCard>

            {/* Items */}
            {items.length > 0 ? (
              <SectionCard title="Items" subtitle={`${items.length} productos`} emoji="📦">
                <View style={{ gap: 10 }}>
                  {items.map((it, idx) => (
                    <View
                      key={`item-${it.id ?? 'noid'}-${idx}`}
                      style={{
                        paddingBottom: 10,
                        borderBottomWidth: idx < items.length - 1 ? 0.5 : 0,
                        borderBottomColor: palette.dark.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}
                            numberOfLines={2}
                          >
                            {it.item_name}
                          </Text>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 3 }}>
                            {fmtInt(it.quantity)} × {fmtCurrency(it.unit_price)}
                            {it.tax_type_name ? ` · ${it.tax_type_name}` : ''}
                          </Text>
                        </View>
                        <Text
                          style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800' }}
                        >
                          {fmtCurrency(it.total_amount)}
                        </Text>
                      </View>
                      {it.discount_amount ? (
                        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 3 }}>
                          desc. {fmtCurrency(it.discount_amount)}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </SectionCard>
            ) : null}

            {/* Totales */}
            <SectionCard title="Totales" emoji="💰">
              {inv.subtotal_amount ? (
                <KvRow label="Subtotal" value={fmtCurrency(inv.subtotal_amount)} />
              ) : null}
              {inv.discount_amount ? (
                <KvRow
                  label="Descuento"
                  value={`(${fmtCurrency(inv.discount_amount)})`}
                  valueColor={palette.dark.danger}
                />
              ) : null}
              {inv.taxes_amount ? (
                <KvRow label="ITBIS (18%)" value={fmtCurrency(inv.taxes_amount)} />
              ) : null}
              {inv.invoice_tip ? (
                <KvRow label="Propina" value={fmtCurrency(inv.invoice_tip)} />
              ) : null}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  marginTop: 4,
                  borderTopWidth: 1.5,
                  borderTopColor: palette.dark.text,
                }}
              >
                <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800' }}>
                  TOTAL
                </Text>
                <Text
                  style={{
                    color: palette.dark.text,
                    fontSize: 18,
                    fontWeight: '800',
                    letterSpacing: -0.4,
                  }}
                >
                  {fmtCurrency(inv.total_amount, inv.currency_code ?? 'DOP')}
                </Text>
              </View>
            </SectionCard>

            {/* Metadata */}
            <SectionCard title="Información adicional" emoji="ℹ️">
              <KvRow label="Número" value={inv.invoice_number} />
              {inv.invoice_ncf ? <KvRow label="NCF" value={inv.invoice_ncf} /> : null}
              {inv.location_description || inv.location_name ? (
                <KvRow
                  label="Sucursal"
                  value={inv.location_description ?? inv.location_name ?? '—'}
                />
              ) : null}
              {inv.currency_code ? (
                <KvRow label="Moneda" value={inv.currency_code} />
              ) : null}
            </SectionCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
