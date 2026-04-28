import { useState } from "react";
import { Calendar, Clock, Save } from "lucide-react";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import { modalClasses } from "../../../components/ui/modal/modalStyles";
import Swal from "sweetalert2";

const AgendamentoModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    dataAgendamento: "",
    horaAgendamento: "",
    observacoes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      dataAgendamento: "",
      horaAgendamento: "",
      observacoes: "",
    });
  };

  const handleSave = () => {
    if (!formData.dataAgendamento || !formData.horaAgendamento) {
      Swal.fire({ icon: "warning", title: "Campos obrigatórios", text: "Por favor, preencha a data e hora do agendamento.", confirmButtonColor: "#2563eb" });
      return;
    }

    onSave(formData);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={modalClasses.overlay} onClick={onClose}>
      <div
        className={`${modalClasses.panel} w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className={modalClasses.headerTitle}>Agendar Servico</h2>
              <p className={modalClasses.headerSubtitle}>
                Defina a data e hora para prosseguir.
              </p>
            </div>
          </div>
        </div>

        <div className={modalClasses.body}>
          <p className="mb-4 text-sm text-gray-600">
            Para continuar com o orcamento, e necessario agendar uma data para o
            servico.
          </p>

          <div className="space-y-4">
            <UniversalInput
              type="date"
              label="Data do Agendamento"
              required
              name="dataAgendamento"
              value={formData.dataAgendamento}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />

            <UniversalInput
              type="time"
              label="Hora do Agendamento"
              required
              name="horaAgendamento"
              startIcon={<Clock className="w-5 h-5" />}
              value={formData.horaAgendamento}
              onChange={handleChange}
            />

            <UniversalInput
              as="textarea"
              label="Observacoes (opcional)"
              name="observacoes"
              rows={3}
              placeholder="Digite as observações do agendamento"
              value={formData.observacoes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={modalClasses.footer}>
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            startIcon={<Save className="w-4 h-4" />}
          >
            Confirmar Agendamento
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoModal;
