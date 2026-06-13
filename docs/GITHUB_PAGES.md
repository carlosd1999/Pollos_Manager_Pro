# Publicar en GitHub Pages

Tu app es **solo frontend**; Supabase sigue en la nube. Las variables `VITE_*` deben existir **al hacer `npm run build`** (GitHub Actions las lee de *Secrets*).

## 1. Secrets en GitHub (equivalente a `.env`)

1. Repo en GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** y crea exactamente estos nombres:

| Nombre | Valor |
|--------|--------|
| `VITE_SUPABASE_URL` | Igual que en tu `.env` local |
| `VITE_SUPABASE_ANON_KEY` | Igual que en tu `.env` local |

Son la **anon key** y la URL del proyecto (no uses la *service role* en el frontend).

## 2. Activar GitHub Pages con Actions

1. **Settings** → **Pages**.
2. En **Build and deployment** → **Source**: elige **GitHub Actions** (no “Deploy from a branch” con `/docs` salvo que sepas lo que haces).

El workflow `.github/workflows/deploy-github-pages.yml` se ejecuta en cada push a la rama **`main`**. Si tu rama principal se llama **`master`**, edita el archivo y cambia `branches: [main]` por `[master]`.

## 3. Primera publicación

1. Haz **commit y push** de los cambios del repo (workflow, `vite.config`, etc.).
2. Pestaña **Actions**: debería aparecer el workflow **Deploy GitHub Pages** en verde.
3. **Settings** → **Pages**: al cabo de un minuto verás la URL (p. ej. `https://TU_USUARIO.github.io/NOMBRE_REPO/`).

## 4. Supabase (login y enlaces de correo)

En Supabase → **Authentication** → **URL configuration**:

- **Site URL**: la URL real de GitHub Pages (con `https` y la barra final opcional).
- **Redirect URLs**: añade la misma URL; si usas recuperación de contraseña, incluye también patrones que Supabase permita (por ejemplo `https://TU_USUARIO.github.io/NOMBRE_REPO/**` si la consola lo admite).

Sin esto, el auth puede fallar solo en producción.

## 5. Repo `usuario.github.io` (sitio en la raíz)

Si el repositorio se llama exactamente **`TU_USUARIO.github.io`**, el workflow pone `VITE_BASE_PATH=/` y la web queda en `https://TU_USUARIO.github.io/` sin subcarpeta.

## 6. Probar el build en tu PC con la misma base que Pages

Sustituye `NOMBRE_REPO` por el nombre real del repo en GitHub:

```bash
set VITE_BASE_PATH=/NOMBRE_REPO/
npm run build
npx vite preview
```

Abre la URL que indique `vite preview` y comprueba que carga bien.
