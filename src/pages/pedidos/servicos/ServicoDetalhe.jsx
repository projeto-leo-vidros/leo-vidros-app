import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  X,
  Save,
  FileText,
  MapPin,
  ChevronDown,
  Plus,
  Calendar,
} from "lucide-react";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import FeedbackModal from "../../../components/feedback/FeedbackModal/FeedbackModal";
import TaskCreateModal from "../../../components/ui/misc/TaskCreateModal";
import Api from "../../../api/client/Api";
import PedidosService from "../../../api/services/pedidosService";
import { formatCurrency, formatDate } from "../../../utils/formatters";

const METODOS_COM_PARCELA = ["Cartão de crédito"];

const parseFormaPagamento = (valor = "") => {
  const match = valor.match(/^(.+?) - (\d+)x$/);
  if (match) {
    const metodo = match[1] === "PIX" ? "Pix" : match[1];
    return { formaPagamento: metodo, parcelas: parseInt(match[2]) };
  }
  return { formaPagamento: valor === "PIX" ? "Pix" : valor, parcelas: 1 };
};

const composeFormaPagamento = (metodo, parcelas) => {
  if (METODOS_COM_PARCELA.includes(metodo) && parcelas > 1) {
    return `${metodo} - ${parcelas}x`;
  }
  return metodo;
};

const normalizeStatus = (status = "") =>
  status
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .trim()
    .toUpperCase();

const isAgendamentoBloqueante = (status = "") => {
  const s = normalizeStatus(status);
  return s === "PENDENTE" || s === "EM ANDAMENTO";
};

const STEPS = [
  { label: "PENDENTE" },
  { label: "AGUARDANDO ORÇAMENTO" },
  { label: "ANÁLISE DO ORÇAMENTO" },
  { label: "ORÇAMENTO APROVADO" },
  { label: "SERVIÇO AGENDADO" },
  { label: "SERVIÇO EM EXECUÇÃO" },
  { label: "CONCLUÍDO" },
];

const ETAPA_OPTIONS = STEPS.map((step) => step.label);

function getStepIndex(status) {
  if (!status) return 0;
  const s = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\u0300-\u036f]/g, "");

  if (s.includes("conclu") || s.includes("finaliz")) return 6;
  if (s.includes("execu") || s.includes("instal")) return 5;
  if (s.includes("agendad")) return 4;
  if (s.includes("aprovad")) return 3;
  if (s.includes("analise")) return 2;
  if (s.includes("orcamento") || s.includes("vistoria") || s.includes("aguardando")) return 1;
  return 0;
}

function Stepper({ status }) {
  const activeStep = getStepIndex(status);

  return (
    <div className="bg-transparent rounded-lg border border-gray-200 px-6 py-6 shadow-sm flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-600 mb-12">Progresso do Serviço</p>

      <div className="relative flex items-start justify-between">
        <div
          className="absolute h-[2px] bg-gray-200 z-0"
          style={{ top: "18px", left: "4%", right: "4%" }}
        />
        <div
          className="absolute h-[2px] bg-[#0099bf] z-0 transition-all duration-500"
          style={{ top: "18px", left: "4%", width: `${(activeStep / 6) * 92}%` }}
        />

        {STEPS.map((step, i) => {
          const done   = i < activeStep;
          const active = i === activeStep;

          return (
            <div key={i} className="z-10 flex w-24 flex-col items-center text-center">
              <div
                className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-[#007EA7] border-[#007EA7] text-white"
                    : active
                    ? "bg-[#e6f5fb] border-[#56b9d2] text-[#007EA7] shadow-[0_0_0_5px_rgba(86,185,210,0.18)]"
                    : "bg-[#f8fafb] border-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              <span
                className={`mt-8 text-[10px] leading-[1.05rem] font-semibold uppercase ${
                  active ? "text-[#007EA7]" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendamentoTabs({ agendamentos }) {
  const [activeTab, setActiveTab] = useState("orcamento");

  const getEnderecoTexto = (endereco) => {
    if (!endereco) return "";
    const rua    = endereco.rua    || endereco.logradouro || "";
    const numero = endereco.numero || "s/n";
    const bairro = endereco.bairro || "";
    const cidade = endereco.cidade || "";
    const uf     = endereco.uf     || "";

    const linhaPrincipal  = rua ? `${rua}, ${numero}` : "";
    const linhaSecundaria = [bairro, cidade, uf].filter(Boolean).join(" - ");
    return [linhaPrincipal, linhaSecundaria].filter(Boolean).join(" • ");
  };

  const getLocalServico = (agendamento) => {
    const localDireto =
      agendamento.localServico          ||
      agendamento.local                 ||
      agendamento.enderecoCompleto      ||
      agendamento.enderecoServicoTexto  ||
      agendamento.enderecoTexto         ||
      agendamento.logradouro;
    if (localDireto) return localDireto;

    const enderecoObjeto =
      agendamento.enderecoServico  ||
      agendamento.endereco         ||
      agendamento.localizacao      ||
      agendamento.clienteEndereco;
    const enderecoFormatado = getEnderecoTexto(enderecoObjeto);
    if (enderecoFormatado) return enderecoFormatado;

    if (agendamento.mesmoEnderecoCliente === true || agendamento.usarEnderecoCliente === true) {
      return "Mesmo endereço cadastrado do cliente";
    }
    return "Local do serviço não informado";
  };

  const orcamento = agendamentos.filter(
    (a) =>
      a.tipoAgendamento?.toUpperCase().includes("ORC") ||
      a.tipoAgendamento?.toUpperCase().includes("VISTORIA")
  );
  const servico = agendamentos.filter(
    (a) =>
      !a.tipoAgendamento?.toUpperCase().includes("ORC") &&
      !a.tipoAgendamento?.toUpperCase().includes("VISTORIA")
  );
  const current = activeTab === "orcamento" ? orcamento : servico;

  return (
    <>
      <div className="px-5 pt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Clique para alternar o tipo de agendamento
        </p>
      </div>

      <div className="mx-5 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
        {[
          { id: "orcamento", label: "Orçamento",            count: orcamento.length },
          { id: "servico",   label: "Prestação de Serviço", count: servico.length  },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center py-3.5 px-4 text-xs font-semibold rounded-md border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56b9d2] ${
              activeTab === id
                ? "bg-white border-[#007EA7] text-[#002A4B] shadow-sm"
                : "bg-gray-100 border-transparent text-gray-500 hover:bg-white hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === id
                    ? "bg-[#dce7f2] text-[#002A4B]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 flex flex-col gap-8">
        {current.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg shadow-sm">
            Nenhum agendamento
          </div>
        ) : (
          current.map((ag, i) => (
            <div
              key={`${activeTab}-${ag.id || i}`}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center gap-5">
                <p className="text-sm font-semibold text-gray-800">
                  {ag.tipoAgendamento || "Agendamento"}
                </p>
                <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#007EA7] text-[#007EA7] shadow-sm">
                  {ag.statusAgendamento?.nome || "Pendente"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-md border border-[#b9deeb] bg-[#eef8fc] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#00617f]">Data</p>
                  <p className="text-xs font-semibold text-[#004f68] mt-0.5">
                    {ag.dataAgendamento ? formatDate(ag.dataAgendamento) : "Não informada"}
                  </p>
                </div>
                <div className="rounded-md border border-[#b9deeb] bg-[#eef8fc] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#00617f]">Horário</p>
                  <p className="text-xs font-semibold text-[#004f68] mt-0.5">
                    {ag.inicioAgendamento && ag.fimAgendamento
                      ? `${ag.inicioAgendamento.substring(0, 5)} – ${ag.fimAgendamento.substring(0, 5)}`
                      : ag.horaAgendamento || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-white px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Local do serviço
                </p>
                <div className="flex items-start gap-1.5 text-xs text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-[#007EA7] mt-0.5 shrink-0" />
                  <p>{getLocalServico(ag)}</p>
                </div>
              </div>

              {ag.observacao && (
                <div className="rounded-md border border-gray-200 bg-white px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Observações
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{ag.observacao}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function PedidoDetalhe() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [pedido,           setPedido]           = useState(null);
  const [rawPedido,        setRawPedido]         = useState(null);
  const [loading,          setLoading]           = useState(true);
  const [saving,           setSaving]            = useState(false);
  const [error,            setError]             = useState(null);
  const [sidebarOpen,      setSidebarOpen]       = useState(false);
  const [showSuccessModal, setShowSuccessModal]  = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    servico:     true,
    instalacao:  true,
    agendamento: true,
  });

  const [formData, setFormData] = useState({
    clienteNome:         "",
    formaPagamento:      "",
    parcelas:            1,
    observacoes:         "",
    etapaServico:        "",
    produtos:            [],
    servicoNome:         "",
    servicoDescricao:    "",
    servicoPrecoBase:    undefined,
    servicoAtivo:        undefined,
  });

  const [etapaOriginal, setEtapaOriginal] = useState("");
  const temMudancaEtapa = formData.etapaServico !== etapaOriginal;

  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [produtosUsados, setProdutosUsados] = useState({});
  const [produtosQuantidades, setProdutosQuantidades] = useState({});
  const [produtosLivres, setProdutosLivres] = useState("");
  const [estoqueItems, setEstoqueItems] = useState([]);
  const [showAgendamentoSuggestion, setShowAgendamentoSuggestion] = useState(false);
  const [showServicoSuggestion, setShowServicoSuggestion] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalInitialData, setTaskModalInitialData] = useState({});
  const [produtoBusca, setProdutoBusca] = useState({});
  const [produtoDropdownOpen, setProdutoDropdownOpen] = useState({});
  const [produtoDropdownPos, setProdutoDropdownPos] = useState({});

  const toggleSidebar = () => setSidebarOpen((p) => !p);
  const mensagemBloqueioInativacao = "Nao e possivel inativar com agendamento pendente ou em andamento. Cancele/finalize o agendamento antes.";
  const mensagemBloqueioEtapaAnalise = "Nao e possivel alterar para ANALISE DO ORCAMENTO enquanto houver agendamento de orcamento pendente ou em andamento. Essa mudanca so deve ocorrer apos o fim do agendamento.";

  const possuiAgendamentoBloqueante = () => {
    const ags = pedido?.servico?.agendamentos || [];
    return ags.some((ag) => isAgendamentoBloqueante(ag?.statusAgendamento?.nome));
  };

  const possuiAgendamentoOrcamentoEmAberto = () => {
    const ags = pedido?.servico?.agendamentos || [];
    return ags.some((ag) => {
      const tipo = (ag?.tipoAgendamento || "").toString().toUpperCase();
      const ehOrcamento = tipo.includes("ORC") || tipo.includes("VISTORIA");
      return ehOrcamento && isAgendamentoBloqueante(ag?.statusAgendamento?.nome);
    });
  };

  const possuiAgendamentoServicoEmAberto = () => {
    const ags = pedido?.servico?.agendamentos || [];
    return ags.some((ag) => {
      const tipo = (ag?.tipoAgendamento || "").toString().toUpperCase();
      return tipo.includes("SERV") && isAgendamentoBloqueante(ag?.statusAgendamento?.nome);
    });
  };

  const etapaObrigatoriaPorAgendamento = rawPedido?.servico
    ? PedidosService.calcularEtapaServicoPorAgendamentos(
        rawPedido.servico,
        rawPedido?.servico?.etapa?.nome || "PENDENTE",
      )
    : null;
  const etapaTravadaPorAgendamento = rawPedido?.servico
    ? PedidosService.etapaServicoEhObrigatoriaPorAgendamento(rawPedido.servico)
    : false;

  const fetchPedido = async () => {
    setLoading(true);
    try {
      const response = await Api.get(`/pedidos/${id}`);
      if (response.status !== 200) throw new Error("Pedido não encontrado");
      const raw    = response.data;
      setRawPedido(raw);
      const mapped = PedidosService.mapearParaFrontend(raw);
      setPedido(mapped);

      let etapa = raw?.servico
        ? PedidosService.calcularEtapaServicoPorAgendamentos(
            raw.servico,
            raw?.servico?.etapa?.nome || "PENDENTE",
          )
        : "PENDENTE";
      if (!raw?.servico && mapped.status) {
        etapa = typeof mapped.status === "string"
          ? mapped.status
          : mapped.status.nome || "PENDENTE";
      }

      setEtapaOriginal(etapa);
      setFormData({
        clienteNome:         mapped.clienteNome           || "",
        ...parseFormaPagamento(mapped.formaPagamento || ""),
        observacoes:         mapped.observacoes           || "",
        etapaServico:        etapa,
        produtos:            mapped.produtos              || [],
        servicoNome:         mapped.servico?.nome         || "",
        servicoDescricao:    mapped.servico?.descricao    || "",
        servicoPrecoBase:    mapped.servico?.precoBase    || 0,
        servicoAtivo:        mapped.servico?.ativo !== false,
      });
    } catch (err) {
      console.error("Erro ao buscar pedido:", err);
      alert("Erro ao carregar pedido");
      navigate("/Pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedido();
  }, [id]);

  useEffect(() => {
    Api.get("/estoques", { params: { size: 200 } })
      .then((res) => {
        const data = res.data;
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        setEstoqueItems(items);
      })
      .catch(() => {});
  }, []);

  const calcularValorTotal = () =>
    formData.produtos.reduce(
      (acc, p) => acc + (parseFloat(p.quantidade) || 0) * (parseFloat(p.preco) || 0),
      0
    );

  const handleFieldChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const toggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleProdutoChange = (index, field, value) => {
    const updated = [...formData.produtos];
    updated[index] = {
      ...updated[index],
      [field]:
        field === "quantidade" || field === "preco"
          ? parseFloat(value) || 0
          : value,
    };
    setFormData((p) => ({ ...p, produtos: updated }));
  };

  const handleAdicionarProduto = () =>
    setFormData((p) => ({
      ...p,
      produtos: [
        ...p.produtos,
        { nome: "", quantidade: 1, preco: 0, estoqueId: 0, observacao: "" },
      ],
    }));

  const handleRemoverProduto = (index) =>
    setFormData((p) => ({
      ...p,
      produtos: p.produtos.filter((_, i) => i !== index),
    }));

  const executarSave = async (produtosObs = "") => {
    if (saving) return;

    if (formData.servicoAtivo === false && possuiAgendamentoBloqueante()) {
      setError(mensagemBloqueioInativacao);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (
      normalizeStatus(formData.etapaServico) === "ANALISE DO ORCAMENTO" &&
      possuiAgendamentoOrcamentoEmAberto()
    ) {
      setError(mensagemBloqueioEtapaAnalise);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setError(null);
    let requestBody = null;
    
    try {
      const valorTotal  = calcularValorTotal();
      const etapaParaSalvar =
        etapaTravadaPorAgendamento && etapaObrigatoriaPorAgendamento
          ? etapaObrigatoriaPorAgendamento
          : formData.etapaServico || rawPedido?.servico?.etapa?.nome || "PENDENTE";
      requestBody = {
        pedido: {
          valorTotal,
          ativo:
            formData.servicoAtivo !== undefined
              ? formData.servicoAtivo
              : (rawPedido?.ativo !== undefined ? rawPedido.ativo : true),
          formaPagamento: composeFormaPagamento(formData.formaPagamento, formData.parcelas),
          observacao:     formData.observacoes + produtosObs,
          clienteId:      pedido.clienteId || pedido.clienteInfo?.id || null,
          clienteNome:    formData.clienteNome,
          status: {
            tipo: pedido.statusOriginal?.tipo || "PEDIDO",
            nome: pedido.statusOriginal?.nome || "ATIVO",
          },
        },
        servico: rawPedido?.servico
          ? {
              id: rawPedido.servico.id,
              nome: formData.servicoNome || rawPedido.servico.nome || "",
              descricao: formData.servicoDescricao !== undefined ? formData.servicoDescricao : (rawPedido.servico.descricao || ""),
              precoBase: formData.servicoPrecoBase !== undefined ? formData.servicoPrecoBase : (rawPedido.servico.precoBase || 0),
              ativo: formData.servicoAtivo !== undefined ? formData.servicoAtivo : (rawPedido.servico.ativo !== false),
              etapaNome: etapaParaSalvar,
            }
          : null,
        produtos: formData.produtos
          .filter((p) => p.estoqueId && p.estoqueId > 0)
          .map((p) => ({
            estoqueId:              p.estoqueId,
            quantidadeSolicitada:   parseFloat(p.quantidade) || 0,
            precoUnitarioNegociado: parseFloat(p.preco)      || 0,
            observacao:             p.observacao             || "",
          })),
      };

      console.log("🔄 Enviando salvamento:", requestBody);

      const response = await Api.put(`/pedidos/${id}`, requestBody);
      
      console.log("✅ Resposta da API:", response);

      const etapaNormalizada = normalizeStatus(etapaParaSalvar);
      const etapaAnteriorNormalizada = normalizeStatus(etapaOriginal);
      const etapaFoiAlterada = etapaNormalizada !== etapaAnteriorNormalizada;
      const temAgendamentoOrcamentoAtivo = possuiAgendamentoOrcamentoEmAberto();
      const temAgendamentoServicoAtivo = possuiAgendamentoServicoEmAberto();

      await fetchPedido();

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2500);

      if (etapaFoiAlterada && etapaNormalizada === "AGUARDANDO ORCAMENTO" && !temAgendamentoOrcamentoAtivo) {
        setShowAgendamentoSuggestion(true);
        return;
      }

      if (etapaFoiAlterada && etapaNormalizada === "ORCAMENTO APROVADO" && !temAgendamentoServicoAtivo) {
        setShowServicoSuggestion(true);
        return;
      }
    } catch (err) {
      console.error("❌ Erro ao salvar:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.response?.data?.message || err.message,
        data: err.response?.data,
      });
      
      let mensagemErro = "Erro ao salvar";
      const mensagemApi = err.response?.data?.message;
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        mensagemErro = "❌ Acesso negado. Você precisa estar logado para realizar alterações.";
      } else if (err.response?.status === 404) {
        mensagemErro = `❌ ${mensagemApi || "Recurso não encontrado na API."}`;
      } else if (err.response?.status === 400) {
        mensagemErro = `❌ Dados inválidos: ${mensagemApi || "Verifique os dados preenchidos."}`;
      } else if (mensagemApi) {
        mensagemErro = `❌ ${mensagemApi}`;
      } else if (err.message) {
        mensagemErro = `❌ ${err.message}`;
      }
      
      setError(mensagemErro);
      console.error("Payload enviado:", requestBody);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (saving) return;
    if (formData.etapaServico === "CONCLUÍDO") {
      const iniciais = {};
      const qtds = {};
      formData.produtos.forEach((p, i) => {
        iniciais[i] = true;
        qtds[i] = p.quantidade ?? 1;
      });
      setProdutosUsados(iniciais);
      setProdutosQuantidades(qtds);
      setProdutosLivres("");
      setShowFinalizarModal(true);
      return;
    }
    executarSave();
  };

  const handleSaveConfirmed = async () => {
    if (saving) return;
    setShowFinalizarModal(false);
    let obs = "";
    if (formData.produtos.length > 0) {
      const linhas = formData.produtos
        .map((p, i) => {
          const usado = produtosUsados[i] !== false;
          const qtdReservada = parseFloat(p.quantidade) || 0;
          const qtdUsada = usado ? (parseFloat(produtosQuantidades[i]) || qtdReservada) : 0;
          const qtdDevolvida = qtdReservada - qtdUsada;
          const descricao = usado
            ? `Utilizado: ${qtdUsada} un${qtdDevolvida > 0 ? ` (devolve ${qtdDevolvida} ao estoque)` : ""}`
            : `Não utilizado (devolve ${qtdReservada} ao estoque)`;
          return `${p.nome || `Item #${i + 1}`}: ${descricao}`;
        })
        .join("; ");
      obs = `\n\nProdutos — ${linhas}`;
    } else if (produtosLivres.trim()) {
      obs = `\n\nProdutos utilizados — ${produtosLivres.trim()}`;
    }

    // Tentar atualizar agendamentos vinculados com quantidadeUtilizada real
    const agendamentosServico = (pedido?.servico?.agendamentos || []).filter(
      (ag) => ag.tipoAgendamento === "SERVICO" && ag.id,
    );
    for (const ag of agendamentosServico) {
      const agProdutos = ag.agendamentoProdutos ?? ag.produtos ?? [];
      if (agProdutos.length > 0) {
        try {
          const produtosAtualizados = agProdutos.map((ap) => {
            const idx = formData.produtos.findIndex(
              (p) => p.estoqueId === ap.estoque?.id || p.nome === ap.produto?.nome,
            );
            const usado = idx >= 0 ? produtosUsados[idx] !== false : true;
            const qtdUsada = idx >= 0
              ? (usado ? (parseFloat(produtosQuantidades[idx]) || ap.quantidadeReservada) : 0)
              : ap.quantidadeUtilizada ?? 0;
            return {
              produtoId: ap.produto?.id,
              quantidadeUtilizada: qtdUsada,
              quantidadeReservada: ap.quantidadeReservada,
            };
          }).filter((p) => p.produtoId);
          if (produtosAtualizados.length > 0) {
            await Api.put(`/agendamentos/${ag.id}`, {
              tipoAgendamento: ag.tipoAgendamento,
              dataAgendamento: ag.dataAgendamento,
              inicioAgendamento: ag.inicioAgendamento,
              fimAgendamento: ag.fimAgendamento,
              statusAgendamento: ag.statusAgendamento,
              observacao: ag.observacao || "",
              endereco: ag.endereco || {},
              funcionariosIds: (ag.funcionarios || []).map((f) => f.id),
              produtos: produtosAtualizados,
            });
          }
        } catch (err) {
          console.warn("Não foi possível atualizar produtos do agendamento:", err);
        }
      }
    }

    executarSave(obs);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007EA7] mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!pedido) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pedido não encontrado</p>
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

  const valorTotal    = calcularValorTotal();
  const endereco      = pedido.clienteInfo?.endereco;
  const agendamentos  = pedido.servico?.agendamentos || [];
  const servicoInfo   = pedido.servico || null;
  const produtosCount = formData.produtos.length;

  return (
    <div className="flex bg-[#f7f9fa] h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ── Coluna principal ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* ── Área de scroll ── */}
        <main className="flex-1 overflow-y-auto px-6 pt-20 pb-6 flex justify-center">
          <div className="w-full max-w-[1400px] flex flex-col gap-5">

            {/* Topbar */}
            <div className="relative py-5 min-h-[106px] flex items-center justify-center">
              <button
                onClick={() => navigate("/Pedidos", { state: { initialTab: "servicos" } })}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer border border-gray-300 rounded-md px-4 py-2.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Serviços
              </button>

              <div className="text-center drop-shadow-sm flex flex-col items-center justify-center gap-2">
                <p className="text-xl font-bold text-gray-800 leading-tight flex items-center justify-center gap-3">
                  <span className="inline-flex items-center justify-center bg-[#e0f2fa] p-1.5 rounded-md shadow-sm">
                    {/* w-4.5 é inválido no Tailwind — corrigido para w-[18px] */}
                    <Wrench className="w-[18px] h-[18px] text-[#007EA7]" />
                  </span>
                  Pedido #{String(pedido.id).padStart(3, "0")}
                </p>
                <p className="text-sm text-gray-500 mt-6">
                  {formatDate(pedido.dataCompra)} · {pedido.clienteNome}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❌</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">Erro ao Salvar</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap break-words">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper */}
            <Stepper status={formData.etapaServico || pedido.servico?.etapa || pedido.status} />

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Coluna esquerda (1/3) */}
              <div className="flex flex-col gap-8">

                {/* CLIENTE */}
                <SectionCard title="CLIENTE">
                  <div className="p-6 flex flex-col gap-5">
                    <FieldGroup label="Nome">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                        {formData.clienteNome}
                      </div>
                    </FieldGroup>
                    {pedido.clienteInfo?.email && (
                      <FieldGroup label="E-mail">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate shadow-sm">
                          {pedido.clienteInfo.email}
                        </div>
                      </FieldGroup>
                    )}
                    {pedido.clienteInfo?.telefone && (
                      <FieldGroup label="Telefone">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                          {pedido.clienteInfo.telefone}
                        </div>
                      </FieldGroup>
                    )}
                    {pedido.clienteInfo?.cpf && (
                      <FieldGroup label="CPF">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                          {pedido.clienteInfo.cpf}
                        </div>
                      </FieldGroup>
                    )}
                  </div>
                </SectionCard>

                {/* ENDEREÇO */}
                <SectionCard title="ENDEREÇO">
                  <div className="p-6">
                    {endereco ? (
                      <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-3 gap-4">
                          <FieldGroup label="Rua" className="col-span-2">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate shadow-sm">
                              {endereco.rua || "—"}
                            </div>
                          </FieldGroup>
                          <FieldGroup label="Nº">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 text-center shadow-sm">
                              {endereco.numero || "s/n"}
                            </div>
                          </FieldGroup>
                        </div>
                        <FieldGroup label="Bairro">
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                            {endereco.bairro || "—"}
                          </div>
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-4">
                          <FieldGroup label="Cidade">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate shadow-sm">
                              {endereco.cidade || "—"}
                            </div>
                          </FieldGroup>
                          <FieldGroup label="CEP">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                              {endereco.cep || "—"}
                            </div>
                          </FieldGroup>
                        </div>
                        <button
                          onClick={() => navigate("/geo-localizacao")}
                          className="w-full mt-2 flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-100 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          Ver no Mapa
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-md shadow-sm">
                        Endereço não informado
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* Coluna direita (2/3) */}
              <div className="lg:col-span-2 flex flex-col gap-7">

                {/* SERVIÇO */}
                <SectionCard
                  title="SERVIÇO"
                  collapsible
                  isOpen={expandedSections.servico}
                  onToggle={() => toggleSection("servico")}
                >
                  <div className="p-6 rounded-b-lg bg-[#f5fbfe] border-t border-[#deedf3] flex flex-col gap-6">
                    <FieldGroup label="Nome do Serviço">
                      <input
                        type="text"
                        value={formData.servicoNome || servicoInfo?.nome || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, servicoNome: e.target.value }))}
                        placeholder="Nome do serviço"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                      />
                    </FieldGroup>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FieldGroup label="Preço Base">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.servicoPrecoBase !== undefined ? formData.servicoPrecoBase : (servicoInfo?.precoBase || 0)}
                          onChange={(e) => setFormData((prev) => ({ ...prev, servicoPrecoBase: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                        />
                      </FieldGroup>
                      <FieldGroup label="Preço Total">
                        <div className="px-3 py-2 bg-white border border-[#b9deeb] rounded-md text-sm text-[#007EA7] font-semibold shadow-sm">
                          {formatCurrency(valorTotal || 0)}
                        </div>
                      </FieldGroup>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="text-left">
                        <h3 className="text-base font-semibold text-gray-900">
                          Informações de Pagamento
                        </h3>
                        <p className="text-md text-gray-500 mt-1">
                          Defina a forma de pagamento e parcelas
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="block text-left text-sm font-bold text-gray-700">
                          Forma de Pagamento
                        </label>
                        <select
                          value={formData.formaPagamento}
                          onChange={(e) => {
                            handleFieldChange("formaPagamento", e.target.value);
                            if (!METODOS_COM_PARCELA.includes(e.target.value)) {
                              handleFieldChange("parcelas", 1);
                            }
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
                        <label className="block text-left text-xs font-semibold text-gray-500 mb-1 pl-1">
                          Observações
                        </label>
                        <textarea
                          rows={2}
                          value={formData.observacoes}
                          onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                          placeholder="Observações sobre o pedido..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] resize-none outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2 pl-1">
                          <label className="block text-left text-xs font-semibold text-gray-500">
                            Etapa do Serviço
                          </label>
                          {temMudancaEtapa && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                              ⚠ Não Salvo
                            </span>
                          )}
                        </div>
                        <select
                          value={formData.etapaServico}
                          onChange={(e) => {
                            if (etapaTravadaPorAgendamento) return;
                            const novaEtapa = e.target.value;
                            if (
                              normalizeStatus(novaEtapa) === "ANALISE DO ORCAMENTO" &&
                              possuiAgendamentoOrcamentoEmAberto()
                            ) {
                              setError(mensagemBloqueioEtapaAnalise);
                              return;
                            }
                            setError(null);
                            if (normalizeStatus(novaEtapa) === "SERVICO AGENDADO") {
                              const endereco = pedido?.clienteInfo?.endereco;
                              const produtosPedido = (rawPedido?.produtos || [])
                                .filter((p) => p.estoqueId)
                                .map((p) => {
                                  const estoqueItem = estoqueItems.find((e) => e.id === p.estoqueId);
                                  const produtoId = estoqueItem?.produto?.id;
                                  if (!produtoId) return null;
                                  return {
                                    id: produtoId,
                                    nome: estoqueItem?.produto?.nome || p.nomeProduto || `Produto #${produtoId}`,
                                    quantidade: p.quantidadeSolicitada || p.quantidade || 1,
                                  };
                                })
                                .filter(Boolean);
                              setTaskModalInitialData({
                                tipoAgendamento: "SERVICO",
                                pedido: {
                                  value: pedido.id,
                                  label: servicoInfo?.nome || formData.servicoNome || `Pedido #${pedido.id}`,
                                  originalData: rawPedido,
                                },
                                produtos: produtosPedido,
                                rua: endereco?.rua || "",
                                cep: endereco?.cep || "",
                                numero: endereco?.numero ? String(endereco.numero) : "",
                                bairro: endereco?.bairro || "",
                                cidade: endereco?.cidade || "",
                                uf: endereco?.uf || "",
                                pais: endereco?.pais || "Brasil",
                                complemento: endereco?.complemento || "",
                              });
                              setShowTaskModal(true);
                              return;
                            }
                            handleFieldChange("etapaServico", novaEtapa);
                          }}
                          className={`w-full px-3 py-2 border-2 rounded-md text-sm text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#007EA7] bg-white outline-none shadow-sm transition-all ${
                            temMudancaEtapa
                              ? "border-amber-400 bg-amber-50"
                              : "border-gray-300 focus:border-[#007EA7]"
                          }`}
                          disabled={etapaTravadaPorAgendamento}
                        >
                          {ETAPA_OPTIONS.map((etapa) => (
                            <option key={etapa} value={etapa}>{etapa}</option>
                          ))}
                        </select>
                        {etapaTravadaPorAgendamento && (
                          <p className="mt-2 text-xs text-[#007EA7]">
                            Etapa definida automaticamente pelos agendamentos vinculados.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-left text-xs font-semibold text-gray-500 mb-1 pl-1">
                          Status do Serviço
                        </label>
                        <select
                          value={formData.servicoAtivo !== undefined ? (formData.servicoAtivo ? "Ativo" : "Inativo") : (servicoInfo?.ativo ? "Ativo" : "Inativo")}
                          onChange={(e) => {
                            const novoAtivo = e.target.value === "Ativo";
                            if (!novoAtivo && possuiAgendamentoBloqueante()) {
                              setError(mensagemBloqueioInativacao);
                              return;
                            }
                            setError(null);
                            setFormData((prev) => ({ ...prev, servicoAtivo: novoAtivo }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] bg-white outline-none shadow-sm"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                        Descrição do Serviço
                      </label>
                      <textarea
                        rows={3}
                        value={formData.servicoDescricao !== undefined ? formData.servicoDescricao : (servicoInfo?.descricao || "")}
                        onChange={(e) => setFormData((prev) => ({ ...prev, servicoDescricao: e.target.value }))}
                        placeholder="Descrição do serviço..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] resize-none outline-none shadow-sm"
                      />
                    </div>
                  </div>
                </SectionCard>

                {/* INSTALAÇÃO */}
                <SectionCard
                  title={
                    <>
                      <span className="text-white/80 pr-2">INSTALAÇÃO - atualmente</span>
                      <span className="ml-2 bg-white text-[#002A4B] px-2 py-0.5 rounded-full font-extrabold">
                        {produtosCount} {produtosCount === 1 ? "produto" : "produtos"}
                      </span>
                    </>
                  }
                  collapsible
                  isOpen={expandedSections.instalacao}
                  onToggle={() => toggleSection("instalacao")}
                  action={
                    <button
                      onClick={handleAdicionarProduto}
                      className="flex items-center gap-2 bg-white/25 text-white px-4 py-2 rounded-lg hover:bg-white/35 transition-all cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar Produto
                    </button>
                  }
                >
                  <div className="p-6">
                    {formData.produtos.length === 0 ? (
                      <div className="flex items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm shadow-sm">
                        Nenhum produto adicionado
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        {formData.produtos.map((produto, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative shadow-sm"
                          >
                            <button
                              onClick={() => handleRemoverProduto(index)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-xs font-bold text-[#007EA7] mb-4 uppercase tracking-wide">
                              Item #{String(index + 1).padStart(2, "0")}
                            </p>
                            <div className="flex flex-col gap-4">
                              <FieldGroup label="Produto">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={produtoDropdownOpen[index] ? (produtoBusca[index] ?? "") : (produto.nome || "")}
                                    onFocus={(e) => {
                                      const rect = e.target.getBoundingClientRect();
                                      setProdutoDropdownPos((p) => ({ ...p, [index]: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width } }));
                                      setProdutoDropdownOpen((p) => ({ ...p, [index]: true }));
                                      setProdutoBusca((p) => ({ ...p, [index]: "" }));
                                    }}
                                    onChange={(e) => setProdutoBusca((p) => ({ ...p, [index]: e.target.value }))}
                                    onBlur={() => setTimeout(() => setProdutoDropdownOpen((p) => ({ ...p, [index]: false })), 150)}
                                    placeholder="Buscar produto..."
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                                  />
                                  {produtoDropdownOpen[index] && produtoDropdownPos[index] && (
                                    <div
                                      className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl max-h-52 overflow-y-auto"
                                      style={{ top: produtoDropdownPos[index].top + 4, left: produtoDropdownPos[index].left, width: produtoDropdownPos[index].width }}
                                    >
                                      {estoqueItems
                                        .filter((item) => {
                                          const nome = item.produto?.nome || item.nomeProduto || item.nome || "";
                                          const busca = produtoBusca[index] || "";
                                          return nome.toLowerCase().includes(busca.toLowerCase());
                                        })
                                        .slice(0, 30)
                                        .map((item) => {
                                          const nome = item.produto?.nome || item.nomeProduto || item.nome || `Produto #${item.id}`;
                                          return (
                                            <button
                                              key={item.id}
                                              type="button"
                                              onMouseDown={() => {
                                                const updated = [...formData.produtos];
                                                updated[index] = {
                                                  ...updated[index],
                                                  estoqueId: item.id,
                                                  nome,
                                                  preco: item.produto?.preco ?? item.produto?.precoVenda ?? item.preco ?? updated[index].preco ?? 0,
                                                };
                                                setFormData((p) => ({ ...p, produtos: updated }));
                                                setProdutoDropdownOpen((p) => ({ ...p, [index]: false }));
                                              }}
                                              className="w-full text-left px-3 py-2 text-xs hover:bg-[#eef8fc] hover:text-[#007EA7] transition-colors cursor-pointer"
                                            >
                                              {nome}
                                            </button>
                                          );
                                        })}
                                      {estoqueItems.filter((item) => {
                                        const nome = item.produto?.nome || item.nomeProduto || item.nome || "";
                                        return nome.toLowerCase().includes((produtoBusca[index] || "").toLowerCase());
                                      }).length === 0 && (
                                        <p className="px-3 py-2 text-xs text-gray-400">Nenhum produto encontrado</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </FieldGroup>
                              <div className="grid grid-cols-3 gap-3">
                                <FieldGroup label="Qtd">
                                  <input
                                    type="number"
                                    min="1"
                                    value={produto.quantidade}
                                    onChange={(e) => handleProdutoChange(index, "quantidade", e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                                  />
                                </FieldGroup>
                                <FieldGroup label="Preço Unit.">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={produto.preco}
                                    onChange={(e) => handleProdutoChange(index, "preco", e.target.value)}
                                    placeholder="0,00"
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                                  />
                                </FieldGroup>
                                <div className="flex flex-col">
                                  <label className="text-left text-xs font-semibold text-gray-500 mb-1 pl-1">
                                    Subtotal
                                  </label>
                                  <div className="px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs font-bold text-[#007EA7] text-center shadow-sm">
                                    {formatCurrency(
                                      (parseFloat(produto.quantidade) || 0) *
                                        (parseFloat(produto.preco) || 0)
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.produtos.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                        <p className="text-sm font-bold text-gray-800">
                          Total:{" "}
                          <span className="text-[#007EA7]">{formatCurrency(valorTotal)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* AGENDAMENTO */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#002A4B] px-5 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">Agendamento</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/70 hidden sm:block">
                        {formatDate(pedido.dataCompra)} · {pedido.status}
                      </span>
                      <button
                        onClick={() => toggleSection("agendamento")}
                        className="h-8 w-8 flex items-center justify-center rounded-md border border-white/25 text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label={
                          expandedSections.agendamento ? "Recolher agendamento" : "Expandir agendamento"
                        }
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSections.agendamento ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  {expandedSections.agendamento && (
                    <AgendamentoTabs agendamentos={agendamentos} />
                  )}
                </div>

              </div>
            </div>

            {/* Espaço inferior para não ficar escondido atrás da barra fixa */}
            <div className="h-6" />
          </div>
        </main>

        {/* ── Barra de ações FIXA na parte inferior ── */}
        <div className="shrink-0 border-t-2 bg-white px-6 py-3 flex items-center justify-between gap-4 shadow-[0_-2px_12px_rgba(0,0,0,0.1)]" style={{ borderColor: temMudancaEtapa ? "#f59e0b" : "#e5e7eb" }}>
          {/* Mensagem de mudança de etapa */}
          {temMudancaEtapa ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-sm font-semibold text-amber-700">
                ⚠ Etapa modificada: <span className="text-amber-900">{formData.etapaServico}</span> — Clique em "Salvar Alterações" para confirmar
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 hidden sm:block">
              Pedido #{String(pedido.id).padStart(3, "0")} · {pedido.clienteNome}
            </p>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => navigate(`/Agendamentos`, { state: { servicoId: id, clienteNome: pedido.clienteNome, servicoNome: servicoInfo?.nome || formData.servicoNome } })}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
              title="Agendar orçamento ou serviço"
            >
              <Calendar className="w-4 h-4" />
              Agendar
            </button>

            <button
              onClick={() => navigate(`/Servicos/${id}/orcamentos`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Visualizar Orçamentos
            </button>

            <button
              onClick={() => navigate(`/Pedidos/${id}/orcamento`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer transition-all ${
                temMudancaEtapa
                  ? "bg-amber-500 hover:bg-amber-600 animate-pulse ring-2 ring-amber-300"
                  : "bg-[#007EA7] hover:bg-[#006891]"
              } disabled:opacity-50`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {temMudancaEtapa ? "Salvar Etapa" : "Salvar Alterações"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Sucesso!"
        description="Pedido atualizado com sucesso!"
        duration={2500}
      />

      <TaskCreateModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={() => {
          setShowTaskModal(false);
          navigate("/Agendamentos");
        }}
        initialData={taskModalInitialData}
      />

      {showAgendamentoSuggestion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-[#002A4B] px-6 py-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Agendar Orçamento?
              </h3>
              <p className="text-xs text-white/70 mt-1">
                O serviço está aguardando orçamento. Deseja criar um agendamento de orçamento agora?
              </p>
            </div>
            <div className="px-6 py-5 text-sm text-gray-600 leading-relaxed">
              Um agendamento de orçamento permite definir data, horário e local para a vistoria com o cliente.
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setShowAgendamentoSuggestion(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Agora não
              </button>
              <button
                onClick={() => {
                  setShowAgendamentoSuggestion(false);
                  const endereco = pedido.clienteInfo?.endereco;
                  setTaskModalInitialData({
                    tipoAgendamento: "ORCAMENTO",
                    pedido: {
                      value: pedido.id,
                      label: servicoInfo?.nome || formData.servicoNome || `Pedido #${pedido.id}`,
                      originalData: rawPedido,
                    },
                    rua: endereco?.rua || "",
                    cep: endereco?.cep || "",
                    numero: endereco?.numero ? String(endereco.numero) : "",
                    bairro: endereco?.bairro || "",
                    cidade: endereco?.cidade || "",
                    uf: endereco?.uf || "",
                    pais: endereco?.pais || "Brasil",
                    complemento: endereco?.complemento || "",
                  });
                  setShowTaskModal(true);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#007EA7] rounded-lg hover:bg-[#006891] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {showServicoSuggestion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-[#002A4B] px-6 py-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Agendar Serviço?
              </h3>
              <p className="text-xs text-white/70 mt-1">
                O orçamento foi aprovado. Deseja criar um agendamento de serviço agora?
              </p>
            </div>
            <div className="px-6 py-5 text-sm text-gray-600 leading-relaxed">
              Um agendamento de serviço permite definir data, horário, local e equipe para a execução do serviço com o cliente.
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setShowServicoSuggestion(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Agora não
              </button>
              <button
                onClick={() => {
                  setShowServicoSuggestion(false);
                  const endereco = pedido.clienteInfo?.endereco;
                  setTaskModalInitialData({
                    tipoAgendamento: "ORCAMENTO",
                    pedido: {
                      value: pedido.id,
                      label: formData.servicoNome || rawPedido?.servico?.nome || `Pedido #${pedido.id}`,
                      originalData: rawPedido,
                    },
                    rua: endereco?.rua || "",
                    cep: endereco?.cep || "",
                    numero: endereco?.numero ? String(endereco.numero) : "",
                    bairro: endereco?.bairro || "",
                    cidade: endereco?.cidade || "",
                    uf: endereco?.uf || "",
                    pais: endereco?.pais || "Brasil",
                    complemento: endereco?.complemento || "",
                  });
                  setShowTaskModal(true);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#007EA7] rounded-lg hover:bg-[#006891] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalizarModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-[#002A4B] px-6 py-5">
              <h3 className="text-base font-bold text-white">Finalizar Serviço — Produtos Utilizados</h3>
              <p className="text-xs text-white/70 mt-1.5">
                Informe quais produtos foram utilizados e as quantidades reais. O excedente será devolvido ao estoque.
              </p>
            </div>

            <div className="p-6 flex flex-col gap-4 max-h-[400px] overflow-y-auto">
              {formData.produtos.length > 0 ? (
                formData.produtos.map((p, i) => {
                  const usado = produtosUsados[i] !== false;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors ${usado ? "border-[#b9deeb] bg-[#eef8fc]" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={usado}
                          onChange={(e) => setProdutosUsados((prev) => ({ ...prev, [i]: e.target.checked }))}
                          className="w-4 h-4 accent-[#007EA7] cursor-pointer shrink-0"
                        />
                        <span className="text-sm font-semibold text-gray-800 flex-1">
                          {p.nome || `Item #${i + 1}`}
                          <span className="text-gray-400 font-normal ml-2 text-xs">
                            (reservado: {p.quantidade ?? 0} un)
                          </span>
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${usado ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                          {usado ? "Utilizado" : "Não utilizado"}
                        </span>
                      </div>
                      {usado && (
                        <div className="flex items-center gap-3 pl-7">
                          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                            Qtd. utilizada:
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            max={p.quantidade ?? undefined}
                            value={produtosQuantidades[i] ?? p.quantidade ?? 1}
                            onChange={(e) =>
                              setProdutosQuantidades((prev) => ({ ...prev, [i]: parseFloat(e.target.value) || 0 }))
                            }
                            className="w-24 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none"
                          />
                          {(() => {
                            const reservado = parseFloat(p.quantidade) || 0;
                            const utilizado = parseFloat(produtosQuantidades[i] ?? reservado) || 0;
                            const devolve = reservado - utilizado;
                            return devolve > 0 ? (
                              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                devolve {devolve.toFixed(2)} ao estoque
                              </span>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-500">
                    Nenhum produto cadastrado neste serviço. Descreva abaixo quais materiais foram utilizados (opcional):
                  </p>
                  <textarea
                    rows={4}
                    value={produtosLivres}
                    onChange={(e) => setProdutosLivres(e.target.value)}
                    placeholder="Ex: Silicone transparente, fita dupla face, vidro 4mm..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] resize-none outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setShowFinalizarModal(false)}
                className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfirmed}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#007EA7] rounded-lg hover:bg-[#006891] transition-colors cursor-pointer"
              >
                Confirmar e Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  badge,
  action,
  children,
  collapsible = false,
  isOpen      = true,
  onToggle,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-[#002A4B] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
          {badge && (
            <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {action && action}
          {collapsible && (
            <button
              type="button"
              onClick={onToggle}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-white/25 text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && children}
    </div>
  );
}

function FieldGroup({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-left text-xs font-semibold text-gray-500 mb-1 pl-1">
        {label}
      </label>
      {children}
    </div>
  );
}
