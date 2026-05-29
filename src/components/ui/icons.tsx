import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { palette } from '@theme/colors';

export interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

const base = (p: IconProps) => ({
  color: p.color ?? palette.dark.textDim,
  size: p.size ?? 22,
  sw: p.strokeWidth ?? 1.8,
});

/** Rayo — tab "Hoy" */
export const IconBolt = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Grid — dashboard */
export const IconGrid = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Tendencia ascendente — reportes */
export const IconTrend = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m3 17 6-6 4 4 8-8M21 7v6m0-6h-6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Caja 3D — operación / inventario */
export const IconBox = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Engranaje — ajustes */
export const IconSettings = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={sw} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Personas — meseros / empleados */
export const IconUsers = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Mesas / áreas */
export const IconTable = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10h18M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 10v8m12-8v8M9 18v2m6-2v2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Factura / recibo */
export const IconInvoice = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v5h5M8 13h8M8 17h5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Salir — logout */
export const IconLogout = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Campana — notificaciones */
export const IconBell = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Info — acerca de */
export const IconInfo = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={sw} />
      <Path d="M12 16v-4m0-4h.01" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Billete — utilidad / dinero */
export const IconMoney = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={6} width={20} height={12} rx={2} stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12} r={2.5} stroke={color} strokeWidth={sw} />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
};

/** Sol naciente — empty state "sin actividad" */
export const IconSunrise = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v3m0 14H2m20 0h-4M4.2 10.2l1.4 1.4m12.8-1.4-1.4 1.4M1 19h22M8 19a4 4 0 1 1 8 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Capas — consolidado */
export const IconLayers = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 2 8l10 5 10-5-10-5ZM2 16l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

/** Tienda — sucursal */
export const IconStore = (p: IconProps) => {
  const { color, size, sw } = base(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9h16M4 9 5 4h14l1 5M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0M9 20v-5h6v5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
