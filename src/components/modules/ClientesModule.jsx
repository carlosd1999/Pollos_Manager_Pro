import ClienteForm from '../forms/ClienteForm';
import ClientesList from '../lists/ClientesList';

export default function ClientesModule(props) {
  const {
    form,
    fieldErrors,
    inputClass,
    setForm,
    setFieldErrors,
    handleCliente,
    editingClienteId,
    cancelOperacionesEdit,
    data,
    startEditCliente,
    confirmDeleteCliente,
  } = props;

  return (
    <section className="module-split">
      <div className="module-form">
        <ClienteForm
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          inputClass={inputClass}
          setFieldErrors={setFieldErrors}
          handleCliente={handleCliente}
          editingClienteId={editingClienteId}
          onCancelEdit={cancelOperacionesEdit}
        />
      </div>
      <div className="module-table">
        <ClientesList data={data} startEditCliente={startEditCliente} confirmDeleteCliente={confirmDeleteCliente} />
      </div>
    </section>
  );
}
