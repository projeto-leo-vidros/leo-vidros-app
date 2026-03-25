import { useState } from "react";
import { Calendar, Clock, X, Save } from "lucide-react";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";

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

  const handleSave = () => {
    // Validação básica
    if (!formData.dataAgendamento || !formData.horaAgendamento) {
      alert("Por favor, preencha a data e hora do agendamento.");
      return;
    }

    onSave(formData);
    onClose();
    // Limpar formulário
    setFormData({
      dataAgendamento: "",
      horaAgendamento: "",
      observacoes: "",
    });
  };

  const handleCancel = () => {
    setFormData({
      dataAgendamento: "",
      horaAgendamento: "",
      observacoes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#007EA7]">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-[#007EA7]" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Agendar Serviço
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 hover:bg-[#006891] rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Para continuar com o orçamento, é necessário agendar uma data para o
            serviço.
          </p>

          {/* Data do Agendamento */}
          <UniversalInput
            type="date"
            label="Data do Agendamento"
            required
            name="dataAgendamento"
            value={formData.dataAgendamento}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
          />

          {/* Hora do Agendamento */}
          <UniversalInput
            type="time"
            label="Hora do Agendamento"
            required
            name="horaAgendamento"
            startIcon={<Clock className="w-5 h-5" />}
            value={formData.horaAgendamento}
            onChange={handleChange}
          />

          {/* Observações */}
          <UniversalInput
            as="textarea"
            label="Observações (opcional)"
            name="observacoes"
            rows={3}
            placeholder="Adicione informações adicionais sobre o agendamento..."
            value={formData.observacoes}
            onChange={handleChange}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
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
