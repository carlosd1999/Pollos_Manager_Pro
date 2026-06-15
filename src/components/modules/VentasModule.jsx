import VentaForm from '../forms/VentaForm';
import VentasList from '../lists/VentasList';

export default function VentasModule(props) {
  const {
    form,
    data,
    dataVista,
    vistaCicloLabel,
    lotesWithAvailability,
    fieldErrors,
    inputClass,
    setForm,
    setFieldErrors,
    handleVenta,
    editingVentaId,
    cancelOperacionesEdit,
    startEditVenta,
    confirmDeleteVenta,
    submitAbono,
    confirmDeleteAbono,
    formResetGeneration,
  } = props;

  return (
    <section className="module-split">
      <div className="module-form">
        <VentaForm
          form={form}
          setForm={setForm}
          data={data}
          lotesWithAvailability={lotesWithAvailability}
          fieldErrors={fieldErrors}
          inputClass={inputClass}
          setFieldErrors={setFieldErrors}
          handleVenta={handleVenta}
          editingVentaId={editingVentaId}
          formResetGeneration={formResetGeneration}
          onCancelEdit={cancelOperacionesEdit}
        />
      </div>
      <div className="module-table">
        <VentasList
          data={dataVista}
          lotesWithAvailability={lotesWithAvailability}
          startEditVenta={startEditVenta}
          confirmDeleteVenta={confirmDeleteVenta}
          submitAbono={submitAbono}
          confirmDeleteAbono={confirmDeleteAbono}
          filtroCicloLabel={vistaCicloLabel}
        />
      </div>
    </section>
  );
}
