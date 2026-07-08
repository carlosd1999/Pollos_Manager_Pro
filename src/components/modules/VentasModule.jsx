import VentaForm from '../forms/VentaForm';
import VentasList from '../lists/VentasList';
import { MODULE_FORM_SCROLL_TARGET_ID } from '../../lib/scrollUi';

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
    toggleVentaEntregada,
    guardarRepartoGastosObjetivo,
    liquidarRepartoBucket,
    deshacerUltimoRepartoPago,
    formResetGeneration,
    currentUserFullName,
    isAdmin,
  } = props;

  return (
    <section className="module-split">
      <div className="module-form" id={MODULE_FORM_SCROLL_TARGET_ID}>
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
          currentUserFullName={currentUserFullName}
          onCancelEdit={cancelOperacionesEdit}
          isAdmin={isAdmin}
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
          toggleVentaEntregada={toggleVentaEntregada}
          guardarRepartoGastosObjetivo={guardarRepartoGastosObjetivo}
          liquidarRepartoBucket={liquidarRepartoBucket}
          deshacerUltimoRepartoPago={deshacerUltimoRepartoPago}
          filtroCicloLabel={vistaCicloLabel}  
          isAdmin={isAdmin}
        />
      </div>
    </section>
  );
}
