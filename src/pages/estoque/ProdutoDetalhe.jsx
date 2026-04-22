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
  Trash2,
  Eye,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Kpis from "../../components/kpis/Kpis";
import MovimentacaoDetalheModal from "./components/ModalEstoque/MovimentacaoDetalheModal";
import Api from "../../api/client/Api";
import { formatCurrency } from "../../utils/formatters";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import { repairEncoding } from "../../utils/fixEncoding";

const formatObservacao = (observacao) => {
  if (!observacao) return "N/A";
  return observacao.replace(/(\d+\.\d{3,})/g, (match) => {
    return parseFloat(match).toFixed(2);
  });
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [estoque, setEstoque] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState({});
  const [chartData, setChartData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        setEstoque(repairEncoding(estoqueData));

        const historicoResponse = await Api.get(`/historicos-estoques/${id}`);
        if (historicoResponse.status === 200) {
          const historicoData = historicoResponse.data?.content ?? historicoResponse.data;

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
        navigate("/estoque");
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
    if (typeof value === "string" && value.trim() === "") {
      setError("O atributo não pode ficar vazio.");
      return;
    }

    setError(null);

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
      tipo: "Novo Tipo",
      valor: "Novo Valor",
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
    const displayValue =
      type === "number"
        ? isMetric
          ? value
          : value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        : value;

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
          <div className="flex items-center gap-3 rounded-lg border-2 border-[#007EA7] bg-sky-50 px-3 py-2 shadow-sm ring-1 ring-[#007EA7]/10">
            <UniversalInput
              type={type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => setEditing((prev) => ({ ...prev, [field]: false }))}
              className="flex-1 border-0 bg-transparent px-0 text-slate-900 shadow-none focus:ring-0"
              autoFocus
            />
            <div className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <Check className="h-3.5 w-3.5" />
              Salvar
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing((prev) => ({ ...prev, [field]: true }))}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left transition-all duration-150 hover:border-[#007EA7] hover:bg-sky-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:ring-offset-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
              {prefix}
              {displayValue}
              {suffix}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition-colors group-hover:border-[#007EA7]/30 group-hover:bg-[#007EA7]/10 group-hover:text-[#007EA7]">
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </span>
          </button>
        )}
      </div>
    );
  };

  const handleBack = () => {
    navigate("/estoque");
  };

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

  const totalValue = (estoque?.quantidadeTotal ?? 0) * (produto?.preco ?? 0);
  const quantidadeDisponivel = Math.max(
    0,
    estoque.quantidadeDisponivel - estoque.reservado,
  );

  const getStatusClasses = (status) => {
    if (status === "ok") {
      return {
        cardClassName:
          "border border-[#3B82F6]/40 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-md shadow-blue-900/20",
        iconClassName: "text-blue-50",
        titleClassName: "text-blue-50 font-semibold",
        valueClassName: "text-white",
        captionClassName: "text-blue-100",
      };
    }

    if (status === "normal") {
      return {
        cardClassName:
          "border border-[#22C55E]/40 bg-gradient-to-br from-[#22C55E] to-[#16A34A] shadow-md shadow-green-900/20",
        iconClassName: "text-green-50",
        titleClassName: "text-green-50 font-semibold",
        valueClassName: "text-white",
        captionClassName: "text-green-100",
      };
    }

    if (status === "risco") {
      return {
        cardClassName:
          "border border-[#FACC15]/50 bg-gradient-to-br from-[#FACC15] to-[#EAB308] shadow-md shadow-yellow-900/20",
        iconClassName: "text-yellow-950",
        titleClassName: "text-yellow-950 font-semibold",
        valueClassName: "text-yellow-950",
        captionClassName: "text-yellow-900",
      };
    }

    return {
      cardClassName:
        "border border-[#EF4444]/40 bg-gradient-to-br from-[#EF4444] to-[#DC2626] shadow-md shadow-red-900/20",
      iconClassName: "text-red-50",
      titleClassName: "text-red-50 font-semibold",
      valueClassName: "text-white",
      captionClassName: "text-red-100",
    };
  };

  const disponibilidadeStatus =
    quantidadeDisponivel === 0
      ? "alerta"
      : quantidadeDisponivel <= (metrica.nivelMinimo || 0)
        ? "risco"
        : quantidadeDisponivel <= (metrica.nivelMaximo || Number.MAX_SAFE_INTEGER)
          ? "normal"
          : "ok";

  const reservadoStatus =
    estoque.reservado === 0
      ? "ok"
      : estoque.reservado >= quantidadeDisponivel
        ? "alerta"
        : estoque.reservado >= quantidadeDisponivel * 0.6
          ? "risco"
          : "normal";

  const situacaoStatus =
    situacao === "Fora de estoque"
      ? "alerta"
      : situacao === "Abaixo do normal"
        ? "risco"
        : "normal";

  const estoqueKpiBaseClasses = {
    cardClassName:
      "border border-gray-200 bg-white shadow-sm",
    iconClassName: "text-slate-700",
    titleClassName: "text-slate-700 font-semibold",
    valueClassName: "text-slate-900",
    captionClassName: "text-slate-600",
  };

  const situacaoKpiClasses =
    getStatusClasses(situacaoStatus);

  const estoqueKpiStats = [
    {
      title: "Quantidade Total",
      value: estoque.quantidadeTotal,
      caption: produto.unidademedida,
      icon: Package,
      ...estoqueKpiBaseClasses,
    },
    {
      title: "Disponível",
      value: quantidadeDisponivel,
      caption: "Pronto para uso",
      icon: TrendingUp,
      ...getStatusClasses(disponibilidadeStatus),
    },
    {
      title: "Reservado",
      value: estoque.reservado,
      caption: "Em separação",
      icon: TrendingDown,
      ...getStatusClasses(reservadoStatus),
    },
    {
      title: "Situação do Estoque",
      value: situacao,
      caption: "Status atual",
      icon: Eye,
      ...situacaoKpiClasses,
    },
    {
      title: "Preço Unitário",
      value: formatCurrency(produto.preco),
      caption: `Por ${produto.unidademedida}`,
      icon: Package,
      ...estoqueKpiBaseClasses,
    },
    {
      title: "Valor Total",
      value: formatCurrency(totalValue),
      caption: "Em estoque",
      icon: TrendingUp,
      ...estoqueKpiBaseClasses,
    },
  ];

  return (
    <div className="app-page flex bg-[#f7f9fa] min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="app-content flex-1 flex flex-col min-h-screen">
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
                <Kpis
                  stats={estoqueKpiStats}
                  gridClassName="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
                />
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
                    <span className="text-sm sm:text-base font-semibold tracking-normal text-gray-700">
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

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Preço de Custo
                      </label>
                      <EditableField
                        field="precoCusto"
                        value={produto.precoCusto ?? 0}
                        type="number"
                        prefix="R$ "
                        isProductField={true}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-sm font-bold text-gray-700 mb-2">
                        Preço de Venda
                      </label>
                      <EditableField
                        field="precoVenda"
                        value={produto.precoVenda ?? 0}
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
              <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Atributos do Produto
                  </h2>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => toggleSection("attributes")}
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:border-[#007EA7] hover:bg-sky-50 hover:text-[#007EA7]"
                    aria-label={
                      sectionsOpen.attributes
                        ? "Esconder atributos"
                        : "Mostrar atributos"
                    }
                  >
                    {sectionsOpen.attributes ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {sectionsOpen.attributes && (
                <div className="flex flex-col gap-5 p-6">
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddAtributo}
                      startIcon={<Plus className="w-5 h-5" />}
                      className="whitespace-nowrap"
                    >
                      Adicionar Atributo
                    </Button>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-5">
                    {(produto.atributos || []).length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                        Nenhum atributo cadastrado. Clique em "Adicionar Atributo" para incluir o primeiro.
                      </div>
                    )}

                    {(produto.atributos || []).map((attr, index) => (
                      <div
                        key={index}
                        className="relative flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3 pb-1">
                          <p className="text-sm font-semibold text-gray-700">
                            Atributo {index + 1}
                          </p>

                          <button
                            onClick={() => handleRemoveAtributo(index)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                          <div className="min-w-0">
                            <UniversalInput
                              label="Tipo"
                              value={attr.tipo}
                              onChange={(e) =>
                                handleAtributoChange(
                                  index,
                                  "tipo",
                                  e.target.value,
                                )
                              }
                              placeholder="Ex: cor, espessura"
                            />
                          </div>
                          <div className="min-w-0">
                            <UniversalInput
                              label="Valor"
                              value={attr.valor}
                              onChange={(e) =>
                                handleAtributoChange(
                                  index,
                                  "valor",
                                  e.target.value,
                                )
                              }
                              placeholder="Ex: Incolor, 4mm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

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
                              {formatObservacao(movimento.observacao)}
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
