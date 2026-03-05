import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  X,
  Save,
} from "lucide-react";
import { IMaskInput } from "react-imask";
import Button from "../../../../components/ui/Button/Button.component";

const getFuncionarioInicial = () => ({
  nome: "",
  telefone: "",
  funcao: "",
  escala: "",
  contrato: "Registrado",
  status: true,
});

export default function FuncionarioForm({
  open,
  setOpen,
  modoEdicao,
  funcionario,
  salvarFuncionario,
}) {
  const [novoFuncionario, setNovoFuncionario] = useState(
    getFuncionarioInicial(),
  );

  useEffect(() => {
    if (modoEdicao && funcionario) {
      setNovoFuncionario({
        nome: funcionario.nome || "",
        telefone: funcionario.telefone || "",
        funcao: funcionario.funcao || "",
        escala: funcionario.escala || "",
        contrato: funcionario.contrato || "Registrado",
        status: funcionario.status === "Ativo" || funcionario.status === true,
      });
    } else {
      setNovoFuncionario(getFuncionarioInicial());
    }
  }, [modoEdicao, funcionario, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoFuncionario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    setNovoFuncionario((prev) => ({
      ...prev,
      status: e.target.checked,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!novoFuncionario.nome.trim()) {
      alert("Digite o nome do funcionário.");
      return;
    }
    salvarFuncionario(novoFuncionario);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setNovoFuncionario(getFuncionarioInicial());
    }, 300);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-start px-10 py-20 overflow-y-auto z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-[#eeeeee] p-2.5 rounded-lg">
              <User className="w-6 h-6 text-[#828282]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {modoEdicao ? "Editar Funcionário" : "Adicionar novo funcionário"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-col gap-9 px-6 py-4 space-y-6 flex-1 overflow-y-auto">
            {/* Informações Básicas */}
            <div className="flex flex-col gap-5 space-y-4">
              <h3 className="flex items-start text-lg font-bold text-gray-700">
                Informações Básicas
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-start text-sm font-medium text-gray-700">
                    Nome: <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="nome"
                    placeholder="Ex: João Silva"
                    value={novoFuncionario.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-start text-sm font-medium text-gray-700">
                    Telefone: <span className="text-red-500">*</span>
                  </label>
                  <IMaskInput
                    required
                    mask="(00) 00000-0000"
                    name="telefone"
                    placeholder="Ex: (11) 91234-5678"
                    value={novoFuncionario.telefone}
                    onAccept={(value) =>
                      handleChange({ target: { name: "telefone", value } })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-start text-sm font-medium text-gray-700">
                    Função: <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="funcao"
                    placeholder="Ex: Cozinheiro"
                    value={novoFuncionario.funcao}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-start text-sm font-medium text-gray-700">
                    Tipo de Contrato: <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="contrato"
                    value={novoFuncionario.contrato}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] cursor-pointer"
                  >
                    <option value="Registrado">Registrado</option>
                    <option value="Fixo">Fixo</option>
                    <option value="Temporário">Temporário</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 col-span-2">
                  <label className="flex items-start text-sm font-medium text-gray-700">
                    Escala:
                  </label>
                  <input
                    type="text"
                    name="escala"
                    placeholder="Ex: 6x1 - 08h00 às 17h00"
                    value={novoFuncionario.escala}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-3 space-y-4">
              <h3 className="flex items-start text-md font-semibold text-gray-700">
                Status do Contrato
              </h3>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoFuncionario.status}
                    onChange={handleSwitchChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007EA7]"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">
                  Funcionário ativo (Status:{" "}
                  {novoFuncionario.status ? "Ativo" : "Inativo"})
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              startIcon={<Save className="w-4 h-4" />}
            >
              {modoEdicao ? "Salvar Alterações" : "Criar Funcionário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
