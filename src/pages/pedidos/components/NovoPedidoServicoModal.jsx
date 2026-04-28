import { useState, useEffect, useRef, Fragment } from "react";
import PropTypes from "prop-types";
import {
  Briefcase,
  Plus,
  AlertCircle,
  User,
  ClipboardList,
} from "lucide-react";
import Api from "../../../api/client/Api";
import { cpfMask, phoneMask, onlyLetters } from "../../../utils/masks";
import FeedbackModal from "../../../components/feedback/FeedbackModal/FeedbackModal";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import {
  pedidoServicoEtapa0Schema,
  pedidoServicoEtapa2Schema,
  zodFirstError,
} from "../../../lib/schemas";
import { modalClasses } from "../../../components/ui/modal/modalStyles";

const usePedidoServicoAPI = () => {
  const cadastrarCliente = async (clienteData) => {
    try {
      const response = await Api.post(`/clientes`, {
        nome: clienteData.nome,
        cpf: clienteData.cpf || "",
        email: clienteData.email || "",
        telefone: clienteData.telefone ? clienteData.telefone.replace(/\D/g, "") : "",
        status: "Ativo",
        enderecos: clienteData.enderecos || [],
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao cadastrar cliente",
      );
    }
  };

  const salvarServico = async (servicoData) => {
    try {
      const response = await Api.post(`/pedidos`, servicoData, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao salvar servico");
    }
  };

  const buscarClientes = async () => {
    try {
      const response = await Api.get(`/clientes`);
      const data = response.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao buscar clientes");
    }
  };

  return { cadastrarCliente, salvarServico, buscarClientes };
};

const DEFAULT_FORM_DATA = {
  tipoCliente: "",
  clienteId: "",
  clienteNome: "",
  servicos: [],
  etapa: "PENDENTE",
  prioridade: "Normal",
};

const NovoPedidoServicoModal = ({
  isOpen,
  onClose,
  onSuccess,
  clienteInicial,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientesExistentes, setClientesExistentes] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { cadastrarCliente, salvarServico, buscarClientes } =
    usePedidoServicoAPI();

  const steps = [
    { id: 0, name: "Cliente" },
    { id: 1, name: "Servico" },
    { id: 2, name: "Revisao" },
  ];

  useEffect(() => {
    if (!isOpen) return;

    setFormData(
      clienteInicial
        ? {
            ...DEFAULT_FORM_DATA,
            tipoCliente: "existente",
            clienteId: clienteInicial.id ?? "",
            clienteNome: clienteInicial.nome ?? "",
          }
        : DEFAULT_FORM_DATA,
    );
    setCurrentStep(0);
    setError(null);
    setShowSuccessModal(false);

    const carregarDados = async () => {
      try {
        const clientes = await buscarClientes();
        setClientesExistentes(Array.isArray(clientes) ? clientes : []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setClientesExistentes([]);
      }
    };

    carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clienteInicial]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "clienteNome" ? onlyLetters(value) : value,
    }));
    setError(null);
  };

  const handleTipoClienteChange = (tipo) => {
    setFormData((prev) => ({
      ...prev,
      tipoCliente: tipo,
      clienteId: "",
      clienteNome: "",
    }));
    setError(null);
  };

  const handleClienteExistenteChange = (e) => {
    const id = e.target.value;
    const selecionado = clientesExistentes.find(
      (cliente) => String(cliente.id) === String(id),
    );

    setFormData((prev) => ({
      ...prev,
      clienteId: selecionado?.id ?? "",
      clienteNome: selecionado?.nome ?? "",
    }));
    setError(null);
  };

  const handleServicoChange = (index, field, value) => {
    setFormData((prev) => {
      const proximosServicos =
        prev.servicos.length > index
          ? [...prev.servicos]
          : [...prev.servicos, { nome: "", descricao: "", precoEstimado: 0 }];

      proximosServicos[index] = {
        ...proximosServicos[index],
        [field]: field === "precoEstimado" ? parseFloat(value) || 0 : value,
      };

      return { ...prev, servicos: proximosServicos };
    });
    setError(null);
  };

  const calcularValorTotal = () =>
    formData.servicos.reduce((total, servico) => total + (servico.precoEstimado || 0), 0);

  const validateStep = () => {
    setError(null);

    if (currentStep === 0 && !formData.tipoCliente) {
      setError("Selecione como o cliente sera informado");
      return false;
    }

    const schemas = [
      pedidoServicoEtapa0Schema,
      pedidoServicoEtapa2Schema,
    ];

    const schema = schemas[currentStep];
    if (!schema) return true;

    const result = schema.safeParse(formData);
    if (!result.success) {
      setError(zodFirstError(result.error));
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSave = async () => {
    if (!validateStep()) return;

    setLoading(true);

    try {
      let clienteData = null;

      if (formData.tipoCliente === "novo") {
        clienteData = await cadastrarCliente({
          nome: formData.clienteNome,
          cpf: "",
          email: "",
          telefone: "",
          enderecos: [],
        });
      } else {
        clienteData = clientesExistentes.find(
          (cliente) => String(cliente.id) === String(formData.clienteId),
        );
      }

      const total = calcularValorTotal();
      const pedidoData = {
        pedido: {
          valorTotal: total,
          ativo: true,
          clienteId: clienteData.id,
          status: { tipo: "PEDIDO", nome: "ATIVO" },
        },
        servico: {
          nome: formData.servicos[0]?.nome || "Servico personalizado",
          descricao:
            formData.servicos.map((servico) => servico.descricao || servico.nome).join("; ") ||
            formData.servicos[0]?.nome ||
            "Servico personalizado",
          precoBase: total,
          ativo: true,
          etapaNome: formData.etapa,
        },
      };

      const salvo = await salvarServico(pedidoData);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        onSuccess?.(salvo);
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || "Erro ao salvar servico");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={modalClasses.overlay} onClick={onClose}>
        <div
          className={`${modalClasses.panel} flex max-h-[92vh] max-w-4xl flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={modalClasses.header}>
            <div className="flex items-center gap-3">
              <div className={modalClasses.headerIcon}>
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h2 className={modalClasses.headerTitle}>Novo Pedido de Servico</h2>
              </div>
            </div>
          </div>

          <div className={modalClasses.stepperSection}>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <Fragment key={step.id}>
                  <div className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                        index <= currentStep
                          ? "bg-[#007EA7] text-white shadow-md"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`mt-2 text-center text-sm ${
                        index <= currentStep
                          ? "font-semibold text-gray-900"
                          : "font-medium text-gray-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`mx-3 mb-6 h-1 flex-1 rounded-full ${
                        index < currentStep ? "bg-[#007EA7]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex w-full justify-center px-6 pt-5 sm:px-8">
            {error && (
              <div className={`${modalClasses.errorAlert} mb-4 w-full`}>
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erro</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className={`${modalClasses.body} flex flex-col`}>
            {currentStep === 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    Cliente
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Escolha um cliente existente ou cadastre um novo para este pedido.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleTipoClienteChange("existente")}
                    className={`flex-1 rounded-md border px-4 py-4 shadow-sm transition-all hover:shadow-md ${
                      formData.tipoCliente === "existente"
                        ? "border-[#007EA7] bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-5 w-5 text-[#007EA7]" />
                      <p className="text-sm font-semibold text-gray-900">
                        Cliente Existente
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTipoClienteChange("novo")}
                    className={`flex-1 rounded-md border px-4 py-4 shadow-sm transition-all hover:shadow-md ${
                      formData.tipoCliente === "novo"
                        ? "border-[#007EA7] bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="h-5 w-5 text-[#007EA7]" />
                      <p className="text-sm font-semibold text-gray-900">
                        Cadastrar Novo
                      </p>
                    </div>
                  </button>
                </div>

                {!formData.tipoCliente && (
                  <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                      Selecione uma opcao acima para continuar.
                    </p>
                  </div>
                )}

                {formData.tipoCliente === "existente" && (
                  <UniversalInput
                    as="select"
                    label="Selecionar Cliente"
                    placeholder="Selecione um cliente"
                    options={clientesExistentes.map((cliente) => ({
                      value: String(cliente.id),
                      label: cliente.nome,
                    }))}
                    value={formData.clienteId}
                    onChange={handleClienteExistenteChange}
                  />
                )}

                {formData.tipoCliente === "novo" && (
                  <div className="flex flex-col gap-3">
                    <UniversalInput
                      name="clienteNome"
                      label="Nome Completo"
                      placeholder="Digite o nome completo"
                      value={formData.clienteNome}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    Informacoes do Servico
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Preencha o servico principal e a estimativa de valor.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-[#007EA7]" />
                    <span className="text-sm font-semibold text-slate-800">
                      Servico
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <UniversalInput
                      label="Nome do Servico"
                      placeholder="Digite a descrição do serviço."
                      value={formData.servicos[0]?.nome ?? ""}
                      onChange={(e) =>
                        handleServicoChange(0, "nome", e.target.value)
                      }
                    />

                    <UniversalInput
                      as="textarea"
                      label="Descricao"
                      rows={4}
                      placeholder="Digite a descrição do serviço"
                      value={formData.servicos[0]?.descricao ?? ""}
                      onChange={(e) =>
                        handleServicoChange(0, "descricao", e.target.value)
                      }
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <UniversalInput
                        type="number"
                        label="Preco Estimado"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={formData.servicos[0]?.precoEstimado || 0}
                        onChange={(e) =>
                          handleServicoChange(0, "precoEstimado", e.target.value)
                        }
                      />

                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm text-slate-500">Total estimado</p>
                        <p className="mt-1 text-2xl font-bold text-[#007EA7]">
                          R$ {calcularValorTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    Revisao do Pedido
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Confira os dados antes de concluir o cadastro.
                  </p>
                </div>

                <div className="rounded-md border bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-[#007EA7]" />
                    <h4 className="font-semibold text-gray-900">Cliente</h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Nome:</strong> {formData.clienteNome || "Nao informado"}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#007EA7]" />
                    <h4 className="font-semibold text-gray-900">Servico</h4>
                  </div>

                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <strong>Nome:</strong> {formData.servicos[0]?.nome || "-"}
                    </p>
                    {formData.servicos[0]?.descricao && (
                      <p>
                        <strong>Descricao:</strong> {formData.servicos[0].descricao}
                      </p>
                    )}
                    <div className="border-t pt-3">
                      <p className="text-base font-semibold text-gray-900">
                        Total:{" "}
                        <span className="text-[#007EA7]">
                          R$ {calcularValorTotal().toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={modalClasses.footer}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  disabled={loading}
                >
                  Voltar
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Próxima Etapa
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar Pedido"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <FeedbackModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          type="success"
          title="Pedido Criado!"
          description="Seu pedido de servico foi cadastrado com sucesso!"
          duration={2500}
        />
      )}
    </>
  );
};

NovoPedidoServicoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  clienteInicial: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nome: PropTypes.string,
    cpf: PropTypes.string,
    email: PropTypes.string,
    telefone: PropTypes.string,
    enderecos: PropTypes.arrayOf(
      PropTypes.shape({
        cep: PropTypes.string,
        rua: PropTypes.string,
        complemento: PropTypes.string,
        bairro: PropTypes.string,
        cidade: PropTypes.string,
        uf: PropTypes.string,
      }),
    ),
  }),
};

export default NovoPedidoServicoModal;
