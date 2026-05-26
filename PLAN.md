# 📱 ComandPOS Manager — Plan de Implementación

> App administrativa móvil para dueños/gerentes de restaurantes.
> Consume los endpoints del sistema web `restaurante-comandpos` para mostrar
> reportes ejecutivos, KPIs financieros y analytics operativos en tiempo real.

---

## 🎯 Objetivo

Construir una app **React Native + Expo** **enterprise-grade**, con UI premium
(estilo Linear/Stripe/Ramp), que permita a la administración:

- Consultar **ventas, utilidades, propinas, gastos y caja** desde el móvil.
- Filtrar por **Business Unit** (unidad de negocio) y por **Location** individual o **consolidado**.
- Visualizar **charts modernos** (líneas, barras, donuts, heatmaps).
- Recibir **alertas push** (futuro) sobre eventos críticos: cierre de caja, ventas anómalas.

**NO** es una app para meseros (esa es `comand-pos-movil-lite`).
**Esta es la app gerencial.**

---

## 🏷️ Identidad del Proyecto

| Campo            | Valor                              |
| ---------------- | ---------------------------------- |
| **Nombre app**   | ComandPOS Manager                  |
| **Slug Expo**    | `comandpos-manager`                |
| **Bundle ID**    | `com.comandpos.manager`            |
| **Tagline**     | *Tu restaurante en el bolsillo*    |
| **Color brand** | `#10B981` (verde) + `#0F172A` (slate dark) |
| **Tema**         | Dark-first con soporte light       |

---

## 🧱 Stack Técnico

### Core
- **Expo SDK 54** (alineado con `comand-pos-movil-lite`)
- **React Native 0.81** + **React 19**
- **TypeScript** estricto
- **Expo Router** (file-based routing, similar a Nuxt — el usuario ya conoce el patrón)

### State & Data
- **Zustand** (consistente con `comand-pos-movil-lite`)
- **TanStack Query (React Query)** — caché, refetch, optimistic updates
- **Axios** con interceptor JWT (replica de `apiClient.ts` del proyecto lite)
- **AsyncStorage** para persistencia (token, prefs)

### UI & Diseño
- **NativeWind v4** (Tailwind para RN) — coherente con stack web
- **react-native-reanimated v3** — animaciones nativas premium
- **react-native-gesture-handler**
- **@expo/vector-icons** (Material Community Icons — mismo set que el web `mdi-*`)
- **expo-haptics** — feedback táctil al cambiar pestañas/filtros
- **expo-linear-gradient** — backgrounds premium en KPI cards

### Charts
- **Victory Native XL** (basado en Skia, performante en 60fps)
  - Alternativa: `react-native-gifted-charts` si Victory tiene fricciones
- **react-native-skia** (peer dependency de Victory XL)

### Fechas / Formato
- **date-fns** + locale `es`
- **Intl.NumberFormat('es-DO', { currency: 'DOP' })** (nativo)

### Auth
- **JWT** vía `/routes/auth/login.post.ts` (POST `/auth/login`)
- Token guardado en AsyncStorage
- Refresh automático en 401 (igual que el proyecto lite)

### DevOps
- **EAS Build** (Expo Application Services) para iOS/Android
- **EAS Update** para OTA updates
- **Sentry** (opcional) para error tracking

---

## 📂 Estructura de Carpetas

```
comandpos-manager/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx              # Root layout (theme, providers)
│   ├── index.tsx                # Splash / redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── server-config.tsx    # URL del backend
│   │   ├── login.tsx            # Email + password
│   │   └── select-business.tsx  # Elegir BU si tiene varias
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tab bar
│       ├── dashboard.tsx        # Home — KPIs + charts
│       ├── reports/
│       │   ├── _layout.tsx
│       │   ├── index.tsx        # Lista de reportes disponibles
│       │   ├── sales.tsx
│       │   ├── waiter-sales.tsx
│       │   ├── tips-analysis.tsx
│       │   ├── profit-loss.tsx
│       │   ├── purchases-expenses.tsx
│       │   ├── boxes/
│       │   │   ├── index.tsx    # Lista de cajas
│       │   │   └── [id].tsx     # Detalle de caja
│       └── settings.tsx         # Tema, logout, info
├── src/
│   ├── components/
│   │   ├── ui/                  # Primitivos (Card, Button, Sheet, Skeleton)
│   │   ├── charts/              # LineChart, BarChart, DoughnutChart, Heatmap
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── HeroNetProfit.tsx
│   │   │   ├── LocationSelector.tsx   # Port directo del componente Vue
│   │   │   ├── BusinessUnitSelector.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   └── PresetChips.tsx
│   │   └── reports/             # Componentes por reporte
│   ├── services/
│   │   ├── apiClient.ts         # Axios + interceptors
│   │   ├── auth.ts              # login, logout, me
│   │   ├── dashboard.ts         # /api/dashboard/financial-overview
│   │   ├── reports/
│   │   │   ├── sales.ts
│   │   │   ├── waiterSales.ts
│   │   │   ├── tipsAnalysis.ts
│   │   │   ├── profitLoss.ts
│   │   │   ├── purchasesExpenses.ts
│   │   │   └── boxes.ts
│   │   └── locations.ts
│   ├── store/
│   │   ├── useAuthStore.ts      # token, user, apiBaseUrl
│   │   ├── useBusinessStore.ts  # business_unit_id activo, locations
│   │   └── useFiltersStore.ts   # rango fechas + location_id seleccionado
│   ├── theme/
│   │   ├── colors.ts            # palette dark/light
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── tokens.ts
│   ├── hooks/
│   │   ├── useFinancialOverview.ts
│   │   ├── useSalesReport.ts
│   │   ├── useLocations.ts
│   │   └── useDebouncedValue.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── reports.ts
│   │   └── business.ts
│   └── utils/
│       ├── format.ts            # fmtCurrency, fmtPct, fmtInt, fmtDays
│       ├── dates.ts             # presets, isoDate, rangeSpan
│       └── logger.ts
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── fonts/                   # Inter (regular, medium, semibold, bold)
├── app.json
├── eas.json
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

---

## 🌐 Endpoints Consumidos

Todos contra el backend Nuxt (`restaurante-comandpos`):

### Auth
- `POST /auth/login` → JWT + user (con `business_units_with_access`)
- `POST /auth/logout`
- `GET /auth/me` (refrescar user)

### Dashboard Ejecutivo
- `POST /api/dashboard/financial-overview` — KPIs, monthly_series, expense_breakdown, aging, cash_flow, heatmap, top_customers, top_products_profit

### Reportes
- `POST /api/restaurant/reports/analytics/summary`
- `POST /api/restaurant/reports/analytics/payments`
- `POST /api/restaurant/reports/analytics/products-abc`
- `POST /api/restaurant/reports/analytics/waiters`
- `POST /api/restaurant/reports/analytics/categories`
- `POST /api/restaurant/reports/analytics/heatmap`
- `POST /api/restaurant/reports/analytics/cash-flow`
- `POST /api/restaurant/reports/analytics/expenses`
- `POST /api/restaurant/reports/waiter-sales`
- `POST /api/restaurant/reports/tips-analysis`
- `POST /api/restaurant/reports/pl-kpis`
- `POST /api/restaurant/reports/pl-trends`
- `POST /api/restaurant/reports/pl-channels`
- `POST /api/restaurant/reports/pl-details`
- `POST /api/restaurant/reports/pl-operations`
- `POST /api/restaurant/reports/pl-position`
- `POST /api/reports/purchases-expenses-dashboard`

### Cajas
- `GET /api/restaurant/boxes` (lista) — *verificar nombre exacto*
- `GET /api/restaurant/boxes/:id` (detalle)

### Body común
Todos los endpoints aceptan:
```json
{
  "business_unit_id": 1,
  "start_date": "2026-05-01",
  "end_date": "2026-05-25",
  "location_id": 5,         // opcional — sucursal específica
  "location_ids": [5, 7, 9] // opcional — consolidado de varias
}
```

---

## 🔐 Flujo de Autenticación

1. **Server Config** → Usuario ingresa URL del backend (ej: `https://api.cliente.com`).
2. **Login** → Email + password → `POST /auth/login` → recibe `{ user, token }`.
3. **Select Business Unit** → Si `user.business_units_with_access.length > 1`, el usuario elige cuál es la activa. Persiste en `useBusinessStore`.
4. **Location Filter** → Dentro de la BU activa, el usuario decide:
   - **Consolidado** → envía `location_ids: [...todas]`
   - **Una sucursal** → envía `location_id: X`
5. Token persiste en AsyncStorage. Interceptor lo agrega como `Authorization: Bearer ...`.
6. Si recibe `401`, hace logout automático.

---

## 🧩 Pantallas Detalladas

### 1️⃣ **Dashboard** (`app/(tabs)/dashboard.tsx`)
Espejo del `app/pages/index.vue` web, optimizado para móvil:

- **Header**: BU selector + Date range chips (Hoy, 7d, Mes, 30d, 90d, Año)
- **Location Selector** (si hay >1 location): toggle `Consolidado | Por Sucursal`
- **Hero Card — Utilidad Neta** (con gradient, animación al cambiar)
- **6 KPI Cards** en grid 2x3:
  - Ventas, Compras, Gastos, Margen Bruto, Margen Neto, ITBIS Neto
- **Chart 1**: P&L mensual (Bar — ventas/costos/gastos por mes)
- **Chart 2**: Distribución de gastos (Doughnut)
- **Chart 3**: Flujo de caja (Line con área)
- **Chart 4**: Heatmap hora × día (ventas por horario)
- **Top 5 productos por utilidad**
- **Top 5 clientes (Pareto)**
- **Pull-to-refresh**, **Skeleton loaders**

### 2️⃣ **Reports List** (`app/(tabs)/reports/index.tsx`)
Grid de reportes disponibles (cards grandes con icono + descripción):

- Ventas (`sales`)
- Ventas por Mesero (`waiter-sales`)
- Análisis de Propinas (`tips-analysis`)
- Estado de Resultados / P&L (`profit-loss`)
- Compras y Gastos (`purchases-expenses`)
- Cajas (`boxes`)

### 3️⃣ **Sales Report** (`reports/sales.tsx`)
Tabs scrolleables:
- **Resumen**: KPIs (ventas total, ticket promedio, # facturas, # clientes)
- **Ventas**: Line chart diario + tabla
- **Caja**: Métodos de pago (Doughnut)
- **Productos**: Top productos (ABC)
- **Cortesías**: Lista de descuentos/cortesías
- **Gastos**: Comparativa ventas vs gastos
- **Análisis**: Heatmap

### 4️⃣ **Waiter Sales** (`reports/waiter-sales.tsx`)
- Ranking de meseros (cards con avatar, ventas, # mesas, tiempo prom.)
- Bar chart comparativo
- Filtro por mesero individual

### 5️⃣ **Tips Analysis** (`reports/tips-analysis.tsx`)
- Total propinas, % sobre ventas
- Ranking por mesero
- Tendencia diaria (Line)
- Distribución por método (efectivo vs tarjeta)

### 6️⃣ **Profit & Loss** (`reports/profit-loss.tsx`)
- Estado de resultados completo (waterfall chart)
- KPIs: margen bruto, margen operativo, EBITDA, margen neto
- Comparativa períodos (mes actual vs anterior)
- Breakdown por canal (PedidosYa, UberEats, Salón, Delivery propio)

### 7️⃣ **Purchases & Expenses** (`reports/purchases-expenses.tsx`)
- Total compras + total gastos
- Tendencia mensual
- Top proveedores
- Distribución por categoría de gasto
- Aging CxP

### 8️⃣ **Boxes** (`reports/boxes/index.tsx` + `[id].tsx`)
- Lista de aperturas/cierres de caja
- Estado: Abierta (badge verde) / Cerrada (badge gris)
- Detalle: ventas, métodos de pago, diferencias, cierre, sangrías

### 9️⃣ **Settings** (`app/(tabs)/settings.tsx`)
- Cambiar tema (Dark / Light / System)
- Cambiar BU activa
- Cambiar URL del backend
- Logout
- Versión + build

---

## 🎨 Sistema de Diseño

### Paleta (dark mode default)

```ts
// theme/colors.ts
export const dark = {
  bg:        '#0F172A',   // slate-900
  surface:   '#1E293B',   // slate-800
  surfaceHi: '#334155',   // slate-700
  border:    '#475569',   // slate-600
  text:      '#F1F5F9',   // slate-100
  textDim:   '#94A3B8',   // slate-400
  primary:   '#10B981',   // emerald-500
  primaryHi: '#34D399',
  success:   '#22C55E',
  warning:   '#F59E0B',
  danger:    '#EF4444',
  info:      '#3B82F6',
  // Chart palette (10 colores brand)
  chart: ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6',
          '#EC4899','#14B8A6','#F97316','#06B6D4','#84CC16'],
}
```

### Tipografía
- **Inter** (Regular 400, Medium 500, Semibold 600, Bold 700, Black 900)
- Escala: `xs 11 / sm 13 / base 15 / lg 17 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36`

### Componentes UI base
- `Card` — radius 16, padding 16, shadow sutil
- `KpiCard` — variant con gradient, icon, trend arrow (↑/↓ + %)
- `Button` — primary, secondary, ghost (con haptic on press)
- `Chip` — para presets de fecha (Hoy, 7d, etc.)
- `Sheet` — bottom sheet para selectores (BU, Location)
- `Skeleton` — placeholders animados durante carga
- `EmptyState` — ilustración + mensaje cuando no hay data
- `ErrorState` — con retry button

### Animaciones
- Fade-in al cargar (300ms)
- KPI counter animado al cambiar valor (`react-native-reanimated`)
- Bottom sheet con spring physics
- Skeleton shimmer durante loading

---

## 🗺️ Roadmap por Fases

### **FASE 1 — Foundation** (esta sesión, paso por paso)
1. [ ] Inicializar Expo project con TypeScript template
2. [ ] Configurar Expo Router, NativeWind, paths (@components, @services, etc.)
3. [ ] Crear theme tokens (colors, typography, spacing)
4. [ ] Componentes UI primitivos: `Card`, `Button`, `Chip`, `Skeleton`
5. [ ] Crear `apiClient.ts` con axios + interceptor JWT
6. [ ] Configurar `useAuthStore` + `useBusinessStore` + `useFiltersStore`
7. [ ] Pantalla `ServerConfig` (ingreso de URL backend)

### **FASE 2 — Auth Flow**
1. [ ] Pantalla `Login` (email/password con diseño premium)
2. [ ] Llamada a `POST /auth/login` + persistencia
3. [ ] Pantalla `SelectBusiness` (si multi-BU)
4. [ ] Setup de Expo Router groups `(auth)` vs `(tabs)`
5. [ ] Protected routes (redirect si no hay token)

### **FASE 3 — Dashboard**
1. [ ] Layout de tabs con bottom navigation
2. [ ] `DateRangePicker` + `PresetChips` (Hoy, 7d, Mes, etc.)
3. [ ] `LocationSelector` (port del Vue component)
4. [ ] Integración con `/api/dashboard/financial-overview`
5. [ ] Hero Card de Utilidad Neta
6. [ ] 6 KPI Cards (Ventas, Compras, Gastos, Márgenes, ITBIS)
7. [ ] Chart 1: Bar — P&L mensual con Victory Native XL
8. [ ] Chart 2: Doughnut — gastos por categoría
9. [ ] Chart 3: Line — flujo de caja
10. [ ] Chart 4: Heatmap hora×día
11. [ ] Top productos + Top clientes (tablas)
12. [ ] Pull-to-refresh + Skeleton loaders

### **FASE 4 — Reports Core**
1. [ ] Reports index (grid de reportes)
2. [ ] Sales Report con tabs
3. [ ] Waiter Sales
4. [ ] Tips Analysis

### **FASE 5 — Reports Avanzados**
1. [ ] Profit & Loss (P&L)
2. [ ] Purchases & Expenses
3. [ ] Boxes (lista + detalle)

### **FASE 6 — Polish & Release**
1. [ ] Dark/Light toggle
2. [ ] Empty states ilustrados
3. [ ] Error boundaries
4. [ ] Animaciones finas (reanimated)
5. [ ] EAS Build setup
6. [ ] Push notifications (futuro)
7. [ ] Export PDF de reportes (futuro)

---

## 🔧 Configuración Inicial Recomendada

### `app.json` (highlights)
```json
{
  "expo": {
    "name": "ComandPOS Manager",
    "slug": "comandpos-manager",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "comandposmanager",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.comandpos.manager"
    },
    "android": {
      "package": "com.comandpos.manager",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#0F172A"
      }
    },
    "plugins": [
      "expo-router",
      "expo-font",
      ["expo-build-properties", { "ios": { "useFrameworks": "static" } }]
    ]
  }
}
```

### Dependencies clave para `package.json`
```json
{
  "dependencies": {
    "expo": "~54.0.33",
    "expo-router": "~4.0.0",
    "expo-linear-gradient": "~14.0.0",
    "expo-haptics": "~14.0.0",
    "expo-font": "~13.0.0",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "~15.8.0",
    "@react-native-async-storage/async-storage": "2.2.0",
    "axios": "^1.7.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.59.0",
    "nativewind": "^4.1.0",
    "tailwindcss": "^3.4.0",
    "victory-native": "^41.0.0",
    "@shopify/react-native-skia": "^1.5.0",
    "date-fns": "^4.1.0"
  }
}
```

---

## ✅ Criterios de "Done" por Fase

Cada fase se considera completa cuando:
- [ ] Compila sin errores TypeScript estrictos
- [ ] Funciona en iOS Simulator + Android Emulator
- [ ] Pasa lint
- [ ] Se prueba con backend real (no mocks)
- [ ] El usuario aprueba el diseño visual
- [ ] Se hace commit con mensaje convencional (`feat:`, `fix:`)

---

## 🚀 Próximo Paso Inmediato

**FASE 1 — Paso 1**: Inicializar el proyecto Expo.

```bash
cd /Users/gabrielrodriguez/Documents/Projects/react-native/comandpos-manager
npx create-expo-app@latest . --template blank-typescript
```

Luego instalar las dependencias base y configurar Expo Router + NativeWind.

> **Esperamos confirmación antes de ejecutar.**
