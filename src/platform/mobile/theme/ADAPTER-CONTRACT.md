# PHO3NIX V2 — Mobile Theme Adapter Contract

Este directorio queda reservado para React Native / Expo.

El motor compartido está en:

```text
src/shared/theme/
```

La futura aplicación móvil NO debe copiar el calendario ni sus reglas.

Debe implementar adapters equivalentes a los de:

```text
src/platform/web/theme/
```

## Storage

En Web:

```text
localStorage
```

En móvil podrá utilizarse:

```text
AsyncStorage
```

o la solución persistente aprobada para la app.

La interfaz conceptual requerida es:

```js
readThemeRuntimeSnapshotCache()
writeThemeRuntimeSnapshotCache(snapshot)

readThemeVisualCache(themeKey)
writeThemeVisualCache(theme)
```

## Sync

Debe proporcionar operaciones equivalentes a:

```js
fetchThemeRuntimeSnapshotRemote()
fetchThemeVisualByKeyRemote(themeKey)
fetchActiveThemeVisualRemote(dateKey)
subscribeThemeRuntimeRemote(onChange)
```

## Regla

La app debe consumir:

```text
Supabase
   ↓
Platform Mobile Adapter
   ↓
Shared Theme Engine
   ↓
React Native renderer
```

Cambios de calendario/themes remotos NO deben requerir una nueva
publicación en Google Play o App Store.

Fallback definitivo:

```text
phoenix
```

Timezone:

```text
America/Guayaquil
```
