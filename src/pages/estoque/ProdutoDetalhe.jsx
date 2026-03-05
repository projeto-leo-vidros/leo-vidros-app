import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Eye,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import MovimentacaoDetalheModal from "./components/ModalEstoque/MovimentacaoDetalheModal";
import Api from "../../api/client/Api";
import { formatCurrency } from "../../utils/formatters";
import Button from "../../components/ui/Button/Button.component";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [estoque, setEstoque] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [chartData, setChartData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para o modal de detalhes da movimentação
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [selectedMovimento, setSelectedMovimento] = useState(null);

  const [sectionsOpen, setSectionsOpen] = useState({
    kpis: true,
    metrics: true,
    info: true,
    attributes: true,
    chart: true,
    movements: true,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const estoqueResponse = await Api.get(`/estoques/${id}`);
        if (estoqueResponse.status !== 200)
          throw new Error("Produto não encontrado");
        const estoqueData = estoqueResponse.data;
        setEstoque(estoqueData);

        const historicoResponse = await Api.get(`/historicos-estoques/${id}`);
        if (historicoResponse.status === 200) {
          const historicoData = historicoResponse.data;

          const historicoOrdenado = historicoData.sort(
            (a, b) => new Date(b.dataHora) - new Date(a.dataHora),
          );
          setHistorico(historicoOrdenado);

          if (historicoData && historicoData.length > 0) {
            const chartPoints = historicoData.map((hist) => ({
              date: new Date(hist.dataHora || Date.now()).toLocaleDateString(
                "pt-BR",
                { day: "2-digit", month: "2-digit" },
              ),
              stock: hist.quantidadeAtual,
            }));

            setChartData(chartPoints.reverse());
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        alert("Erro ao carregar produto");
        navigate("/Estoque");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const toggleSection = (section) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleStatus = async () => {
    const updatedProduto = {
      ...estoque.produto,
      ativo: !estoque.produto.ativo,
    };

    const updatedEstoque = {
      ...estoque,
      produto: updatedProduto,
    };

    setEstoque(updatedEstoque);

    try {
      await Api.put(`/produtos/${id}`, updatedProduto, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setEstoque(estoque);
    }
  };

  const handleFieldChange = async (field, value, isProductField = false) => {
    let updatedProduto;

    if (isProductField) {
      updatedProduto = {
        ...estoque.produto,
        [field]: value,
      };
    } else {
      const updatedEstoque = { ...estoque, [field]: value };
      setEstoque(updatedEstoque);
      return;
    }

    const updatedEstoque = {
      ...estoque,
      produto: updatedProduto,
    };

    setEstoque(updatedEstoque);

    try {
      await Api.put(`/produtos/${id}`, updatedProduto, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      setEstoque(estoque);
    }
  };

  const handleMetricChange = async (field, value) => {
    const updatedProduto = {
      ...estoque.produto,
      metrica: {
        ...estoque.produto.metrica,
        [field]: value,
      },
    };

    const updatedEstoque = {
      ...estoque,
      produto: updatedProduto,
    };

    setEstoque(updatedEstoque);

    try {
      await Api.put(`/produtos/${id}`, updatedProduto, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao atualizar métrica:", error);
      setEstoque(estoque);
    }
  };

  const handleAtributoChange = async (attrIndex, field, value) => {
    const updatedAtributos = [...(estoque.produto.atributos || [])];
    updatedAtributos[attrIndex] = {
      ...updatedAtributos[attrIndex],
      [field]: value,
    };

    const updatedProduto = {
      ...estoque.produto,
      atributos: updatedAtributos,
    };

    const updatedEstoque = {
      ...estoque,
      produto: updatedProduto,
    };

    setEstoque(updatedEstoque);

    try {
      await Api.put(`/produtos/${id}`, updatedProduto, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao atualizar atributo:", error);
      setEstoque(estoque);
    }
  };

  const handleAddAtributo = async () => {
    const newAtributo = {
      tipo: "novo_tipo",
      valor: "novo_valor",
    };

    const updatedAtributos = [
      ...(estoque.produto.atributos || []),
      newAtributo,
    ];
    const updatedProduto = {
      ...estoque.produto,
      atributos: updatedAtributos,
    };

    const updatedEstoque = {
      ...estoque,
      produto: updatedProduto,
    };

    setEstoque(updatedEstoque);

    try {
      await Api.put(`/produtos/${id}`, updatedProduto, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao adicionar atributo:", error);
      setEstoque(estoque);
    }
  };

  const handleRemoveAtributo = async (attrIndex) => {
    const updatedAtributos = estoque.produto.atributos.filter(
      (_, index) => index !== attrIndex,
    );
    const updatedProduto = {
      ...estoque.produto,
      atributos: updatedAtributos,
    };

    const updatedEstoque = {
      ...estoque,
      produto: updatedProduto,
    };

    setEstoque(updatedEstoque);

    try {
      await Api.put(`/produtos/${id}`, updatedProduto, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro ao remover atributo:", error);
      setEstoque(estoque);
    }
  };

  const EditableField = ({
    field,
    value,
    type = "text",
    prefix = "",
    suffix = "",
    isProductField = false,
    isMetric = false,
  }) => {
    const isEditing = editing[field];

    const handleChange = (newValue) => {
      if (isMetric) {
        handleMetricChange(
          field,
          type === "number" ? parseFloat(newValue) : newValue,
        );
      } else {
        handleFieldChange(
          field,
          type === "number" ? parseFloat(newValue) : newValue,
          isProductField,
        );
      }
    };

    return (
      <div className="relative">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => setEditing((prev) => ({ ...prev, [field]: false }))}
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
              {type === "number"
                ? isMetric
                  ? value
                  : value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                : value}
              {suffix}
            </span>
            <Edit2 className="w-3 h-3 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  const handleBack = () => {
    navigate("/Estoque");
  };

  // Funções para controlar o modal de detalhes da movimentação
  const handleOpenMovimentacaoModal = (movimento) => {
    setSelectedMovimento(movimento);
    setIsMovimentacaoModalOpen(true);
  };

  const handleCloseMovimentacaoModal = () => {
    setIsMovimentacaoModalOpen(false);
    setSelectedMovimento(null);
  };

  if (loading) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007EA7] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!estoque || !estoque.produto) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Produto não encontrado</p>
          <Button
            variant="primary"
            onClick={handleBack}
          >
            Voltar para Estoque
          </Button>
        </div>
      </div>
    );
  }

  const produto = estoque.produto;
  const metrica = produto.metrica || {};

  const situacao =
    estoque.quantidadeTotal === 0
      ? "Fora de estoque"
      : estoque.quantidadeTotal < (metrica.nivelMinimo || 0)
        ? "Abaixo do normal"
        : "Disponível";

  const situacaoKpiColors =
    situacao === "Fora de estoque"
      ? "from-red-500 to-red-600 border-red-700"
      : situacao === "Abaixo do normal"
        ? "from-yellow-500 to-yellow-600 border-yellow-700"
        : "from-green-500 to-green-600 border-green-700";

  const totalValue = (estoque?.quantidadeTotal ?? 0) * (produto?.preco ?? 0);

  return (
    <div className="flex bg-[#f7f9fa] min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="pt-20 lg:pt-20" />

        <main className="flex-1 flex flex-col items-center px-4 md:px-8 pt-6 pb-10">
          <div className="w-full max-w-[1380px]">
            {/* Botão Voltar */}
            <div className="flex items-center justify-between mb-6 cursor-pointer">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                startIcon={<ArrowLeft className="w-5 h-5" />}
              >
                Voltar para Estoque
              </Button>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-2">
                {produto.nome}
              </h1>
            </div>
            <br />

            {/* Seção: KPIs */}
            {sectionsOpen.kpis && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="flex flex-col gap-1 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-6">
                    <p className="text-lg text-white font-bold mb-2">
                      Quantidade Total
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {estoque.quantidadeTotal}
                    </p>
                    <p className="text-md text-blue-100 mt-2">
                      {produto.unidademedida}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-6">
                    <p className="text-lg text-white font-bold mb-2">
                      Disponível
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.max(
                        0,
                        estoque.quantidadeDisponivel - estoque.reservado,
                      )}
                    </p>
                    <p className="text-md text-blue-100 mt-2">
                      Pronto para uso
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-6">
                    <p className="text-lg text-white font-bold mb-2">
                      Reservado
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {estoque.reservado}
                    </p>
                    <p className="text-md text-blue-100 mt-2">Em separação</p>
                  </div>

                  {/* KPI com cor dinâmica baseada na situação */}
                  <div
                    className={`flex flex-col gap-3 bg-gradient-to-br ${situacaoKpiColors} rounded-lg border-2 p-6`}
                  >
                    <p className="text-md text-white font-bold mb-2">
                      Situação do Estoque
                    </p>
                    <p className="text-lg font-bold text-white">{situacao}</p>
                    <p className="text-md text-white opacity-90 mt-2">
                      Status atual
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-6">
                    <p className="text-lg text-white font-bold mb-2">
                      Preço Unitário
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(produto.preco)}
                    </p>
                    <p className="text-md text-blue-100 mt-2">
                      Por {produto.unidademedida}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 bg-gradient-to-br from-[#007EA7] to-[#006891] rounded-lg border-2 border-[#005a7a] p-6">
                    <p className="text-lg text-white font-bold mb-2">
                      Valor Total
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(totalValue)}
                    </p>
                    <p className="text-md text-blue-100 mt-2">Em estoque</p>
                  </div>
                </div>
              </div>
            )}

            <br />

            {/* Seção: Métrica de Estoque */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <button
                onClick={() => toggleSection("metrics")}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Métrica de Estoque
                </h2>
                {sectionsOpen.metrics ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 cursor-pointer" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 cursor-pointer" />
                )}
              </button>

              {sectionsOpen.metrics && (
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Nível Mínimo
                      </label>
                      <EditableField
                        field="nivelMinimo"
                        value={metrica.nivelMinimo || 0}
                        type="number"
                        suffix={` ${produto.unidademedida}`}
                        isMetric={true}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Alerta de reposição quando atingir este valor
                      </p>
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Nível Máximo
                      </label>
                      <EditableField
                        field="nivelMaximo"
                        value={metrica.nivelMaximo || 0}
                        type="number"
                        suffix={` ${produto.unidademedida}`}
                        isMetric={true}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Capacidade máxima de armazenamento
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <br />

            {/* Seção: Informações do Produto */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <button
                onClick={() => toggleSection("info")}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Informações do Produto
                </h2>
                {sectionsOpen.info ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 cursor-pointer" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 cursor-pointer" />
                )}
              </button>

              {sectionsOpen.info && (
                <div className="p-6 pt-0">
                  {/* Toggle Status */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-gray-700">
                      Status do Produto:
                    </span>
                    <button
                      onClick={toggleStatus}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:ring-offset-2 ${
                        produto.ativo ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          produto.ativo ? "translate-x-8" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-semibold ${produto.ativo ? "text-green-600" : "text-gray-500"}`}
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <br />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Nome do Produto
                      </label>
                      <EditableField
                        field="nome"
                        value={produto.nome}
                        isProductField={true}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Unidade de Medida
                      </label>
                      <EditableField
                        field="unidademedida"
                        value={produto.unidademedida}
                        isProductField={true}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Descrição
                      </label>
                      <EditableField
                        field="descricao"
                        value={produto.descricao || "N/A"}
                        isProductField={true}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Localização
                      </label>
                      <EditableField
                        field="localizacao"
                        value={estoque.localizacao || "N/A"}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Preço
                      </label>
                      <EditableField
                        field="preco"
                        value={produto.preco}
                        type="number"
                        prefix="R$ "
                        isProductField={true}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <br />

            {/* Seção: Atributos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <button
                onClick={() => toggleSection("attributes")}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Atributos do Produto
                </h2>
                {sectionsOpen.attributes ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 cursor-pointer" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 cursor-pointer" />
                )}
              </button>

              {sectionsOpen.attributes && (
                <div className="p-6 pt-0">
                  <div className="space-y-3">
                    {(produto.atributos || []).map((attr, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-left text-xs font-bold text-gray-600 mb-1">
                              Tipo
                            </label>
                            <input
                              type="text"
                              value={attr.tipo}
                              onChange={(e) =>
                                handleAtributoChange(
                                  index,
                                  "tipo",
                                  e.target.value,
                                )
                              }
                              placeholder="Ex: cor, espessura"
                              className="w-full px-3 py-2 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                            />
                          </div>
                          <div>
                            <label className="block text-left text-xs font-bold text-gray-600 mb-1">
                              Valor
                            </label>
                            <input
                              type="text"
                              value={attr.valor}
                              onChange={(e) =>
                                handleAtributoChange(
                                  index,
                                  "valor",
                                  e.target.value,
                                )
                              }
                              placeholder="Ex: Incolor, 4mm"
                              className="w-full px-3 py-2 border-2 border-[#005a7a] rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAtributo(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors mt-5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddAtributo}
                      startIcon={<Plus className="w-4 h-4" />}
                    >
                      Adicionar Atributo
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <br />

            {/* Seção: Gráfico */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                <button
                  onClick={() => toggleSection("chart")}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-gray-800">
                    Variação de Estoque
                  </h2>
                  {sectionsOpen.chart ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 cursor-pointer" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 cursor-pointer" />
                  )}
                </button>

                {sectionsOpen.chart && (
                  <div className="p-6 pt-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          style={{ fontSize: "12px" }}
                        />
                        <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Line
                          type="monotone"
                          dataKey="stock"
                          stroke="#007EA7"
                          strokeWidth={2}
                          dot={{ fill: "#007EA7", r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Quantidade em Estoque"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
            <br />

            {/* Seção: Movimentações */}
            {historico.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection("movements")}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-gray-800">
                    Histórico de Movimentações
                  </h2>
                  {sectionsOpen.movements ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 cursor-pointer" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 cursor-pointer" />
                  )}
                </button>

                {sectionsOpen.movements && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Tipo de Movimentação
                          </th>
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Quantidade Atual
                          </th>
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Observação
                          </th>
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Usuário
                          </th>
                          <th className="py-3 px-6 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Detalhe
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {historico.map((movimento) => (
                          <tr
                            key={movimento.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                              {new Date(movimento.dataHora).toLocaleDateString(
                                "pt-BR",
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${
                                  movimento.tipoMovimentacao === "ENTRADA"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {movimento.tipoMovimentacao === "ENTRADA" ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {movimento.tipoMovimentacao}
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-center ${
                                movimento.tipoMovimentacao === "ENTRADA"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {movimento.tipoMovimentacao === "ENTRADA"
                                ? "+"
                                : "-"}
                              {movimento.quantidade} {produto.unidademedida}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center font-semibold">
                              {movimento.quantidadeAtual}{" "}
                              {produto.unidademedida}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 text-center">
                              {movimento.observacao || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {movimento.usuario?.nome || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  handleOpenMovimentacaoModal(movimento)
                                }
                                startIcon={<Eye className="w-3 h-3" />}
                              >
                                Ver Detalhe
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Detalhes da Movimentação */}
      <MovimentacaoDetalheModal
        isOpen={isMovimentacaoModalOpen}
        onClose={handleCloseMovimentacaoModal}
        movimento={selectedMovimento}
        produto={produto}
      />
    </div>
  );
}
