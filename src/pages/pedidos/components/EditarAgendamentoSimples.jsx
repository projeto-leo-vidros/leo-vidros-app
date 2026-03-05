import { useState, useEffect } from "react";
import { Calendar, Clock, X, Save, AlertCircle } from "lucide-react";
import agendamentosService from "../../../api/services/agendamentosService";
import Button from "../../../components/ui/Button/Button.component";

const EditarAgendamentoSimples = ({
  isOpen,
  onClose,
  agendamento,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    dataAgendamento: "",
    inicioAgendamento: "",
    fimAgendamento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && agendamento) {
      setFormData({
        dataAgendamento: agendamento.dataAgendamento?.split("T")[0] || "",
        inicioAgendamento: agendamento.inicioAgendamento?.substring(0, 5) || "",
        fimAgendamento: agendamento.fimAgendamento?.substring(0, 5) || "",
      });
      setError(null);
    }
  }, [isOpen, agendamento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (
      !formData.dataAgendamento ||
      !formData.inicioAgendamento ||
      !formData.fimAgendamento
    ) {
      setError(
        "Por favor, preencha a data, horário de início e fim do agendamento.",
      );
      return;
    }

    if (formData.inicioAgendamento >= formData.fimAgendamento) {
      setError("O horário de fim deve ser posterior ao horário de início.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Converter horários para formato HH:mm:ss
      const formatTimeToHHmmss = (timeStr) => {
        if (!timeStr) return "00:00:00";
        const [hour = "00", minute = "00"] = timeStr.split(":");
        return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
      };

      const agendamentoData = {
        tipoAgendamento: agendamento.tipoAgendamento,
        dataAgendamento: formData.dataAgendamento,
        inicioAgendamento: formatTimeToHHmmss(formData.inicioAgendamento),
        fimAgendamento: formatTimeToHHmmss(formData.fimAgendamento),
      };

      const updateResult = await agendamentosService.update(
        agendamento.id,
        agendamentoData,
      );
      if (!updateResult.success)
        throw new Error(updateResult.error || "Erro ao atualizar agendamento");

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("❌ Erro ao atualizar agendamento:", err);
      setError(
        err.response?.data?.message ||
          "Erro ao atualizar agendamento. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      dataAgendamento: "",
      inicioAgendamento: "",
      fimAgendamento: "",
    });
    setError(null);
    onClose();
  };

  if (!isOpen || !agendamento) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center px-4 z-50"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-linear-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Editar Data e Horário
              </h2>
              <p className="text-blue-100 text-sm">
                Agendamento #{agendamento.id?.toString().padStart(3, "0")}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Conteúdo */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Edite apenas a data e horários do agendamento.
          </p>

          {/* Data do Agendamento */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Data do Agendamento *
            </label>
            <input
              type="date"
              name="dataAgendamento"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.dataAgendamento}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Horário de Início */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Horário de Início *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                name="inicioAgendamento"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.inicioAgendamento}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Horário de Fim */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Horário de Término *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                name="fimAgendamento"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.fimAgendamento}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            startIcon={!loading ? <Save className="w-4 h-4" /> : undefined}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditarAgendamentoSimples;
