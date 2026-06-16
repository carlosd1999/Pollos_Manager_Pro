/** Mismo `id` en el div del formulario de cada módulo CRUD (solo uno montado a la vez). */
export const MODULE_FORM_SCROLL_TARGET_ID = 'module-form-scroll-target';

/**
 * Tras pulsar «Editar» en móvil (layout apilado), sube la vista hasta el formulario.
 */
export function scrollModuleFormIntoView() {
  if (typeof document === 'undefined') return;
  const run = () => {
    document.getElementById(MODULE_FORM_SCROLL_TARGET_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}
