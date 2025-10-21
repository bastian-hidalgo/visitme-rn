# Fix Log

## Dependency alignment
- Expo SDK: expo `~54.0.17`
- React Native: `0.76.6`
- React / React DOM: `18.2.0`
- Expo Router: `~6.0.13`
- Expo Asset: `~12.0.9`
- @expo/metro-runtime: `~4.0.0`
- @supabase/supabase-js: `^2.51.0`

## Issues detected & corrective actions
- `Unable to resolve "expo" from "@expo/metro-runtime/..."` → aligned the Metro runtime version and added an explicit Metro alias for the local Expo package.
- `Unable to resolve "expo-asset"` / general bundling failures → synchronized Expo/React/React Native versions with SDK 54 expectations and regenerated Babel/Metro configuration files.
- `The package ... attempted to import "stream"` (Supabase) → added URL polyfill and WebSocket shim globally to satisfy Supabase realtime requirements in React Native.
- `Unable to resolve "expo-router/entry-classic"` → restored the canonical Expo Router entry via a root `index.js` file that imports `expo-router/entry`.
- `.plugins is not a valid Plugin property` → ensured Metro/Babel configs follow the modern Expo defaults.

## Configuration updates
- Added `index.js` with required polyfills before bootstrapping Expo Router.
- Regenerated `babel.config.js` using the Expo preset only.
- Replaced custom Metro config with the Expo default plus an explicit alias for the app-local `expo` package.
- Applied Supabase polyfills directly within `lib/supabase/client.ts` to guarantee compatibility when the module is loaded.
