import MortalidadForm from '../forms/MortalidadForm';
import MortalidadList from '../lists/MortalidadList';

export default function MortalidadModule(props) {
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
    handleMortalidad,
    editingMortalidadId,
    cancelOperacionesEdit,
    startEditMortalidad,
    confirmDeleteMortalidad,
    formResetGeneration,
  } = props;

  return (
    <section className="module-split">
      <div className="module-form">
        <MortalidadForm
          form={form}
          setForm={setForm}
          lotesWithAvailability={lotesWithAvailability}
          fieldErrors={fieldErrors}
          inputClass={inputClass}
          setFieldErrors={setFieldErrors}
          handleMortalidad={handleMortalidad}
          editingMortalidadId={editingMortalidadId}
          formResetGeneration={formResetGeneration}
          onCancelEdit={cancelOperacionesEdit}
        />
      </div>
      <div className="module-table">
        <MortalidadList
          data={dataVista}
          startEditMortalidad={startEditMortalidad}
          confirmDeleteMortalidad={confirmDeleteMortalidad}
          filtroCicloLabel={vistaCicloLabel}
        />
      </div>
    </section>
  );
}
