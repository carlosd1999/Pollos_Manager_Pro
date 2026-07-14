/**
 * Rol de administrador en app_metadata del JWT.
 * Debe coincidir con lo que configures en Supabase (Authentication → Users → App Metadata)
 * y con la función SQL public.is_app_admin() (literal 'admin' salvo que cambies el SQL).
 */
export const ADMIN_APP_ROLE = 'admin';

export function getAdminAppRole() {
  return (import.meta.env.VITE_ADMIN_APP_ROLE || ADMIN_APP_ROLE).trim();
}

/** @param {{ app_metadata?: { role?: string } } | null | undefined} user */
export function isAdminUser(user) {
  if (!user?.app_metadata) return false;
  const expected = getAdminAppRole().trim().toLowerCase();
  const role = user.app_metadata.role;
  return typeof role === 'string' && role.trim().toLowerCase() === expected;
}

/** Módulos sujetos a permisos (misma lista que en la tabla user_module_access). */
export const PERMISSION_MODULE_KEYS = [
  'dashboard',
  'ventas',
  'gastos',
  'mortalidad',
  'clientes',
  'ciclos',
  'alimentacion',
  'reportes',
];
