# 🚀 ComandPOS Manager — Plan V2 (Production Ready)

## Estado actual

✅ 5 tabs · 14 pantallas con data real · 6 reportes · 5 módulos operativos · Aprobaciones inline · Caché offline · Export PDF · Push notif scaffold

---

## Plan de ejecución

### 🏗️ Bloque 1 — Foundations producción
- [x] App.json con branding correcto, icon + splash placeholders
- [x] EAS Build (`eas.json` + scripts)
- [x] Sentry scaffold (sin DSN — el usuario lo configura)
- [x] Pantalla "Acerca de" con versión, build, links
- [x] Pantalla Política de Privacidad
- [x] Pantalla Términos de Servicio

### 🔍 Bloque 2 — Búsqueda global ⌘K
- [x] Modal full-screen accesible desde cualquier tab
- [x] Busca: empleados, productos, sucursales, facturas
- [x] Resultados agrupados con navegación directa
- [x] Atajo rápido en header de tabs

### 🤖 Bloque 3 — IA (Insights + Q&A + Forecasting)
- [x] Forecasting client-side con regresión lineal (últimos 30 días)
- [x] AI Insights generados por análisis de KPIs (sin LLM)
- [x] AI Q&A scaffold (preparado para integrar Claude/OpenAI cuando esté el endpoint)
- [x] Sección "Insights" en dashboard con anomalías detectadas

### 📅 Bloque 4 — Operacional
- [x] Calendario de turnos (vista semanal)
- [x] Ajuste de inventario (formulario con razón + cantidad)
- [x] Cierre del día wizard (3 pasos)
- [x] Drill-down en charts (modal con detalle al tap)
- [x] Comparar 2 sucursales lado a lado (selector)

### ✨ Bloque 5 — UX polish
- [x] Onboarding tour 4 slides primera vez
- [x] Animaciones de transición (Stack screenOptions)
- [x] Skeleton realistas (preview del layout final)
- [x] Versión en Settings

---

## Lo que NO se hace en esta sesión (requiere backend/assets)

❌ **App icon real** — requiere diseño profesional. Dejo el placeholder Expo + instrucciones para reemplazar.
❌ **Widget iOS / Glance Android** — Expo Go no soporta widgets nativos. Requiere config plugin custom (4-6h de trabajo separado).
❌ **Notificaciones push REALES** — requiere que el backend implemente el sender con Expo Push API y envíe a los tokens registrados.
❌ **Socket.IO en vivo** — el cliente lo puede implementar pero requiere validar autenticación con el backend (token JWT compartido).
❌ **Sentry DSN real** — el usuario lo configura en su cuenta Sentry.io.

Estos items quedan documentados con scaffolding listo. Para activarlos solo hace falta:
1. Generar icon en `assets/icon.png` 1024x1024
2. Configurar `SENTRY_DSN` en `.env`
3. Backend que implemente notification sender
4. Endpoint `POST /api/ai/chat` que llame a Claude/OpenAI
