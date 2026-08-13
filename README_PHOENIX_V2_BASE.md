# PHO3NIX V2 Base

Base limpia para PHO3NIX V2.

Incluye tema remoto, caché local, idioma español/inglés, rutas base, layout responsive y pantallas placeholder.

## Instalar dependencias

```powershell
npm install @supabase/supabase-js react-router-dom
```

## Variables de entorno

Copia `.env.example` como `.env.local` y coloca tus datos reales de Supabase.

```powershell
Copy-Item .env.example .env.local
```

## SQL

Ejecuta `supabase/sql/001_app_themes.sql` en Supabase SQL Editor.

## Copiar archivos

Copia todo el contenido de `src/` sobre el `src/` del proyecto `phoenix-v2`.
