import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  Plus,
  X,
  Save,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import Api from "../../api/client/Api";
import PedidosService from "../../api/services/pedidosService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import ProdutoSearchSelect from "../../components/ui/misc/ProdutoSearchSelect";

const METODOS_COM_PARCELA = ["Cartão de crédito"];

const parseFormaPagamento = (valor = "") => {
  const match = valor.match(/^(.+?) - (\d+)x$/);
  if (match) return { metodo: match[1], parcelas: parseInt(match[2]) };
  return { metodo: valor, parcelas: 1 };
};

const composeFormaPagamento = (metodo, parcelas) => {
  if (METODOS_COM_PARCELA.includes(metodo) && parcelas > 1)
    return `${metodo} - ${parcelas}x`;
  return metodo;
};

export default function PedidoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [rawPedido, setRawPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);

  const [formData, setFormData] = useState({
    clienteNome: "",
    formaPagamento: "",
    parcelas: 1,
    observacoes: "",
    produtos: [],
  });

  const [sectionsOpen, setSectionsOpen] = useState({
    kpis: true,
    info: true,
    produtos: true,
    observacoes: true,
  });

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleSection = (s) =>
    setSectionsOpen((prev) => ({ ...prev, [s]: !prev[s] }));

  useEffect(() => {
    Api.get("/produtos?size=200").then((res) => {
      const lista = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
      setProdutosDisponiveis(lista);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchPedido = async () => {
      setLoading(true);
      try {
        const response = await Api.get(`/pedidos/${id}`);
        if (response.status !== 200) throw new Error("Pedido não encontrado");
        const raw = response.data;
        setRawPedido(raw);
        const mapped = PedidosService.mapearParaFrontend(raw);
        setPedido(mapped);
        const { metodo, parcelas } = parseFormaPagamento(mapped.formaPagamento);
        setFormData({
          clienteNome: mapped.clienteNome || "",
          formaPagamento: metodo,
          parcelas,
          observacoes: mapped.observacoes || "",
          produtos: mapped.produtos || [],
        });
      } catch (err) {
        console.error("Erro ao buscar pedido:", err);
        alert("Erro ao carregar pedido");
        navigate("/Pedidos");
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [id, navigate]);

  /* ─── helpers de edição ─── */
  const calcularValorTotal = () =>
    formData.produtos.reduce(
      (acc, p) =>
        acc + (parseFloat(p.quantidade) || 0) * (parseFloat(p.preco) || 0),
      0,
    );

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProdutoChange = (index, field, value) => {
    const updated = [...formData.produtos];
    updated[index] = {
      ...updated[index],
      [field]:
        field === "quantidade" || field === "preco"
          ? parseFloat(value) || 0
          : value,
    };
    setFormData((prev) => ({ ...prev, produtos: updated }));
  };

  const handleProdutoSelect = (index, produto) => {
    const updated = [...formData.produtos];
    updated[index] = {
      ...updated[index],
      nome: produto?.nome ?? "",
      preco: parseFloat(produto?.preco ?? 0),
      estoqueId: produto?.id ?? 0,
    };
    setFormData((prev) => ({ ...prev, produtos: updated }));
  };

  const handleAdicionarProduto = () => {
    setFormData((prev) => ({
      ...prev,
      produtos: [
        ...prev.produtos,
        { nome: "", quantidade: 1, preco: 0, estoqueId: 0, observacao: "" },
      ],
    }));
  };

  const handleRemoverProduto = (index) => {
    setFormData((prev) => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (!formData.formaPagamento.trim()) {
      setError("⚠️ Selecione uma forma de pagamento");
      setSaving(false);
      return;
    }

    try {
      const valorTotal = calcularValorTotal();
      const requestBody = {
        pedido: {
          valorTotal,
          ativo: rawPedido?.ativo !== undefined ? rawPedido.ativo : true,
          formaPagamento: composeFormaPagamento(formData.formaPagamento, formData.parcelas),
          observacao: formData.observacoes,
          clienteId: pedido.clienteId,
          clienteNome: formData.clienteNome,
          status: {
            tipo: pedido.statusOriginal?.tipo || "PEDIDO",
            nome: pedido.statusOriginal?.nome || "ATIVO",
          },
        },
        servico: null,
        produtos: formData.produtos.map((p) => ({
          estoqueId: p.estoqueId || 0,
          quantidadeSolicitada: parseFloat(p.quantidade) || 0,
          precoUnitarioNegociado: parseFloat(p.preco) || 0,
          observacao: p.observacao || "",
        })),
      };

      const response = await Api.put(`/pedidos/${id}`, requestBody);
      console.log("🔄 Resposta do servidor:", response.data);
      
      const mapped = PedidosService.mapearParaFrontend(response.data);
      console.log("📋 Dados mapeados:", mapped);
      
      setRawPedido(response.data);
      setPedido(mapped);
      
      // Sincronizar formData com resposta do servidor
      const newFormData = {
        clienteNome: mapped.clienteNome || "",
        formaPagamento: mapped.formaPagamento || "",
        observacoes: mapped.observacoes || "",
        produtos: mapped.produtos || [],
      };
      console.log("💾 Atualizando formData:", newFormData);
      setFormData(newFormData);

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        window.location.reload();
      }, 2500);
    } catch (err) {
      console.error("❌ Erro:", err);
      setError(
        err.response?.data?.message || err.message || "Erro ao salvar",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ─── componente de campo editável ─── */
  const EditableField = ({
    field,
    value,
    type = "text",
    prefix = "",
    suffix = "",
    readOnly = false,
  }) => {
    const isEditing = editing[field];

    if (readOnly) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
          <span className="text-gray-600 text-sm">
            {prefix}
            {value}
            {suffix}
          </span>
        </div>
      );
    }

    return (
      <div className="relative">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() =>
                setEditing((prev) => ({ ...prev, [field]: false }))
              }
              className="flex-1 px-3 py-2 border-2 border-[#005a7a] rounded-md focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] text-sm"
              autoFocus
            />
            <Check className="w-4 h-4 text-green-600" />
          </div>
        ) : (
          <div
            onClick={() => setEditing((prev) => ({ ...prev, [field]: true }))}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors group border border-gray-700"
          >
            <span className="text-gray-800 text-sm">
              {prefix}
              {value}
              {suffix}
            </span>
            <Edit2 className="w-3 h-3 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  /* ─── loading / not found ─── */
  if (loading) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007EA7] mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pedido não encontrado</p>
          <button
            onClick={() => navigate("/Pedidos")}
            className="bg-[#007EA7] text-white px-4 py-2 rounded-md hover:bg-[#006891] transition-colors"
          >
            Voltar para Pedidos
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    Ativo: "from-blue-500 to-blue-600 border-blue-700",
    Finalizado: "from-green-500 to-green-600 border-green-700",
    "Em Andamento": "from-yellow-500 to-yellow-600 border-yellow-700",
    Cancelado: "from-red-500 to-red-600 border-red-700",
  };
  const statusGradient =
    statusColors[pedido.status] ||
    "from-[#007EA7] to-[#006891] border-[#005a7a]";

  const valorTotal = calcularValorTotal();

  return (
    <div className="app-page flex bg-[#f7f9fa] min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="app-content flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="pt-20 lg:pt-20" />

        <main className="flex-1 flex flex-col items-center px-4 md:px-8 pt-6 pb-10">
          <div className="w-full max-w-[1380px]">

            {/* Botão Voltar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate("/Pedidos")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar para Pedidos
              </button>

            </div>

            {/* Título */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="bg-[#e0f2fa] p-3 rounded-full">
                  <ShoppingCart className="w-7 h-7 text-[#007EA7]" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800">
                  Pedido #{String(pedido.id).padStart(3, "0")}
                </h1>
              </div>
              <p className="text-gray-500 text-sm">
                Criado em {formatDate(pedido.dataCompra)} · Cliente:{" "}
                {pedido.clienteNome}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <br />

            {/* ── KPIs ── */}
            {sectionsOpen.kpis && (
              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-4 sm:p-6">
                    <p className="text-sm sm:text-lg text-white font-bold mb-1 sm:mb-2">
                      Valor Total
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-white">
                      {formatCurrency(valorTotal)}
                    </p>
                    <p className="text-md text-blue-100 mt-2">
                      {formData.produtos.length}{" "}
                      {formData.produtos.length === 1 ? "item" : "itens"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-4 sm:p-6">
                    <p className="text-sm sm:text-lg text-white font-bold mb-1 sm:mb-2">
                      Forma de Pagamento
                    </p>
                    <p className="text-xl font-bold text-white">
                      {formData.formaPagamento || "—"}
                    </p>
                    <p className="text-md text-blue-100 mt-2">
                      Método escolhido
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-4 sm:p-6">
                    <p className="text-sm sm:text-lg text-white font-bold mb-1 sm:mb-2">
                      Data do Pedido
                    </p>
                    <p className="text-xl font-bold text-white">
                      {formatDate(pedido.dataCompra)}
                    </p>
                    <p className="text-md text-blue-100 mt-2">
                      Data de criação
                    </p>
                  </div>

                  <div
                    className={`flex flex-col gap-2 bg-gradient-to-br ${statusGradient} rounded-lg border-2 p-6`}
                  >
                    <p className="text-sm sm:text-lg text-white font-bold mb-1 sm:mb-2">Status</p>
                    <p className="text-xl font-bold text-white">
                      {pedido.status}
                    </p>
                    <p className="text-md text-white opacity-90 mt-2">
                      Status atual
                    </p>
                  </div>
                </div>
              </div>
            )}

            <br />

            {/* ── Seção: Informações do Pedido ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <button
                onClick={() => toggleSection("info")}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Informações do Pedido
                </h2>
                {sectionsOpen.info ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {sectionsOpen.info && (
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Nome do Cliente
                      </label>
                      <EditableField
                        field="clienteNome"
                        value={formData.clienteNome}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Data do Pedido
                      </label>
                      <EditableField
                        field="dataCompra"
                        value={formatDate(pedido.dataCompra)}
                        readOnly
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-left text-sm font-bold text-gray-700">
                        Forma de Pagamento
                      </label>
                      <select
                        value={formData.formaPagamento}
                        onChange={(e) => {
                          handleFieldChange("formaPagamento", e.target.value);
                          if (!METODOS_COM_PARCELA.includes(e.target.value))
                            handleFieldChange("parcelas", 1);
                        }}
                        className={`w-full px-3 py-2 border rounded-md text-sm text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] bg-white ${
                          !formData.formaPagamento ? "border-red-500" : "border-gray-700"
                        }`}
                      >
                        <option value="">Selecione...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Pix">Pix</option>
                        <option value="Cartão de crédito">Cartão de crédito</option>
                        <option value="Cartão de débito">Cartão de débito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Transferência">Transferência bancária</option>
                      </select>

                      {METODOS_COM_PARCELA.includes(formData.formaPagamento) && (
                        <div>
                          <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                            Parcelas
                          </label>
                          <select
                            value={formData.parcelas}
                            onChange={(e) => handleFieldChange("parcelas", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] bg-white"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}x {n === 1 ? "(à vista)" : ""}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Status
                      </label>
                      <EditableField
                        field="status"
                        value={pedido.status}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Dados do cliente */}
                  {pedido.clienteInfo && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">
                        Dados do Cliente
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {pedido.clienteInfo.email && (
                          <div>
                            <label className="block text-left text-xs font-bold text-gray-500 mb-1">
                              E-mail
                            </label>
                            <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                              {pedido.clienteInfo.email}
                            </p>
                          </div>
                        )}
                        {pedido.clienteInfo.telefone && (
                          <div>
                            <label className="block text-left text-xs font-bold text-gray-500 mb-1">
                              Telefone
                            </label>
                            <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                              {pedido.clienteInfo.telefone}
                            </p>
                          </div>
                        )}
                        {pedido.clienteInfo.cpf && (
                          <div>
                            <label className="block text-left text-xs font-bold text-gray-500 mb-1">
                              CPF
                            </label>
                            <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                              {pedido.clienteInfo.cpf}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <br />

            {/* ── Seção: Produtos ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <button
                onClick={() => toggleSection("produtos")}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Produtos ({formData.produtos.length})
                </h2>
                {sectionsOpen.produtos ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {sectionsOpen.produtos && (
                <div className="p-6 pt-0">
                  <div className="space-y-3">
                    {formData.produtos.map((produto, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 bg-gray-50 p-4 rounded-md border border-gray-200"
                      >
                        <div className="col-span-12 md:col-span-5 flex flex-col gap-1">
                          <label className="block text-left text-xs font-bold text-gray-600 mb-1">
                            Nome do Produto
                          </label>
                          <ProdutoSearchSelect
                            produtos={produtosDisponiveis}
                            value={produto.nome ? { id: produto.estoqueId, nome: produto.nome } : null}
                            onChange={(p) => handleProdutoSelect(index, p)}
                            placeholder="Pesquisar produto..."
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
                          <label className="block text-left text-xs font-bold text-gray-600 mb-1">
                            Quantidade
                          </label>
                          <input
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
                            className="w-full px-3 py-2 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 flex flex-col gap-1">
                          <label className="block text-left text-xs font-bold text-gray-600 mb-1">
                            Preço Unitário
                          </label>
                          <input
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
                            className="w-full px-3 py-2 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                          />
                        </div>
                        <div className="col-span-8 md:col-span-1 flex flex-col justify-end">
                          <label className="block text-left text-xs font-bold text-gray-600 mb-1">
                            Subtotal
                          </label>
                          <p className="px-2 py-2 text-sm font-semibold text-[#007EA7]">
                            {formatCurrency(
                              (parseFloat(produto.quantidade) || 0) *
                                (parseFloat(produto.preco) || 0),
                            )}
                          </p>
                        </div>
                        <div className="col-span-4 md:col-span-1 flex flex-col justify-end items-end">
                          <button
                            onClick={() => handleRemoverProduto(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors mt-5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.produtos.length === 0 && (
                      <div className="flex items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                        Nenhum produto adicionado
                      </div>
                    )}

                    <button
                      onClick={handleAdicionarProduto}
                      className="flex items-center gap-2 px-4 py-2 bg-[#007EA7] text-white rounded-md hover:bg-[#006891] transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Produto
                    </button>
                  </div>

                  {/* Valor Total */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-md font-semibold text-gray-700">
                      Valor Total:
                    </span>
                    <span className="text-2xl font-bold text-[#007EA7]">
                      {formatCurrency(valorTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <br />

            {/* ── Seção: Observações ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <button
                onClick={() => toggleSection("observacoes")}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Observações
                </h2>
                {sectionsOpen.observacoes ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {sectionsOpen.observacoes && (
                <div className="p-6 pt-0">
                  <textarea
                    rows={4}
                    value={formData.observacoes}
                    onChange={(e) =>
                      handleFieldChange("observacoes", e.target.value)
                    }
                    placeholder="Adicione observações sobre o pedido..."
                    className="w-full px-4 py-3 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] resize-none"
                  />
                </div>
              )}
            </div>

            <br />

            {/* ── Botão Salvar ── */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-[#007EA7] text-white rounded-lg cursor-pointer hover:bg-[#006891] transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold shadow-md"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <FeedbackModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Sucesso!"
        description="Pedido atualizado com sucesso!"
        duration={2500}
      />
    </div>
  );
}
