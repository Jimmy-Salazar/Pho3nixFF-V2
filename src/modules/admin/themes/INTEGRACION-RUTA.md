# Integración de ruta

El script intenta agregar automáticamente:

```jsx
<Route
  path="/admin/themes"
  element={<AdminThemesPage />}
/>
```

Si no pudo hacerlo, agrega manualmente al router:

```jsx
import AdminThemesPage from "<ruta>/modules/admin/pages/AdminThemesPage.jsx"
```

y dentro de `<Routes>`:

```jsx
<Route
  path="/admin/themes"
  element={<AdminThemesPage />}
/>
```

La página creada es:

```text
src/modules/admin/pages/AdminThemesPage.jsx
```

No agregues esta ruta al acceso público.
Debe permanecer bajo la protección Admin que ya utiliza PHO3NIX.
