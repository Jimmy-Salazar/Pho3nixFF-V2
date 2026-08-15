# PHO3NIX V2 — AUTO-ONLY

El Theme Engine de producción opera únicamente en modo automático.

## Autoridad

```text
America/Guayaquil
        ↓
Calendario oficial
        ↓
Shared Theme Engine
        ↓
Theme activo
```

## Producción

```text
mode = auto
manualThemeKey = null
```

Un valor remoto antiguo `mode = manual` no puede forzar un theme.

## Admin Theme Center

`/admin/themes` es un monitor de solo lectura.

No contiene:

- selector manual;
- botones para cambiar theme;
- interruptores para activar/desactivar reglas;
- escrituras a Supabase.

## Preview DEV

Las herramientas de preview de desarrollo continúan siendo locales
y no forman parte del runtime global de producción.

## Fallback

```text
phoenix
```
