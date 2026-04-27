import { useState, useEffect, Fragment } from "react";
import PropTypes from "prop-types";
import {
  Wrench,
  Plus,
  AlertCircle,
  MapPin,
  User,
  FileText, 
} from "lucide-react";
import Api from "../../../api/client/Api";
import axios from "axios";
import Button from "../../../components/ui/Button/Button.component";
import { modalClasses } from "../../../../components/ui/modal/modalStyles";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import {
  cpfMask,
  phoneMask,
  cepMask,
  onlyLetters,
  removeMask,
} from "../../../utils/masks";

const viaCepApi = axios.create({
  baseURL: "https://viacep.com.br/ws",
  timeout: 5000,
});

const useServicoAPI = () => {
  const cadastrarCliente = async (clienteData) => {
    try {
      const response = await Api.post(`/clientes`, {
        nome: clienteData.nome,
        cpf: clienteData.cpf,
        email: clienteData.email,
        telefone: clienteData.telefone.replace(/\D/g, ""),
        status: "Ativo",
        enderecos: [
          {
            rua: clienteData.rua,
            numero: clienteData.numero || "",
            complemento: clienteData.complemento || "",
            cep: clienteData.cep,
            cidade: clienteData.cidade,
            bairro: clienteData.bairro,
            uf: clienteData.uf,
            pais: "Brasil",
          },
        ],
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
      const response = await Api.post(`/servicos`, {
        clienteId: servicoData.clienteId,
        clienteNome: servicoData.clienteNome,
        descricao: servicoData.descricao,
        observacoes: servicoData.observacoes,
        data: servicoData.data,
        status: "Ativo",
        etapa: "Aguardando orçamento",
        progresso: [1, 6],
        endereco: servicoData.endereco,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao salvar serviço",
      );
    }
  };

  const buscarClientes = async () => {
    try {
      const response = await Api.get(`/clientes`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar clientes",
      );
    }
  };

  const buscarClientePorId = async (id) => {
    try {
      const response = await Api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar dados do cliente",
      );
    }
  };

  const buscarCep = async (cep) => {
    try {
      const response = await viaCepApi.get(`/${cep}/json/`);
      const data = response.data;
      if (data.erro) {
        throw new Error("CEP não encontrado");
      }
      return data;
    } catch (err) { // <-- Alterado e logado para não acusar erro de não uso
      console.error(err);
      throw new Error("Erro ao buscar CEP");
    }
  };

  return { cadastrarCliente, salvarServico, buscarClientes, buscarClientePorId, buscarCep };
};

const DEFAULT_FORM_DATA = {
  tipoCliente: "",
  clienteId: "",
  clienteNome: "",
  clienteCpf: "",
  clienteEmail: "",
  clienteTelefone: "",
  cep: "",
  rua: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  descricao: "",
  data: new Date().toISOString().split("T")[0],
  observacoes: "",
};

const NovoServicoModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientesExistentes, setClientesExistentes] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);

  const { cadastrarCliente, salvarServico, buscarClientes, buscarClientePorId, buscarCep } =
    useServicoAPI();

  const steps = [
    { id: 0, name: "Cliente" },
    { id: 1, name: "Endereço" },
    { id: 2, name: "Dados do Serviço" },
    { id: 3, name: "Revisão" },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA);
      setCurrentStep(0);
      setError(null);
      carregarClientes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const carregarClientes = async () => {
    try {
      const clientes = await buscarClientes();
      setClientesExistentes(clientes);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setClientesExistentes([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === "clienteCpf") {
      maskedValue = cpfMask(value);
    } else if (name === "clienteTelefone") {
      maskedValue = phoneMask(value);
    } else if (name === "cep") {
      maskedValue = cepMask(value);
    } else if (name === "clienteNome") {
      maskedValue = onlyLetters(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: maskedValue,
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
    const clienteId = e.target.value;

    if (!clienteId) {
      setFormData((prev) => ({ ...prev, clienteId: "", clienteNome: "" }));
      setError(null);
      return;
    }

    const clienteBasico = clientesExistentes.find(
      (c) => String(c.id) === String(clienteId),
    );

    if (clienteBasico) {
      setFormData((prev) => ({
        ...prev,
        clienteId: clienteBasico.id,
        clienteNome: clienteBasico.nome,
        clienteCpf: clienteBasico.cpf || "",
        clienteEmail: clienteBasico.email || "",
        clienteTelefone: clienteBasico.telefone || "",
      }));
    }

    try {
      const clienteCompleto = await buscarClientePorId(clienteId);
      const enderecoPrincipal = clienteCompleto.enderecos?.[0] || {};
      setFormData((prev) => ({
        ...prev,
        clienteId: clienteCompleto.id,
        clienteNome: clienteCompleto.nome,
        clienteCpf: clienteCompleto.cpf || "",
        clienteEmail: clienteCompleto.email || "",
        clienteTelefone: clienteCompleto.telefone || "",
        cep: enderecoPrincipal.cep || "",
        rua: enderecoPrincipal.rua || "",
        bairro: enderecoPrincipal.bairro || "",
        cidade: enderecoPrincipal.cidade || "",
        uf: enderecoPrincipal.uf || "",
        complemento: enderecoPrincipal.complemento || "",
      }));
    } catch (err) {
      console.error("Erro ao buscar endereço do cliente:", err);
    }

    setError(null);
  };

  const handleBuscarCep = async () => {
    const cepLimpo = removeMask(formData.cep);
    if (cepLimpo.length !== 8) {
      setError("CEP inválido");
      return;
    }

    setLoadingCep(true);
    setError(null);

    try {
      const dadosCep = await buscarCep(cepLimpo);
      setFormData((prev) => ({
        ...prev,
        rua: dadosCep.logradouro || "",
        bairro: dadosCep.bairro || "",
        cidade: dadosCep.localidade || "",
        uf: dadosCep.uf || "",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCep(false);
    }
  };

  const validateStep = () => {
    setError(null);

    if (currentStep === 0) {
      if (!formData.tipoCliente) {
        setError("Selecione o tipo de cliente: existente ou novo");
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
    }

    if (currentStep === 1) {
      if (!formData.cep.trim()) {
        setError("CEP é obrigatório");
        return false;
      }
      if (!formData.rua.trim()) {
        setError("Rua é obrigatória");
        return false;
      }
      if (!formData.bairro.trim()) {
        setError("Bairro é obrigatório");
        return false;
      }
      if (!formData.cidade.trim()) {
        setError("Cidade é obrigatória");
        return false;
      }
      if (!formData.uf.trim()) {
        setError("UF é obrigatório");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.descricao.trim()) {
        setError("Descrição do serviço é obrigatória");
        return false;
      }
      if (!formData.data) {
        setError("Data é obrigatória");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      let clienteId = formData.clienteId;
      let clienteNome = formData.clienteNome;

      if (formData.tipoCliente === "novo") {
        const novoCliente = await cadastrarCliente({
          nome: formData.clienteNome,
          cpf: formData.clienteCpf,
          email: formData.clienteEmail,
          telefone: formData.clienteTelefone,
          rua: formData.rua,
          complemento: formData.complemento,
          cep: formData.cep,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
        });
        clienteId = novoCliente.id;
        clienteNome = novoCliente.nome;
      }

      const enderecoCompleto = `${formData.rua}${
        formData.complemento ? ", " + formData.complemento : ""
      } - ${formData.bairro}, ${formData.cidade}/${formData.uf} - CEP: ${
        formData.cep
      }`;

      const servicoSalvo = await salvarServico({
        clienteId,
        clienteNome,
        descricao: formData.descricao,
        data: formData.data,
        endereco: enderecoCompleto,
        observacoes: formData.observacoes,
      });

      if (onSuccess) {
        onSuccess(servicoSalvo);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao salvar serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center px-3 sm:px-10 py-4 overflow-y-auto z-[1300]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[130vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start px-8 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <Wrench className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              Novo Pedido de Serviço
            </h2>
          </div>
        </div>

        <div className="px-8 pt-7 pb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index <= currentStep
                        ? "bg-[#007EA7] text-white shadow-md"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-sm mt-3 text-center ${
                      index <= currentStep
                        ? "text-gray-900 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mb-8 mx-3 rounded-full ${
                      index < currentStep ? "bg-[#007EA7]" : "bg-gray-200"
                    }`}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="flex justify-center w-full px-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex flex-row items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center gap-2">
                <p className="text-sm font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col px-8 py-4">
          {currentStep === 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-left flex flex-col gap-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Informações do Cliente
                </h3>
                <p className="text-md text-gray-500 mt-1">
                  Selecione um cliente existente ou cadastre um novo
                </p>
              </div>

              <div className="flex gap-6 py-3">
                <button
                  type="button"
                  onClick={() => handleTipoClienteChange("existente")}
                  className={`
                                        px-5 py-3 rounded-md border transition-all
                                        flex items-center justify-center gap-2 cursor-pointer
                                        shadow-sm hover:shadow-md
                                        ${
                                          formData.tipoCliente === "existente"
                                            ? "border-[#007EA7] bg-blue-50"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                >
                  <User className="w-5 h-6 text-[#007EA7]" />
                  <p className="text-md font-semibold text-gray-900">
                    Cliente Existente
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTipoClienteChange("novo")}
                  className={`
                                        px-5 py-1 rounded-md border transition-all
                                        flex items-center justify-center gap-2 cursor-pointer
                                        shadow-sm hover:shadow-md
                                        ${
                                          formData.tipoCliente === "novo"
                                            ? "border-[#007EA7] bg-blue-50"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                >
                  <Plus className="w-6 h-6 text-[#007EA7]" />
                  <p className="text-md font-semibold text-gray-900">
                    Novo Cliente
                  </p>
                </button>
              </div>

              {formData.tipoCliente === "existente" && (
                <UniversalInput
                  as="select"
                  label="Selecionar Cliente"
                  name="clienteId"
                  value={formData.clienteId}
                  onChange={handleClienteExistenteChange}
                  placeholder="Selecione um cliente"
                  options={clientesExistentes.map((cliente) => ({
                    value: String(cliente.id),
                    label: cliente.nome,
                  }))}
                />
              )}

              {formData.tipoCliente === "novo" && (
                <div className="flex flex-col gap-4">
                  <UniversalInput
                    label="Nome Completo"
                    name="clienteNome"
                    placeholder="Digite o nome completo"
                    value={formData.clienteNome}
                    onChange={handleChange}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <UniversalInput
                      label="CPF"
                      name="clienteCpf"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={formData.clienteCpf}
                      onChange={handleChange}
                      required
                    />

                    <UniversalInput
                      label="Telefone"
                      name="clienteTelefone"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      value={formData.clienteTelefone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <UniversalInput
                    label="E-mail"
                    type="email"
                    name="clienteEmail"
                    placeholder="nome@exemplo.com"
                    value={formData.clienteEmail}
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
                  Endereço do Serviço
                </h3>
                <p className="text-md text-gray-500 mt-1">
                  Informe onde o serviço será realizado
                </p>
              </div>

              <div className="flex flex-row gap-12 items-end">
                <UniversalInput
                  label="CEP"
                  name="cep"
                  placeholder="00000-000"
                  maxLength={9}
                  value={formData.cep}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleBuscarCep}
                  disabled={loadingCep}
                >
                  {loadingCep ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <UniversalInput
                  label="Rua"
                  name="rua"
                  placeholder="Digite a rua"
                  value={formData.rua}
                  onChange={handleChange}
                  required
                  wrapperClassName="col-span-3"
                />
              </div>

              <UniversalInput
                label="Complemento"
                name="complemento"
                placeholder="Digite o complemento"
                value={formData.complemento}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UniversalInput
                  label="Bairro"
                  name="bairro"
                  placeholder="Digite o bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  required
                />

                <UniversalInput
                  label="Cidade"
                  name="cidade"
                  placeholder="Digite a cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  required
                />
              </div>

              <UniversalInput
                as="select"
                label="UF"
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                placeholder="Selecione a UF"
                required
                options={[
                  { value: "AC", label: "AC" },
                  { value: "AL", label: "AL" },
                  { value: "AP", label: "AP" },
                  { value: "AM", label: "AM" },
                  { value: "BA", label: "BA" },
                  { value: "CE", label: "CE" },
                  { value: "DF", label: "DF" },
                  { value: "ES", label: "ES" },
                  { value: "GO", label: "GO" },
                  { value: "MA", label: "MA" },
                  { value: "MT", label: "MT" },
                  { value: "MS", label: "MS" },
                  { value: "MG", label: "MG" },
                  { value: "PA", label: "PA" },
                  { value: "PB", label: "PB" },
                  { value: "PR", label: "PR" },
                  { value: "PE", label: "PE" },
                  { value: "PI", label: "PI" },
                  { value: "RJ", label: "RJ" },
                  { value: "RN", label: "RN" },
                  { value: "RS", label: "RS" },
                  { value: "RO", label: "RO" },
                  { value: "RR", label: "RR" },
                  { value: "SC", label: "SC" },
                  { value: "SP", label: "SP" },
                  { value: "SE", label: "SE" },
                  { value: "TO", label: "TO" },
                ]}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Dados do Serviço
                </h3>
                <p className="text-md text-gray-500 mt-1">
                  Descreva o serviço a ser realizado
                </p>
              </div>

              <UniversalInput
                label="Data de Lançamento no sistema (Hoje)"
                type="date"
                name="data"
                value={formData.data}
                readOnly
              />

              <UniversalInput
                as="textarea"
                label="Descrição do Serviço"
                name="descricao"
                placeholder="Digite a descrição do serviço"
                rows={6}
                value={formData.descricao}
                onChange={handleChange}
                required
              />

              <UniversalInput
                as="textarea"
                label="O que será feito neste serviço"
                name="observacoes"
                placeholder="Digite as observações do serviço"
                rows={4}
                value={formData.observacoes}
                onChange={handleChange}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-md font-semibold text-black">
                      Status Inicial
                    </p>
                    <p className="text-md text-yellow-700 mt-1">
                      Este serviço será criado com o status{" "}
                      <span className="font-semibold">
                        &quot;Aguardando orçamento&quot;
                      </span>
                      . Você poderá alterar o status posteriormente no modal de
                      edição.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Revisão dos Dados
                </h3>
                <p className="text-md text-gray-500 mt-1">
                  Confirme as informações antes de salvar
                </p>
              </div>

              <div className="flex flex-col gap-3 bg-gray-50 rounded-md p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-[#007EA7]" />
                  <h4 className="font-semibold text-gray-900">Cliente</h4>
                </div>
                <div className="flex items-center gap-4 mb-3 text">
                  <div className="flex flex-row justify-start gap-1">
                    <span className="text-gray-600 font-medium">Nome:</span>
                    <span className="font-medium text-gray-900">
                      {formData.clienteNome || "N/A"}
                    </span>
                  </div>
                  {formData.clienteCpf && (
                    <div className="flex flex-row justify-start gap-1">
                      <span className="text-gray-600 font-medium">CPF:</span>
                      <span className="font-medium text-gray-900">
                        {formData.clienteCpf}
                      </span>
                    </div>
                  )}
                  {formData.clienteTelefone && (
                    <div className="flex flex-row justify-start gap-1">
                      <span className="text-gray-600 font-medium">
                        Telefone:
                      </span>
                      <span className="font-medium text-gray-900">
                        {formData.clienteTelefone}
                      </span>
                    </div>
                  )}
                  {formData.clienteEmail && (
                    <div className="flex flex-row justify-start gap-1">
                      <span className="text-gray-600 font-medium">E-mail:</span>
                      <span className="font-medium text-gray-900">
                        {formData.clienteEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 bg-gray-50 rounded-md p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-[#007EA7]" />
                  <h4 className="font-semibold text-gray-900">Endereço</h4>
                </div>
                <div className="text-md text-gray-900 flex flex-col gap-1 items-start">
                  <p className="font-medium">
                    {formData.rua}
                    {formData.complemento && `, ${formData.complemento}`}
                  </p>
                  <p>
                    {formData.bairro} - {formData.cidade}/{formData.uf}
                  </p>
                  <p className="text-gray-800 font-medium">
                    CEP: {formData.cep}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 bg-gray-50 rounded-md p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-[#007EA7]" />
                  <h4 className="font-semibold text-gray-900">Serviço</h4>
                </div>
                <div className="flex flex-col gap-2 items-start text-md">
                  <div className="flex justify-between gap-1">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(formData.data + "T00:00:00").toLocaleDateString(
                        "pt-BR",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="text-md font-medium text-black">
                      Aguardando orçamento
                    </span>
                  </div>
                  <div className="flex gap-1 mt-3 pt-3 border-t">
                    <p className="text-gray-600 mb-1">Descrição:</p>
                    <p className="font-semibold text-gray-900">
                      {formData.descricao}
                    </p>
                  </div>
                  {formData.observacoes && (
                    <div className="flex gap-1 mt-2">
                      <p className="text-gray-600 mb-1">Execução:</p>
                      <p className="font-semibold text-gray-900">
                        {formData.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-3 border-t bg-gray-50 flex justify-between">
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
                onClick={() => setCurrentStep(currentStep - 1)}
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
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>Salvar Serviço</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

NovoServicoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default NovoServicoModal;
