import { useEffect, useMemo, useRef, useState } from 'react';
import { sortLotesOldestFirst } from '../../lib/business';

function MortalidadForm({
  form,
  setForm,
  lotesWithAvailability,
  fieldErrors,
  inputClass,
  setFieldErrors,
  handleMortalidad,
  editingMortalidadId,
  onCancelEdit,
  formResetGeneration = 0,
}) {
  const isEditing = Boolean(editingMortalidadId);

  const lotesOrdenados = useMemo(
    () => sortLotesOldestFirst(lotesWithAvailability || []),
    [lotesWithAvailability],
  );

  const loteMortalidadPorDefecto = useMemo(() => {
    const hit = lotesOrdenados.find((l) => Number(l.disponibles) > 0);
    return hit ? String(hit.id) : '';
  }, [lotesOrdenados]);

  const [loteMortalidadManual, setLoteMortalidadManual] = useState(false);
  const prevFormResetGenRef = useRef(null);

  useEffect(() => {
    if (editingMortalidadId) {
      prevFormResetGenRef.current = formResetGeneration;
      return;
    }
    const genBumped =
      prevFormResetGenRef.current !== null && prevFormResetGenRef.current !== formResetGeneration;
    prevFormResetGenRef.current = formResetGeneration;

    if (genBumped) setLoteMortalidadManual(false);
    if (!genBumped && loteMortalidadManual) return;

    setForm((prev) => {
      const next = loteMortalidadPorDefecto;
      const cur =
        prev.mortalidad.lote_id != null && prev.mortalidad.lote_id !== ''
          ? String(prev.mortalidad.lote_id)
          : '';
      if (cur === next) return prev;
      return { ...prev, mortalidad: { ...prev.mortalidad, lote_id: next } };
    });
  }, [formResetGeneration, editingMortalidadId, loteMortalidadManual, loteMortalidadPorDefecto, setForm]);

  return (
    <article className="card">
      <h3>{isEditing ? 'Editar mortalidad' : 'Registrar mortalidad'}</h3>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="mortalidad-fecha">
          Fecha
        </label>
        <input
          id="mortalidad-fecha"
          type="date"
          value={form.mortalidad.fecha}
          onChange={(e) => setForm({ ...form, mortalidad: { ...form.mortalidad, fecha: e.target.value } })}
        />
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="mortalidad-lote">
          Lote
        </label>
        <select
          id="mortalidad-lote"
          className={inputClass('mortalidad.lote_id')}
          value={
            form.mortalidad.lote_id === '' || form.mortalidad.lote_id == null
              ? ''
              : String(form.mortalidad.lote_id)
          }
          disabled={isEditing}
          onChange={(e) => {
            setLoteMortalidadManual(true);
            setForm({ ...form, mortalidad: { ...form.mortalidad, lote_id: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'mortalidad.lote_id': '' }));
          }}
        >
          <option value="">Seleccionar…</option>
          {lotesOrdenados.map((lote) => (
            <option key={lote.id} value={String(lote.id)}>
              Lote {lote.numero_lote} — disponibles {lote.disponibles}
            </option>
          ))}
        </select>
        {fieldErrors['mortalidad.lote_id'] && <p className="field-error">{fieldErrors['mortalidad.lote_id']}</p>}
      </div>
      {isEditing && (
        <p className="lists-hint" style={{ margin: '0 0 8px' }}>
          El lote no se puede cambiar al editar. Crea un registro nuevo si aplicó a otro lote.
        </p>
      )}
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="mortalidad-cantidad">
          Cantidad (pollos)
        </label>
        <input
          id="mortalidad-cantidad"
          className={inputClass('mortalidad.cantidad')}
          inputMode="numeric"
          autoComplete="off"
          value={form.mortalidad.cantidad}
          onChange={(e) => {
            setForm({ ...form, mortalidad: { ...form.mortalidad, cantidad: e.target.value } });
            setFieldErrors((prev) => ({ ...prev, 'mortalidad.cantidad': '' }));
          }}
        />
        {fieldErrors['mortalidad.cantidad'] && <p className="field-error">{fieldErrors['mortalidad.cantidad']}</p>}
      </div>
      <div className="form-field-stack">
        <label className="form-field-label" htmlFor="mortalidad-motivo">
          Motivo (opcional)
        </label>
        <input
          id="mortalidad-motivo"
          autoComplete="off"
          value={form.mortalidad.motivo}
          onChange={(e) => setForm({ ...form, mortalidad: { ...form.mortalidad, motivo: e.target.value } })}
        />
      </div>
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="ghost-btn" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
        <button type="button" onClick={handleMortalidad}>
          {isEditing ? 'Actualizar mortalidad' : 'Guardar mortalidad'}
        </button>
      </div>
    </article>
  );
}

export default MortalidadForm;
