import { useState, useEffect, Fragment } from "react";
import PropTypes from "prop-types";
import {
  Briefcase,
  Plus,
  AlertCircle,
  User,
} from "lucide-react";
import Api from "../../../api/client/Api";
import { cpfMask, phoneMask, onlyLetters, cepMask } from "../../../utils/masks";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import {
  pedidoServicoEtapa0Schema,
  pedidoServicoEtapa1Schema,
  pedidoServicoEtapa2Schema,
  zodFirstError,
} from "../../../lib/schemas";

const usePedidoServicoAPI = () => {
  const cadastrarCliente = async (clienteData) => {
    try {
      const response = await Api.post(`/clientes`, {
        nome: clienteData.nome,
        cpf: clienteData.cpf,
        email: clienteData.email,
        telefone: clienteData.telefone.replace(/\D/g, ""),
        status: "Ativo",
        enderecos: clienteData.enderecos || [],
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao cadastrar cliente");
    }
  };

  const salvarServico = async (servicoData) => {
    try {
      const response = await Api.post(`/pedidos`, servicoData, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao salvar serviço");
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
  clienteCpf: "",
  clienteEmail: "",
  clienteTelefone: "",
  endereco: {
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  },
  servicos: [],
  etapa: "PENDENTE",
  prioridade: "Normal",
};

const NovoPedidoServicoModal = ({ isOpen, onClose, onSuccess, clienteInicial }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientesExistentes, setClientesExistentes] = useState([]);

  const { cadastrarCliente, salvarServico, buscarClientes } = usePedidoServicoAPI();

  const steps = [
    { id: 0, name: "Cliente" },
    { id: 1, name: "Endereço" },
    { id: 2, name: "Serviços" },
    { id: 3, name: "Revisão" },
  ];

  useEffect(() => {
    if (isOpen) {
      const endereco = clienteInicial?.enderecos?.[0] || {};
      setFormData(
        clienteInicial
          ? {
              ...DEFAULT_FORM_DATA,
              tipoCliente: "existente",
              clienteId: clienteInicial.id ?? "",
              clienteNome: clienteInicial.nome ?? "",
              clienteCpf: clienteInicial.cpf ?? "",
              clienteEmail: clienteInicial.email ?? "",
              clienteTelefone: clienteInicial.telefone ?? "",
              endereco: {
                cep: endereco.cep ?? "",
                rua: endereco.rua ?? "",
                numero: endereco.numero ? String(endereco.numero) : "",
                complemento: endereco.complemento ?? "",
                bairro: endereco.bairro ?? "",
                cidade: endereco.cidade ?? "",
                uf: endereco.uf ?? "",
              },
            }
          : DEFAULT_FORM_DATA,
      );
      setCurrentStep(0);
      setError(null);
      const carregarDados = async () => {
        try {
          const clientes = await buscarClientes();
          setClientesExistentes(Array.isArray(clientes) ? clientes : []);
        } catch (err) {
          console.error("Erro ao carregar dados:", err);
        }
      };
      carregarDados();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === "clienteCpf") maskedValue = cpfMask(value);
    else if (name === "clienteTelefone") maskedValue = phoneMask(value);
    else if (name === "clienteNome") maskedValue = onlyLetters(value);

    setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    setError(null);
  };

  const handleEnderecoChange = (e) => {
    const { name, value } = e.target;
    const maskedValue = name === "cep" ? cepMask(value) : value;

    setFormData((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [name]: maskedValue },
    }));
    setError(null);
  };

  const handleTipoClienteChange = (tipo) => {
    setFormData((prev) => ({
      ...prev,
      tipoCliente: tipo,
      clienteId: "",
      clienteNome: "",
      clienteCpf: "",
      clienteEmail: "",
      clienteTelefone: "",
    }));
    setError(null);
  };

  const handleClienteExistenteChange = async (e) => {
    const id = e.target.value;
    if (!id) return;
    const selecionado = clientesExistentes.find((c) => String(c.id) === String(id));
    if (!selecionado) return;

    setFormData((prev) => ({
      ...prev,
      clienteId: selecionado.id,
      clienteNome: selecionado.nome,
      clienteCpf: selecionado.cpf || "",
      clienteEmail: selecionado.email || "",
      clienteTelefone: selecionado.telefone || "",
    }));

    // Fetch full client to get addresses (list endpoint may omit them)
    try {
      const response = await Api.get(`/clientes/${id}`);
      const clienteCompleto = response.data;
      const end = clienteCompleto.enderecos?.[0] || selecionado.enderecos?.[0] || {};
      setFormData((prev) => ({
        ...prev,
        endereco: {
          cep: end.cep || "",
          rua: end.rua || "",
          numero: end.numero?.toString() || "",
          complemento: end.complemento || "",
          bairro: end.bairro || "",
          cidade: end.cidade || "",
          uf: end.uf || "",
        },
      }));
    } catch {
      const end = selecionado.enderecos?.[0] || {};
      setFormData((prev) => ({
        ...prev,
        endereco: {
          cep: end.cep || "",
          rua: end.rua || "",
          numero: end.numero?.toString() || "",
          complemento: end.complemento || "",
          bairro: end.bairro || "",
          cidade: end.cidade || "",
          uf: end.uf || "",
        },
      }));
    }
    setError(null);
  };

  const handleAddServico = () => {
    setFormData((prev) => ({
      ...prev,
      servicos: [...prev.servicos, { nome: "", descricao: "", precoEstimado: 0 }],
    }));
  };

  const handleServicoChange = (index, field, value) => {
    setFormData((prev) => {
      const novos = prev.servicos.length > index
        ? [...prev.servicos]
        : [...prev.servicos, { nome: "", descricao: "", precoEstimado: 0 }];
      novos[index] = { ...novos[index], [field]: value };
      return { ...prev, servicos: novos };
    });
  };

  const calcularValorTotal = () => formData.servicos.reduce((t, s) => t + (s.precoEstimado || 0), 0);

  const validateStep = () => {
    setError(null);

    if (currentStep === 0) {
      if (!formData.tipoCliente) {
        setError("Selecione o tipo de cliente: existente ou novo");
        return false;
      }

      if (formData.tipoCliente === "nenhum") {
        setError("Selecione o tipo de cliente");
        return false;
      }

      if (formData.tipoCliente === "existente") {
        if (!formData.clienteId) {
          setError("Selecione um cliente");
          return false;
        }
      } else {
        if (!formData.clienteNome.trim()) {
          setError("Nome do cliente é obrigatório");
          return false;
        }
        if (!formData.clienteTelefone.trim()) {
          setError("Telefone do cliente é obrigatório");
          return false;
        }
      }
      return true;
    }

    const schemas = [pedidoServicoEtapa0Schema, pedidoServicoEtapa1Schema, pedidoServicoEtapa2Schema];
    const schema = schemas[currentStep];
    if (!schema) return true;

    const result = schema.safeParse(formData);
    if (!result.success) {
      setError(zodFirstError(result.error));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateStep()) return;
    setLoading(true);

    try {
      let clienteData = null;

      if (formData.tipoCliente === "novo") {
        clienteData = await cadastrarCliente({
          nome: formData.clienteNome,
          cpf: formData.clienteCpf,
          email: formData.clienteEmail,
          telefone: formData.clienteTelefone,
          enderecos: [{
            ...formData.endereco,
            pais: "Brasil",
            numero: parseInt(formData.endereco.numero) || 0
          }],
        });
      } else {
        clienteData = clientesExistentes.find((c) => String(c.id) === String(formData.clienteId));
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
          nome: formData.servicos[0]?.nome || "Serviço personalizado",
          descricao: formData.servicos.map((s) => s.descricao || s.nome).join("; ") || formData.servicos[0]?.nome || "Serviço personalizado",
          precoBase: total,
          ativo: true,
          etapaNome: formData.etapa,
        },
      };

      const salvo = await salvarServico(pedidoData);
      onSuccess?.(salvo);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1300] px-3 sm:px-10 py-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center px-8 py-4 border-b border-gray-200">
          <div className="bg-[#eeeeee] p-2.5 rounded-lg mr-3"><Briefcase className="w-6 h-6 text-[#828282]" /></div>
          <h2 className="text-xl font-semibold text-gray-900">Novo Pedido de Serviço</h2>
        </div>

        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${index <= currentStep ? "bg-[#007EA7] text-white" : "bg-gray-200 text-gray-500"}`}>
                    {index + 1}
                  </div>
                  <span className={`text-sm mt-2 ${index <= currentStep ? "text-gray-900 font-semibold" : "text-gray-500"}`}>{step.name}</span>
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-1 mb-6 mx-3 rounded-full ${index < currentStep ? "bg-[#007EA7]" : "bg-gray-200"}`} />}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="px-8 flex flex-col gap-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <button onClick={() => handleTipoClienteChange("existente")} className={`flex-1 p-4 border rounded-lg flex items-center gap-2 ${formData.tipoCliente === "existente" ? "border-[#007EA7] bg-blue-50" : "bg-white"}`}>
                  <User className="text-[#007EA7]" /> Cliente Existente
                </button>
                <button onClick={() => handleTipoClienteChange("novo")} className={`flex-1 p-4 border rounded-lg flex items-center gap-2 ${formData.tipoCliente === "novo" ? "border-[#007EA7] bg-blue-50" : "bg-white"}`}>
                  <Plus className="text-[#007EA7]" /> Novo Cliente
                </button>
              </div>

              {!formData.tipoCliente && (
                <div className="rounded-md border border-dashed border-gray-300 p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Escolha uma opção acima para preencher os dados do cliente.
                  </p>
                </div>
              )}

              {formData.tipoCliente === "existente" && (
                <UniversalInput
                  as="select"
                  placeholder="Selecione um cliente..."
                  options={clientesExistentes.map(c => ({ value: String(c.id), label: c.nome }))}
                  value={formData.clienteId}
                  onChange={handleClienteExistenteChange}
                />
              )}

              {formData.tipoCliente === "novo" && (
                <div className="grid gap-4">
                  <UniversalInput name="clienteNome" label="Nome Completo" placeholder="Nome Completo" value={formData.clienteNome} onChange={handleChange} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UniversalInput name="clienteCpf" label="CPF" placeholder="CPF" value={formData.clienteCpf} onChange={handleChange} />
                    <UniversalInput name="clienteTelefone" label="Telefone" placeholder="Telefone" value={formData.clienteTelefone} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-3 gap-4">
              <UniversalInput name="cep" label="CEP" placeholder="CEP" value={formData.endereco.cep} onChange={handleEnderecoChange} />
              <UniversalInput name="rua" label="Rua" placeholder="Rua" wrapperClassName="col-span-2" value={formData.endereco.rua} onChange={handleEnderecoChange} />
              <UniversalInput name="numero" label="Nº" placeholder="Nº" value={formData.endereco.numero} onChange={handleEnderecoChange} />
              <UniversalInput name="bairro" label="Bairro" placeholder="Bairro" value={formData.endereco.bairro} onChange={handleEnderecoChange} />
              <UniversalInput name="cidade" label="Cidade" placeholder="Cidade" value={formData.endereco.cidade} onChange={handleEnderecoChange} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50 space-y-4 flex flex-col">
                <h4 className="font-semibold text-gray-900">Informações do Serviço</h4>
                <div className="w-full">
                  <UniversalInput label="Nome do serviço" placeholder="Nome do serviço" value={formData.servicos[0]?.nome ?? ""} onChange={e => handleServicoChange(0, "nome", e.target.value)} />
                </div>
                <div className="w-full">
                  <UniversalInput type="number" label="Preço" placeholder="Preço" value={formData.servicos[0]?.precoEstimado || 0} onChange={e => handleServicoChange(0, "precoEstimado", parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Cliente</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {formData.clienteNome}</p>
                  {formData.clienteCpf && <p><strong>CPF:</strong> {formData.clienteCpf}</p>}
                  {formData.clienteTelefone && <p><strong>Telefone:</strong> {formData.clienteTelefone}</p>}
                  {formData.clienteEmail && <p><strong>E-mail:</strong> {formData.clienteEmail}</p>}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Endereço</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Rua:</strong> {formData.endereco.rua}, {formData.endereco.numero}</p>
                  {formData.endereco.complemento && <p><strong>Complemento:</strong> {formData.endereco.complemento}</p>}
                  <p><strong>Bairro:</strong> {formData.endereco.bairro}</p>
                  <p><strong>Cidade/UF:</strong> {formData.endereco.cidade}/{formData.endereco.uf}</p>
                  <p><strong>CEP:</strong> {formData.endereco.cep}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Serviços</h4>
                <div className="space-y-2 text-sm">
                  {formData.servicos.map((s, i) => (
                    <div key={i} className="p-2 border border-gray-200 rounded">
                      <p><strong>{s.nome}</strong> - R$ {s.precoEstimado?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                  <p className="font-semibold mt-3 pt-3 border-t"><strong>Total:</strong> R$ {calcularValorTotal().toFixed(2)}</p>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="px-8 py-4 border-t bg-gray-50 flex justify-between">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <div className="flex gap-3">
            {currentStep > 0 && <Button variant="secondary" onClick={() => setCurrentStep(c => c - 1)}>Voltar</Button>}
            <Button variant="primary" onClick={currentStep < 3 ? () => validateStep() && setCurrentStep(c => c + 1) : handleSave}>
              {loading ? "Salvando..." : currentStep < 3 ? "Próximo" : "Salvar Pedido"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

NovoPedidoServicoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default NovoPedidoServicoModal;