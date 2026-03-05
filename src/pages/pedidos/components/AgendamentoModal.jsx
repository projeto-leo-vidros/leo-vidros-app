import { useState } from "react";
import { Calendar, Clock, X, Save } from "lucide-react";
import Button from "../../../components/ui/Button/Button.component";

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
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Data do Agendamento *
            </label>
            <div className="relative">
              <input
                type="date"
                name="dataAgendamento"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007EA7] focus:border-transparent"
                value={formData.dataAgendamento}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Hora do Agendamento */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Hora do Agendamento *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                name="horaAgendamento"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007EA7] focus:border-transparent"
                value={formData.horaAgendamento}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Observações (opcional)
            </label>
            <textarea
              name="observacoes"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#007EA7] focus:border-transparent"
              placeholder="Adicione informações adicionais sobre o agendamento..."
              value={formData.observacoes}
              onChange={handleChange}
            />
          </div>
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
