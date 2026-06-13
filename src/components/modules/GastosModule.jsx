import GastoForm from '../forms/GastoForm';
import GastosList from '../lists/GastosList';

export default function GastosModule(props) {
  const {
    form,
    data,
    dataVista,
    vistaCicloLabel,
    fieldErrors,
    inputClass,
    setForm,
    setFieldErrors,
    handleGasto,
    purchaseCategory,
    editingGastoId,
    cancelOperacionesEdit,
    startEditGasto,
    confirmDeleteGasto,
    siguienteLoteCompra,
  } = props;

  const editingGasto = editingGastoId ? data.gastos.find((g) => g.id === editingGastoId) : null;
  const lockPurchaseFields = Boolean(editingGasto?.lote_id);

  return (
    <section className="module-split">
      <div className="module-form">
        <GastoForm
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          inputClass={inputClass}
          setFieldErrors={setFieldErrors}
          handleGasto={handleGasto}
          purchaseCategory={purchaseCategory}
          lockPurchaseFields={lockPurchaseFields}
          editingGastoId={editingGastoId}
          onCancelEdit={cancelOperacionesEdit}
          ciclos={data.ciclos || []}
          siguienteLoteCompra={siguienteLoteCompra}
        />
      </div>
      <div className="module-table">
        <GastosList
          data={dataVista}
          startEditGasto={startEditGasto}
          confirmDeleteGasto={confirmDeleteGasto}
          filtroCicloLabel={vistaCicloLabel}
        />
      </div>
    </section>
  );
}
