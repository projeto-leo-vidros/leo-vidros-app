import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { IMaskInput } from "react-imask";
import Button from "../../../../components/ui/Button/Button.component";
import UniversalInput from "../../../../components/ui/Input/UniversalInput";
import { modalClasses } from "../../../../components/ui/modal/modalStyles";
import Swal from "sweetalert2";

const CONTRATO_REGISTRADO = "Registrado";
const CONTRATO_TEMPORARIO = "Temporário";

const getEscalaPorContrato = (contrato) =>
  contrato === CONTRATO_TEMPORARIO ? "Sem Escala Definida" : "5x2";

const getFuncionarioInicial = () => ({
  nome: "",
  telefone: "",
  funcao: "",
  escala: getEscalaPorContrato(CONTRATO_REGISTRADO),
  contrato: CONTRATO_REGISTRADO,
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
      const contrato = funcionario.contrato || CONTRATO_REGISTRADO;

      setNovoFuncionario({
        nome: funcionario.nome || "",
        telefone: funcionario.telefone || "",
        funcao: funcionario.funcao || "",
        escala: funcionario.escala || getEscalaPorContrato(contrato),
        contrato,
        status: funcionario.status === "Ativo" || funcionario.status === true,
      });
    } else {
      setNovoFuncionario(getFuncionarioInicial());
    }
  }, [modoEdicao, funcionario, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setNovoFuncionario((prev) => {
      if (name === "contrato") {
        return {
          ...prev,
          contrato: value,
          escala: getEscalaPorContrato(value),
        };
      }

      return { ...prev, [name]: value };
    });
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
      Swal.fire({ icon: "warning", title: "Campo obrigatório", text: "Por favor, informe o nome do funcionário.", confirmButtonColor: "#2563eb" });
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
    <div className={modalClasses.overlay} onClick={handleClose}>
      <div
        className={`${modalClasses.panel} flex max-h-[92vh] max-w-3xl flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <User className="h-6 w-6" />
            </div>
            <h2 className={modalClasses.headerTitle}>
              {modoEdicao ? "Editar Funcionário" : "Adicionar novo funcionário"}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div
            className={`${modalClasses.body} flex flex-1 flex-col gap-9 space-y-6`}
          >
            <div className="flex flex-col gap-5 space-y-4">
              <h3 className="flex items-start text-lg font-bold text-gray-700">
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UniversalInput
                  label="Nome"
                  required
                  name="nome"
                  placeholder="Ex: João Silva"
                  value={novoFuncionario.nome}
                  onChange={handleChange}
                />

                <UniversalInput label="Telefone" required>
                  <IMaskInput
                    mask="(00) 00000-0000"
                    name="telefone"
                    placeholder="Ex: (11) 91234-5678"
                    value={novoFuncionario.telefone}
                    onAccept={(value) =>
                      handleChange({ target: { name: "telefone", value } })
                    }
                  />
                </UniversalInput>

                <UniversalInput
                  label="Função"
                  required
                  name="funcao"
                  placeholder="Ex: Cozinheiro"
                  value={novoFuncionario.funcao}
                  onChange={handleChange}
                />

                <UniversalInput
                  as="select"
                  label="Tipo de Contrato"
                  required
                  name="contrato"
                  value={novoFuncionario.contrato}
                  onChange={handleChange}
                  options={[
                    { value: CONTRATO_REGISTRADO, label: CONTRATO_REGISTRADO },
                    { value: CONTRATO_TEMPORARIO, label: CONTRATO_TEMPORARIO },
                  ]}
                />

                <UniversalInput
                  label="Escala"
                  required
                  name="escala"
                  value={novoFuncionario.escala}
                  readOnly
                  wrapperClassName="col-span-2"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 space-y-4">
              <h3 className="flex items-start text-md font-semibold text-gray-700">
                Status do Contrato
              </h3>

              <div className="flex items-center gap-3">
                <UniversalInput
                  as="toggle"
                  label={`Funcionário ativo (Status: ${novoFuncionario.status ? "Ativo" : "Inativo"})`}
                  checked={novoFuncionario.status}
                  onChange={handleSwitchChange}
                />
              </div>
            </div>
          </div>

          <div className={modalClasses.footer}>
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {modoEdicao ? "Salvar Alterações" : "Criar Funcionário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
