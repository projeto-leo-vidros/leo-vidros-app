import { useState, useEffect, Fragment } from "react"; // Importado Fragment
import PropTypes from "prop-types"; // Importado PropTypes
import {
  ShoppingCart,
  Plus,
  AlertCircle,
  User,
  Package,
  Trash2,
} from "lucide-react";
import Api from "../../../api/client/Api";
import {
  cpfMask,
  phoneMask,
  onlyLetters,
} from "../../../utils/masks";
import FeedbackModal from "../../../components/feedback/FeedbackModal/FeedbackModal";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import {
  pedidoProdutoEtapa0Schema,
  pedidoProdutoEtapa1Schema,
  pedidoProdutoEtapa2Schema,
  zodFirstError,
} from "../../../lib/schemas";
import { modalClasses } from "../../../components/ui/modal/modalStyles";

const usePedidoAPI = () => {
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
      throw new Error(
        error.response?.data?.message || "Erro ao cadastrar cliente",
      );
    }
  };

  const cadastrarClienteAvulso = async (nomeCliente) => {
    try {
      const response = await Api.post(`/clientes`, {
        nome: nomeCliente,
        cpf: "",
        email: "",
        telefone: "",
        status: "Avulso",
        enderecos: [
          {
            rua: "",
            complemento: "",
            cep: "",
            cidade: "",
            bairro: "",
            uf: "",
            pais: "Brasil",
            numero: 0,
          },
        ],
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao cadastrar cliente avulso",
      );
    }
  };

  const salvarPedido = async (pedidoData) => {
    try {
      const response = await Api.post(`/pedidos`, pedidoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao salvar pedido");
    }
  };

  const buscarClientes = async () => {
    try {
      const response = await Api.get(`/clientes`);
      const data = response.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar clientes",
      );
    }
  };

  const buscarProdutos = async () => {
    try {
      const response = await Api.get(`/produtos`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar produtos",
      );
    }
  };

  return {
    cadastrarCliente,
    cadastrarClienteAvulso,
    salvarPedido,
    buscarClientes,
    buscarProdutos,
  };
};

const METODOS_COM_PARCELA = ["Cartão de crédito"];

const DEFAULT_FORM_DATA = {
  tipoCliente: "nenhum",
  clienteId: "",
  clienteNome: "",
  clienteCpf: "",
  clienteEmail: "",
  clienteTelefone: "",
  produtos: [],
  descricao: "",
  formaPagamento: "Pix",
  parcelas: 1,
  data: new Date().toISOString().split("T")[0],
};

const NovoPedidoModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientesExistentes, setClientesExistentes] = useState([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    cadastrarCliente,
    cadastrarClienteAvulso,
    salvarPedido,
    buscarClientes,
    buscarProdutos,
  } = usePedidoAPI();

  const steps = [
    { id: 0, name: "Cliente" },
    { id: 1, name: "Produtos" },
    { id: 2, name: "Pagamento" },
    { id: 3, name: "Revisão" },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA);
      setCurrentStep(0);
      setError(null);
      carregarDados();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const carregarDados = async () => {
    try {
      const [clientes, produtos] = await Promise.all([
        buscarClientes(),
        buscarProdutos(),
      ]);

      const listaProdutos = Array.isArray(produtos)
        ? produtos
        : produtos?.content ?? [];

      setClientesExistentes(Array.isArray(clientes) ? clientes : []);
      setProdutosDisponiveis(listaProdutos);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setClientesExistentes([]);
      setProdutosDisponiveis([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === "clienteCpf") {
      maskedValue = cpfMask(value);
    } else if (name === "clienteTelefone") {
      maskedValue = phoneMask(value);
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

  const handleClienteExistenteChange = (e) => {
    const clienteIdValue = e.target.value;
    const clienteSelecionado = clientesExistentes.find(
      (c) => String(c.id) === String(clienteIdValue),
    );

    if (clienteSelecionado) {
      setFormData((prev) => ({
        ...prev,
        clienteId: clienteSelecionado.id,
        clienteNome: clienteSelecionado.nome,
        clienteCpf: clienteSelecionado.cpf || "",
        clienteEmail: clienteSelecionado.email || "",
        clienteTelefone: clienteSelecionado.telefone || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clienteId: "",
        clienteNome: "",
        clienteCpf: "",
        clienteEmail: "",
        clienteTelefone: "",
      }));
    }
    setError(null);
  };

  const handleAddProduto = () => {
    setFormData((prev) => ({
      ...prev,
      produtos: [
        ...prev.produtos,
        { produtoId: "", nome: "", quantidade: 1, preco: 0, subtotal: 0 },
      ],
    }));
  };

  const handleRemoveProduto = (index) => {
    setFormData((prev) => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index),
    }));
  };

  const handleProdutoChange = (index, field, value) => {
    setFormData((prev) => {
      const novosProdutos = [...prev.produtos];

      if (field === "produtoId") {
        const produtoSelecionado = produtosDisponiveis.find(
          (p) => String(p.id) === String(value),
        );

        if (produtoSelecionado) {
          novosProdutos[index] = {
            ...novosProdutos[index],
            produtoId: produtoSelecionado.id,
            nome: produtoSelecionado.nome,
            preco: produtoSelecionado.preco || 0,
            subtotal:
              (produtoSelecionado.preco || 0) * novosProdutos[index].quantidade,
          };
        }
      } else if (field === "quantidade") {
        const quantidade = parseInt(value) || 1;
        novosProdutos[index] = {
          ...novosProdutos[index],
          quantidade,
          subtotal: quantidade * novosProdutos[index].preco,
        };
      } else if (field === "preco") {
        const preco = parseFloat(value) || 0;
        novosProdutos[index] = {
          ...novosProdutos[index],
          preco,
          subtotal: preco * novosProdutos[index].quantidade,
        };
      } else {
        novosProdutos[index] = {
          ...novosProdutos[index],
          [field]: value,
        };
      }

      return { ...prev, produtos: novosProdutos };
    });
  };

  const calcularValorTotal = () => {
    return formData.produtos.reduce(
      (total, produto) => total + (produto.subtotal || 0),
      0,
    );
  };

  const validateStep = () => {
    setError(null);

    if (currentStep === 1) {
      if (formData.produtos.length === 0) {
        setError("Adicione pelo menos um produto");
        return false;
      }

      const hasIncompleteProduct = formData.produtos.some(
        (produto) => !produto.produtoId || !String(produto.produtoId).trim(),
      );

      if (hasIncompleteProduct) {
        setError(
          "Preencha as informações do produto adicionado antes de avançar",
        );
        return false;
      }
    }

    const schemas = [
      pedidoProdutoEtapa0Schema,
      pedidoProdutoEtapa1Schema,
      pedidoProdutoEtapa2Schema,
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

  const handleSave = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      let clienteData = null;

      if (formData.tipoCliente === "novo") {
        const novoCliente = await cadastrarCliente({
          nome: formData.clienteNome,
          cpf: formData.clienteCpf,
          email: formData.clienteEmail,
          telefone: formData.clienteTelefone,
          enderecos: [
            {
              rua: "",
              complemento: "",
              cep: "",
              cidade: "",
              bairro: "",
              uf: "",
              pais: "Brasil",
              numero: 0,
            },
          ],
        });

        clienteData = novoCliente;
      } else if (formData.tipoCliente === "existente") {
        clienteData = clientesExistentes.find(
          (c) => String(c.id) === String(formData.clienteId),
        );
      } else {
        clienteData = await cadastrarClienteAvulso(
          formData.clienteNome,
        );
      }

      const pedidoData = {
        pedido: {
          valorTotal: calcularValorTotal(),
          ativo: true,
          formaPagamento:
            METODOS_COM_PARCELA.includes(formData.formaPagamento) && formData.parcelas > 1
              ? `${formData.formaPagamento} - ${formData.parcelas}x`
              : formData.formaPagamento,
          observacao: formData.descricao || "",
          clienteId: clienteData.id,
          status: {
            tipo: "PEDIDO",
            nome: "ATIVO",
          },
        },
        produtos: formData.produtos.map((produto) => ({
          estoqueId: produto.produtoId,
          quantidadeSolicitada: produto.quantidade,
          precoUnitarioNegociado: produto.preco,
          observacao: "",
        })),
      };

      const pedidoSalvo = await salvarPedido(pedidoData);

      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        if (onSuccess) {
          onSuccess(pedidoSalvo);
        }
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || "Erro ao salvar pedido");
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
    <>
      <div
        className={modalClasses.overlay}
        onClick={onClose}
      >
        <div
          className={`${modalClasses.panel} flex max-h-[92vh] max-w-4xl flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={modalClasses.header}>
            <div className="flex items-center gap-3">
                <div className={modalClasses.headerIcon}>
                  <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h2 className={modalClasses.headerTitle}>Novo Pedido de Produto</h2>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className={modalClasses.stepperSection}>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1 gap-2">
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
                      className={`text-sm mt-2 text-center ${
                        index <= currentStep
                          ? "text-gray-900 font-semibold"
                          : "text-gray-500 font-medium"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mb-6 mx-3 rounded-full ${
                        index < currentStep ? "bg-[#007EA7]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          <div className="flex w-full justify-center px-6 pt-5 sm:px-8">
            {error && (
              <div className={`${modalClasses.errorAlert} mb-4 w-full`}>
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erro</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className={`${modalClasses.body} flex flex-col`}>
            {/* Etapa 0 - Cliente */}
            {currentStep === 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    Cliente (Opcional)
                  </h3>
                  <p className="text-md text-gray-500 mt-1">
                    Vincule a um cliente ou apenas informe um nome
                  </p>
                </div>

                <div className="flex gap-10">
                  <button
                    type="button"
                    onClick={() => handleTipoClienteChange("nenhum")}
                    className={`px-10 py-5 rounded-md border transition-all
                                            flex items-center justify-center gap-2 cursor-pointer
                                            shadow-sm hover:shadow-md ${
                                              formData.tipoCliente === "nenhum"
                                                ? "border-[#007EA7] bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                  >
                    <User className="w-5 h-5 mx-auto mb-1 text-[#007EA7]" />
                    <p className="text-md font-semibold text-gray-900">
                      Apenas Nome
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTipoClienteChange("existente")}
                    className={`px-10 py-5 rounded-md border transition-all
                                            flex items-center justify-center gap-2 cursor-pointer
                                            shadow-sm hover:shadow-md ${
                                              formData.tipoCliente ===
                                              "existente"
                                                ? "border-[#007EA7] bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                  >
                    <User className="w-5 h-5 mx-auto mb-1 text-[#007EA7]" />
                    <p className="text-md font-semibold text-gray-900">
                      Cliente Existente
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTipoClienteChange("novo")}
                    className={`px-10 py-5 rounded-md border transition-all
                                            flex items-center justify-center gap-2 cursor-pointer
                                            shadow-sm hover:shadow-md ${
                                              formData.tipoCliente === "novo"
                                                ? "border-[#007EA7] bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                  >
                    <Plus className="w-5 h-5 mx-auto mb-1 text-[#007EA7]" />
                    <p className="text-md font-semibold text-gray-900">
                      Cadastrar Novo
                    </p>
                  </button>
                </div>

                {formData.tipoCliente === "nenhum" && (
                  <UniversalInput
                    label="Nome para Identificação"
                    required
                    type="text"
                    name="clienteNome"
                    placeholder="Digite o nome para identificação"
                    value={formData.clienteNome}
                    onChange={handleChange}
                    hint="Este nome será usado apenas para identificação do pedido"
                  />
                )}

                {formData.tipoCliente === "existente" && (
                  <UniversalInput
                    as="select"
                    label="Selecionar Cliente"
                    name="clienteId"
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
                      label="Nome Completo"
                      required
                      type="text"
                      name="clienteNome"
                      placeholder="Digite o nome completo"
                      value={formData.clienteNome}
                      onChange={handleChange}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <UniversalInput
                        label="CPF"
                        required
                        type="text"
                        name="clienteCpf"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={formData.clienteCpf}
                        onChange={handleChange}
                      />

                      <UniversalInput
                        label="Telefone"
                        required
                        type="text"
                        name="clienteTelefone"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        value={formData.clienteTelefone}
                        onChange={handleChange}
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

            {/* Etapa 1 - Produtos */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      Produtos do Pedido
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Adicione os produtos e quantidades
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleAddProduto}
                    startIcon={<Plus className="w-4 h-4" />}
                  >
                    Adicionar Produto
                  </Button>
                </div>

                {formData.produtos.length === 0 ? (
                  <div className="flex gap-2 items-center justify-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                    <Package className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-semibold">
                      Nenhum produto adicionado:
                    </p>
                    <p className="text-md text-gray-500 mt-1">
                      Clique em &quot;Adicionar Produto&quot; para começar
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 items-center justify-center">
                    {formData.produtos.map((produto, index) => (
                      <div
                        key={index}
                        className="flex gap-20 p-4 w-full bg-gray-50 rounded-md border"
                      >
                        <div className="flex flex-col items-start justify-center">
                          <UniversalInput
                            as="select"
                            label="Produto"
                            required
                            placeholder="Selecione um produto"
                            options={produtosDisponiveis.map((p) => ({
                              value: String(p.id),
                              label: `${p.nome} - R$ ${p.preco?.toFixed(2)}`,
                            }))}
                            value={produto.produtoId}
                            onChange={(e) =>
                              handleProdutoChange(
                                index,
                                "produtoId",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="w-24 flex flex-col gap-1 items-start justify-center">
                          <UniversalInput
                            label="Qtd."
                            required
                            type="number"
                            min="1"
                            value={produto.quantidade}
                            onChange={(e) =>
                              handleProdutoChange(
                                index,
                                "quantidade",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="w-32 flex flex-col gap-1 items-start justify-center">
                          <UniversalInput
                            label="Preço Unitário"
                            type="number"
                            step="0.01"
                            min="0"
                            value={produto.preco}
                            onChange={(e) =>
                              handleProdutoChange(
                                index,
                                "preco",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduto(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover produto"
                          >
                            <Trash2 className="w-6 h-10 cursor-pointer" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-3 border-t">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          R$ {calcularValorTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Etapa 2 - Pagamento */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-3">
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    Informações de Pagamento
                  </h3>
                  <p className="text-md text-gray-500 mt-1">
                    Defina a forma de pagamento e observações
                  </p>
                </div>

                <UniversalInput
                  label="Data do Pedido"
                  type="date"
                  name="data"
                  value={formData.data}
                  readOnly
                  hint="Data atual do sistema"
                />

                <UniversalInput
                  as="select"
                  label="Forma de Pagamento"
                  required
                  name="formaPagamento"
                  options={[
                    { value: "Pix", label: "Pix" },
                    { value: "Dinheiro", label: "Dinheiro" },
                    { value: "Cartão de crédito", label: "Cartão de crédito" },
                    { value: "Cartão de débito", label: "Cartão de débito" },
                    { value: "Boleto", label: "Boleto" },
                    { value: "Transferência", label: "Transferência bancária" },
                  ]}
                  value={formData.formaPagamento}
                  onChange={(e) => {
                    handleChange(e);
                    if (!METODOS_COM_PARCELA.includes(e.target.value))
                      setFormData((prev) => ({ ...prev, parcelas: 1 }));
                  }}
                />
                {METODOS_COM_PARCELA.includes(formData.formaPagamento) && (
                  <UniversalInput
                    as="select"
                    label="Parcelas"
                    name="parcelas"
                    value={formData.parcelas}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, parcelas: parseInt(e.target.value) }))
                    }
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: i + 1,
                      label: `${i + 1}x${i === 0 ? " (à vista)" : ""}`,
                    }))}
                  />
                )}

                <UniversalInput
                  as="textarea"
                  label="Observações"
                  name="descricao"
                placeholder="Digite as observações do pedido"
                  rows={4}
                  value={formData.descricao}
                  onChange={handleChange}
                />

                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      Valor Total do Pedido:
                    </span>
                    <span className="text-2xl font-bold text-[#007EA7]">
                      R$ {calcularValorTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 3 - Revisão */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-3">
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    Revisão do Pedido
                  </h3>
                  <p className="text-md text-gray-500 mt-1">
                    Confirme as informações antes de salvar
                  </p>
                </div>

                <div className="flex flex-row gap-3 items-center justify-start bg-gray-50 rounded-md p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-[#007EA7]" />
                    <h4 className="font-semibold text-gray-900">Cliente</h4>
                  </div>
                  <div className="flex flex-row gap-4 text-md">
                    <div className="flex flex-row justify-start gap-1">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium text-gray-900">
                        {formData.clienteNome || "Não informado"}
                      </span>
                    </div>
                    {formData.tipoCliente === "nenhum" && (
                      <p className="text-sm text-gray-500 italic">
                        (Apenas identificação - não vinculado a cliente
                        cadastrado)
                      </p>
                    )}
                    {formData.clienteTelefone && (
                      <div className="flex flex-row justify-start gap-1">
                        <span className="text-gray-600">Telefone:</span>
                        <span className="font-medium text-gray-900">
                          {formData.clienteTelefone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-gray-50 rounded-md p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-[#007EA7]" />
                    <h4 className="font-semibold text-gray-900">Produtos</h4>
                  </div>
                  <div className="flex flex-col gap-5 text-md">
                    {formData.produtos.map((produto, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-evenly flex-col gap-5 text-md py-2"
                      >
                        <div className="flex flex-col gap-1 items-start">
                          <li>
                            <u>
                              <p className="font-semibold text-gray-900">
                                {produto.nome}
                              </p>
                            </u>

                            <p className="text-gray-600">
                              {produto.quantidade}x R$ {produto.preco.toFixed(2)}
                            </p>
                          </li>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-4 items-center justify-center pt-3 border-t-2">
                      <span className="font-semibold text-gray-900">
                        Total:
                      </span>
                      <span className="text-xl font-bold text-[#007EA7]">
                        R$ {calcularValorTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-gray-50 rounded-md p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-5 h-5 text-[#007EA7]" />
                    <h4 className="font-semibold text-gray-900">Pagamento</h4>
                  </div>
                  <div className="flex flex-col gap-2 items-start text-md">
                    <div className="flex gap-2">
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(
                          formData.data + "T00:00:00",
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-600">Forma de Pagamento:</span>
                      <span className="font-medium text-gray-900">
                        {METODOS_COM_PARCELA.includes(formData.formaPagamento) && formData.parcelas > 1
                          ? `${formData.formaPagamento} - ${formData.parcelas}x`
                          : formData.formaPagamento}
                      </span>
                    </div>
                    {formData.descricao && (
                      <div className="pt-2 border-t">
                        <p className="text-gray-600 mb-1">Observações:</p>
                        <p className="text-gray-900">{formData.descricao}</p>
                      </div>
                    )}
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
                    <>Salvar Pedido</>
                  )}
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
          description="Seu pedido foi cadastrado com sucesso!"
          duration={2500}
        />
      )}
    </>
  );
};

// Validação de Props
NovoPedidoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default NovoPedidoModal;
