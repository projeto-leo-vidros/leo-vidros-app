import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  X,
  Save,
  AlertCircle,
  MessageSquare,
  Tag,
} from "lucide-react";
import agendamentosService from "../../../api/services/agendamentosService";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import { StatusAgendamento } from "../../../types/enums";

const EditarAgendamentoSimples = ({
  isOpen,
  onClose,
  onCancel,
  agendamento,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    dataAgendamento: "",
    inicioAgendamento: "",
    fimAgendamento: "",
    statusAgendamento: "PENDENTE",
    observacao: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && agendamento) {
      setFormData({
        dataAgendamento: agendamento.dataAgendamento?.split("T")[0] || "",
        inicioAgendamento: agendamento.inicioAgendamento?.substring(0, 5) || "",
        fimAgendamento: agendamento.fimAgendamento?.substring(0, 5) || "",
        statusAgendamento: agendamento.statusAgendamento?.nome || "PENDENTE",
        observacao:
          agendamento.observacao &&
          agendamento.observacao !== "Agendamento criado pelo sistema"
            ? agendamento.observacao
            : "",
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
        statusAgendamento: {
          tipo: "StatusAgendamento",
          nome: formData.statusAgendamento,
        },
        observacao:
          formData.observacao.trim() || "Agendamento criado pelo sistema",
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
      statusAgendamento: "PENDENTE",
      observacao: "",
    });
    setError(null);
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  if (!isOpen || !agendamento) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4 shadow-xl backdrop-blur-sm"
      onClick={handleCancel}
    >
        <div
          className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          
            <div className="absolute top-0 left-0 h-1.5 w-full bg-[#134074ff]" />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 bg-white px-7 pt-7 pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 pb-2 text-start text-2xl leading-tight font-bold text-[#134074ff]">
                  <Calendar size={22} strokeWidth={2.5} />
                  Editar Agendamento
                </div>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Ref.: #{agendamento.id?.toString().padStart(3, "0")} —
                  Modifique as informações necessárias abaixo.
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="cursor-pointer rounded-full bg-gray-50 p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mx-7 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            {/* Conteúdo */}
            <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto px-7 py-6">
              {/* Card: Dados Principais */}
              <div className="flex flex-col gap-5 rounded-2xl border border-[#134074ff]/10 bg-[#134074ff]/[0.02] p-6">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#134074ff]/70 uppercase">
                  Informações de Tempo
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <UniversalInput
                    label="Data do Agendamento"
                    required
                    type="date"
                    name="dataAgendamento"
                    value={formData.dataAgendamento}
                    onChange={handleChange}
                    wrapperClassName="border-[#134074ff]/10 "
                  />
                  <div className="flex gap-4">
                    <UniversalInput
                      label="Início"
                      required
                      type="time"
                      name="inicioAgendamento"
                      startIcon={<Clock className="h-4 w-4 text-gray-400" />}
                      value={formData.inicioAgendamento}
                      onChange={handleChange}
                      wrapperClassName="flex-1 border-[#134074ff]/10"
                    />
                    <UniversalInput
                      label="Término"
                      required
                      type="time"
                      name="fimAgendamento"
                      startIcon={<Clock className="h-4 w-4 text-gray-400" />}
                      value={formData.fimAgendamento}
                      onChange={handleChange}
                      wrapperClassName="flex-1 border-[#134074ff]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Card: Status e Detalhes */}
              <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-gray-50/50 p-6">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Controle e Detalhes
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="block flex flex-row items-center gap-2 pb-1.5 text-sm font-semibold text-gray-700">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Tag className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        name="statusAgendamento"
                        value={formData.statusAgendamento}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        {Object.values(StatusAgendamento).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block flex flex-row items-center gap-2 pb-1.5 text-sm font-semibold text-gray-700">
                      Observação
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute top-3 left-3">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      </div>
                      <textarea
                        name="observacao"
                        value={formData.observacao}
                        onChange={handleChange}
                        placeholder="Adicione notas ou observações importantes sobre o agendamento..."
                        className="block min-h-[100px] w-full resize-y rounded-md border border-gray-300 bg-white py-2.5 pr-3 pl-10 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2 flex flex-wrap-reverse items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/70 px-7 py-5 sm:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="w-full border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-100 sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-[#134074ff] font-bold text-white hover:bg-[#0c2e59] sm:w-auto"
                startIcon={!loading ? <Save className="h-4 w-4" /> : undefined}
              >
                {loading ? "Salvando Alterações..." : "Salvar Alterações"}
              </Button>
            </div>
        </div>
    </div>
  );
};

export default EditarAgendamentoSimples;
