import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import Api from "../../api/client/Api";
import OrcamentosService from "../../api/services/orcamentosService";
import { useOrcamentoProgress } from "../../context/OrcamentoProgressContext.jsx";
import {
  Trash2,
  Plus,
  ArrowLeft,
  Package,
  AlertCircle,
  Save,
  CheckCircle,
  Download,
  Loader2,
  ClipboardList,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import { OrcamentoStatusOptions } from "../../types/enums";


const tw = {
  card: "bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden",
  cardHeader: "bg-[#002A4B] px-5 py-4 flex items-center justify-between",
  cardBody: "p-6",
  label:
    "text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-[0.05em]",
  input:
    "w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 bg-white outline-none transition-colors box-border font-[inherit] focus:border-[#007EA7] focus:ring-2 focus:ring-[#007EA7]/15",
  inputReadOnly: "!bg-[#f5fbfe] !text-[#004f68] cursor-default",
};

const formatCurrencyBR = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );

const calcularSubtotalItem = (quantidade, preco_unitario, desconto) => {
  const qtd = parseFloat(quantidade) || 0;
  const preco = parseFloat(preco_unitario) || 0;
  const desc = parseFloat(desconto) || 0;
  return Math.max(0, qtd * preco - desc);
};

const calcularSubtotalGeral = (itens) =>
  itens.reduce(
    (acc, item) =>
      acc +
      calcularSubtotalItem(item.quantidade, item.preco_unitario, item.desconto),
    0,
  );

const calcularTotalFinal = (subtotal, descontoGeral) =>
  Math.max(0, subtotal - (parseFloat(descontoGeral) || 0));

const gerarNumeroOrcamento = (pedidoId) => {
  const ano = new Date().getFullYear();
  if (!pedidoId) return "";
  return `ORC-${ano}-P${pedidoId}`;
};

const criarItemVazio = (ordem = 1) => ({
  id: Date.now() + Math.random(),
  produto_id: "",
  descricao: "",
  quantidade: "",
  preco_unitario: "",
  desconto: "",
  observacao: "",
  ordem,
});

const mapearItensDoPedido = (pedido) => {
  if (!pedido?.produtos?.length) return [];

  return pedido.produtos.map((produto, index) => ({
    id: `pedido-${pedido.id}-${produto.id ?? produto.produtoId ?? index}`,
    produto_id: produto.produtoId || "",
    descricao: produto.nomeProduto || produto.nome || "",
    quantidade: String(produto.quantidadeSolicitada ?? produto.quantidade ?? ""),
    preco_unitario: String(produto.precoUnitarioNegociado ?? produto.preco ?? ""),
    desconto: "0",
    observacao: produto.observacao || "",
    ordem: index + 1,
  }));
};

const SectionCard = ({ title, badge, action, children, className = "" }) => (
  <div className={`${tw.card} ${className}`.trim()}>
    <div className={tw.cardHeader}>
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="m-0 text-sm font-bold text-white tracking-wide uppercase">
          {title}
        </h2>
        {badge && (
          <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </div>
);

const OrcamentoHeader = ({ isEdicao = false, onBack }) => (
  <div className="flex flex-col gap-4 py-8 sm:py-5 lg:relative lg:min-h-[106px] lg:items-center lg:justify-center">
    <button
      type="button"
      onClick={onBack}
      className="flex w-full items-center justify-center gap-2.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer border border-gray-300 rounded-md px-4 py-2.5 sm:w-auto lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2"
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar
    </button>

    <div className="text-center drop-shadow-sm flex flex-col items-center justify-center gap-4">
      <p className="text-2xl font-semibold text-gray-800 leading-tight flex items-center justify-center gap-3">
        <ClipboardList className="w-[18px] h-[18px] text-[#007EA7]" />
        {isEdicao ? "Editar Orçamento" : "Gerar Novo Orçamento"}
      </p>
      <p className="text-md text-gray-500 mt-6">
        {isEdicao
          ? "Revise os dados, itens e valores antes de salvar alterações."
          : "Organize os itens e gere um orçamento de um serviço."}
      </p>
    </div>
  </div>
);

const OrcamentoInformacoes = ({ dados, onChange, errors, pedidos = [] }) => {
  const statusAtual =
    OrcamentoStatusOptions.find((s) => s.value === dados.status_id) ||
    OrcamentoStatusOptions[0];
  const clienteNome = dados.cliente_nome;

  return (
    <SectionCard title="Informações Gerais">
      <div className="p-6 bg-[#f5fbfe] border-t border-[#deedf3]">
        <div
          className="grid gap-8"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          <UniversalInput
            label="Número do Orçamento"
            value={dados.numero_orcamento}
            placeholder="Selecione um pedido"
            readOnly
          />

          <UniversalInput
            label="Cliente"
            required
            error={errors.cliente_id}
            value={clienteNome}
            placeholder="Selecione um pedido"
            readOnly
          />

          <UniversalInput
            as="select"
            label="Pedido"
            required
            error={errors.pedido_id}
            value={dados.pedido_id}
            onChange={(e) => onChange("pedido_id", e.target.value)}
            placeholder="Selecione o pedido"
            options={pedidos.map((p) => ({
              value: p.id,
              label: p.produtosDesc
                ? `Pedido #${p.id} — ${p.produtosDesc}`
                : `Pedido #${p.id}`,
            }))}
          />

          <div className="flex flex-row items-center justify-center gap-2">
            <UniversalInput
              as="select"
              label="Status"
              wrapperClassName="flex-1"
              value={dados.status_id}
              onChange={(e) => onChange("status_id", e.target.value)}
              options={OrcamentoStatusOptions.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
            <div
              className="mt-6 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: statusAtual.color }}
            />
          </div>

          <UniversalInput
            label="Data do Orçamento"
            type="date"
            required
            error={errors.data_orcamento}
            value={dados.data_orcamento}
            onChange={(e) => onChange("data_orcamento", e.target.value)}
          />

          <UniversalInput
            label="Prazo de Instalação"
            type="date"
            value={dados.prazo_instalacao}
            onChange={(e) => onChange("prazo_instalacao", e.target.value)}
          />

          <UniversalInput
            label="Garantia"
            placeholder="Ex: 12 meses"
            value={dados.garantia}
            onChange={(e) => onChange("garantia", e.target.value)}
          />

          <UniversalInput
            as="select"
            label="Forma de Pagamento"
            value={dados.forma_pagamento}
            onChange={(e) => onChange("forma_pagamento", e.target.value)}
            placeholder="Selecione"
            options={[
              { value: "BOLETO", label: "Boleto Bancário" },
              { value: "PIX", label: "PIX" },
              { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
              { value: "TRANSFERENCIA", label: "Transferência Bancária" },
              { value: "CHEQUE", label: "Cheque" },
              { value: "DINHEIRO", label: "Dinheiro" },
            ]}
          />

          <UniversalInput
            as="textarea"
            label="Observações"
            wrapperClassName="col-span-full"
            placeholder="Anotações internas..."
            value={dados.observacoes}
            onChange={(e) => onChange("observacoes", e.target.value)}
            className="min-h-[88px] resize-y"
          />
        </div>
      </div>
    </SectionCard>
  );
};

const OrcamentoItemRow = ({
  item,
  index,
  onChange,
  onProductSelect,
  onRemove,
  errors,
  produtos = [],
}) => {
  const subtotal = calcularSubtotalItem(
    item.quantidade,
    item.preco_unitario,
    item.desconto,
  );
  const errItem = errors[item.id] || {};

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#deedf3] bg-[#f5fbfe] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#007EA7] text-[11px] font-bold text-white">
            {String(index + 1).padStart(2, "0")}
          </div>
          <span className="text-sm font-semibold text-[#004f68]">Item</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="!bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
        >
          Remover
        </Button>
      </div>

      <div className="p-6">
        <div className="mb-7 grid gap-6" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <UniversalInput
            as="select"
            label="Produto (opcional)"
            value={item.produto_id}
            onChange={(e) => onProductSelect(item.id, e.target.value)}
            placeholder="Sem produto vinculado"
            options={produtos.map((p) => ({
              value: p.id,
              label: p.nome,
            }))}
          />
          <UniversalInput
            label="Descrição"
            required
            error={errItem.descricao}
            placeholder="Descrição do item"
            value={item.descricao}
            onChange={(e) => onChange(item.id, "descricao", e.target.value)}
          />
        </div>

        <div className="mb-7 grid grid-cols-4 gap-6">
          <UniversalInput
            label="Quantidade"
            type="number"
            value={item.quantidade}
            onChange={(e) => onChange(item.id, "quantidade", e.target.value)}
          />
          <UniversalInput
            label="Preço Unitário (R$)"
            type="number"
            value={item.preco_unitario}
            onChange={(e) => onChange(item.id, "preco_unitario", e.target.value)}
          />
          <UniversalInput
            label="Desconto (R$)"
            type="number"
            value={item.desconto}
            onChange={(e) => onChange(item.id, "desconto", e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className={tw.label}>Subtotal</label>
            <div className={`${tw.input} ${tw.inputReadOnly} flex items-center font-bold text-[#007EA7]`}>
              {formatCurrencyBR(subtotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrcamentoItens = ({
  itens,
  onAdd,
  onRemove,
  onChange,
  onProductSelect,
  errors,
  produtos = [],
}) => (
  <SectionCard
    title="Itens do Orçamento"
    action={
      <Button variant="primary" onClick={onAdd} startIcon={<Plus size={15} />}>
        Adicionar Item
      </Button>
    }
  >
    <div className="flex flex-col gap-7 p-6 bg-[#f5fbfe] border-t border-[#deedf3]">
      {itens.length === 0 ? (
        <div className="flex gap-4 items-center justify-center rounded-xl border-2 border-dashed border-[#b9deeb] py-10 text-center text-[#6b8a97] bg-white">
          <Package size={32} className="mx-auto mb-2.5 opacity-40" />
          <div className="flex flex-col" >
            <p className="m-0 text-sm">Nenhum item adicionado.</p>
            <p className="mt-1 text-xs">Clique em &quot;Adicionar Item&quot; para começar.</p>
           </div>
        </div>
      ) : (
        itens.map((item, index) => (
          <OrcamentoItemRow
            key={item.id}
            item={item}
            index={index}
            onChange={onChange}
            onProductSelect={onProductSelect}
            onRemove={onRemove}
            errors={errors}
            produtos={produtos}
          />
        ))
      )}
    </div>
  </SectionCard>
);

const OrcamentoResumo = ({
  subtotalGeral,
  descontoGeral,
  totalFinal,
  onDescontoChange,
}) => (
  <SectionCard title="Resumo Financeiro" className="sticky top-24">
    <div className="flex flex-col gap-8 p-6 bg-[#f5fbfe] border-t border-[#deedf3]">
      <UniversalInput
        label="Desconto Geral (R$)"
        type="number"
        className="!border-[#b9deeb] !bg-white"
        value={descontoGeral}
        onChange={(e) => onDescontoChange(e.target.value)}
        placeholder="0"
      />
      <div className="flex items-center justify-between rounded-md border border-[#b9deeb] bg-white px-5 py-4">
        <span className={tw.label}>Subtotal Geral</span>
        <span className="text-base font-bold text-[#004f68]">{formatCurrencyBR(subtotalGeral)}</span>
      </div>
      <div className="flex items-center justify-between rounded-md bg-[#002A4B] px-5 py-5 shadow-sm">
        <span className="text-sm font-bold uppercase tracking-wide text-white">Total Final</span>
        <span className="text-2xl font-extrabold text-white">{formatCurrencyBR(totalFinal)}</span>
      </div>
    </div>
  </SectionCard>
);

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const map = {
    success: {
      cls: "bg-green-50 border-green-200",
      text: "text-green-800",
      icon: <CheckCircle size={16} className="shrink-0 text-green-600" />,
    },
    error: {
      cls: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <AlertCircle size={16} className="shrink-0 text-red-600" />,
    },
  };
  const c = map[type] || map.success;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border px-4 py-3.5 shadow-2xl ${c.cls}`}
    >
      {c.icon}
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 cursor-pointer border-none bg-transparent text-base"
      >
        ×
      </button>
    </div>
  );
};

export default function OrcamentoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pedidoId, orcamentoId } = useParams();
  const returnTo = location.state?.returnTo;
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingOrcamento, setIsLoadingOrcamento] = useState(!!orcamentoId);

  const [dadosGerais, setDadosGerais] = useState({
    numero_orcamento: gerarNumeroOrcamento(pedidoId || ""),
    cliente_id: "",
    cliente_nome: "",
    pedido_id: pedidoId || "",
    status_id: "RASCUNHO",
    data_orcamento: new Date().toISOString().split("T")[0],
    prazo_instalacao: "",
    garantia: "",
    forma_pagamento: "",
    observacoes: "",
  });

  const [itens, setItens] = useState([]);
  const [descontoGeral, setDescontoGeral] = useState("");
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { startProgress } = useOrcamentoProgress();

  const [savedOrcamentoId, setSavedOrcamentoId] = useState(orcamentoId || null);

  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    const extrairLista = (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.content)) return data.content;
      return [];
    };

    Api.get("/pedidos")
      .then((res) => {
        const lista = extrairLista(res.data);
        setPedidos(
          lista.map((p) => ({
            id: p.id,
            clienteId: p.cliente?.id || "",
            clienteNome: p.cliente?.nome || "",
            produtos: Array.isArray(p.produtos) ? p.produtos : [],
            produtosDesc:
              p.servico?.nome ||
              p.produtos?.map((i) => i.nomeProduto).join(", ") ||
              "",
          })),
        );
      })
      .catch(() => setPedidos([]));

    Api.get("/estoques")
      .then((res) => {
        const lista = extrairLista(res.data);
        setProdutos(
          lista
            .map((e) => ({
              id: e.produto?.id,
              nome: e.produto?.nome,
              preco: e.produto?.preco ?? "",
            }))
            .filter((p) => p.id && p.nome),
        );
      })
      .catch(() => setProdutos([]));
  }, []);

  useEffect(() => {
    if (!orcamentoId) {
      setIsLoadingOrcamento(false);
      return;
    }

    OrcamentosService.buscarPorId(orcamentoId)
      .then((result) => {
        if (result.success && result.data) {
          const orc = result.data;
          setDadosGerais({
            numero_orcamento: orc.numeroOrcamento || "",
            cliente_id: String(orc.clienteId || ""),
            cliente_nome: orc.clienteNome || "",
            pedido_id: String(orc.pedidoId || ""),
            status_id: orc.statusNome || orc.statusId || "RASCUNHO",
            data_orcamento: orc.dataOrcamento?.split("T")[0] || "",
            prazo_instalacao: orc.prazoInstalacao?.split("T")[0] || "",
            garantia: orc.garantia || "",
            forma_pagamento: orc.formaPagamento || "",
            observacoes: orc.observacoes || "",
          });

          if (orc.itens && Array.isArray(orc.itens)) {
            setItens(
              orc.itens.map((item) => ({
                id: item.id || Date.now() + Math.random(),
                produto_id: item.produtoId || "",
                descricao: item.descricao || "",
                quantidade: String(item.quantidade || ""),
                preco_unitario: String(item.precoUnitario || ""),
                desconto: String(item.desconto || ""),
                observacao: item.observacao || "",
                ordem: item.ordem || 1,
              })),
            );
          }

          setDescontoGeral(String(orc.descontoGeral || ""));
          setLastSaved(new Date());
        }
      })
      .catch(() => {
        setToast({
          message: "Erro ao carregar orçamento.",
          type: "error",
        });
        setTimeout(() => setToast(null), 3000);
      })
      .finally(() => setIsLoadingOrcamento(false));
  }, [orcamentoId]);

  const subtotalGeral = useMemo(() => calcularSubtotalGeral(itens), [itens]);
  const totalFinal = useMemo(
    () => calcularTotalFinal(subtotalGeral, descontoGeral),
    [subtotalGeral, descontoGeral],
  );

  useEffect(() => {
    if (!pedidos.length || !dadosGerais.pedido_id) return;
    const pedido = pedidos.find(
      (p) => String(p.id) === String(dadosGerais.pedido_id),
    );
    if (pedido) {
      setDadosGerais((prev) => ({
        ...prev,
        cliente_id: String(pedido.clienteId || ""),
        cliente_nome: pedido.clienteNome || "",
        numero_orcamento: gerarNumeroOrcamento(pedido.id),
      }));
    }
  }, [pedidos, dadosGerais.pedido_id]); 

  useEffect(() => {
    if (orcamentoId || !pedidos.length || !dadosGerais.pedido_id || itens.length > 0) {
      return;
    }

    const pedidoSelecionado = pedidos.find(
      (p) => String(p.id) === String(dadosGerais.pedido_id),
    );

    if (!pedidoSelecionado) return;

    const itensDoPedido = mapearItensDoPedido(pedidoSelecionado);
    if (itensDoPedido.length > 0) {
      setItens(itensDoPedido);
    }
  }, [orcamentoId, pedidos, dadosGerais.pedido_id, itens.length]);

  const handleDadosChange = useCallback(
    (field, value) => {
      const pedidoSelecionado =
        field === "pedido_id"
          ? pedidos.find((p) => String(p.id) === String(value))
          : null;

      setDadosGerais((prev) => {
        const updates = { ...prev, [field]: value };
        if (field === "pedido_id") {
          updates.numero_orcamento = gerarNumeroOrcamento(value);
          if (pedidoSelecionado?.clienteId) {
            updates.cliente_id = String(pedidoSelecionado.clienteId);
          }
          updates.cliente_nome = pedidoSelecionado?.clienteNome || "";
        }
        return updates;
      });

      if (field === "pedido_id") {
        setItens(mapearItensDoPedido(pedidoSelecionado));
      }

      if (errors[field])
        setErrors((prev) => {
          const e = { ...prev };
          delete e[field];
          return e;
        });
    },
    [errors, pedidos],
  );

  const handleAddItem = useCallback(
    () => setItens((prev) => [...prev, criarItemVazio(prev.length + 1)]),
    [],
  );
  const handleRemoveItem = useCallback(
    (id) =>
      setItens((prev) =>
        prev
          .filter((item) => item.id !== id)
          .map((item, i) => ({ ...item, ordem: i + 1 })),
      ),
    [],
  );
  const handleItemChange = useCallback(
    (id, field, value) =>
      setItens((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      ),
    [],
  );

  const handleItemProductSelect = useCallback(
    (id, produtoId) => {
      const produto = produtos.find((p) => String(p.id) === String(produtoId));
      setItens((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                produto_id: produtoId,
                descricao: produto ? produto.nome : item.descricao,
                preco_unitario: produto
                  ? String(produto.preco)
                  : item.preco_unitario,
              }
            : item,
        ),
      );
    },
    [produtos],
  );

  const validar = useCallback(() => {
    const newErrors = {};
    if (!dadosGerais.pedido_id) newErrors.pedido_id = "Pedido é obrigatório";
    const newItemErrors = {};
    itens.forEach((item) => {
      if (!item.descricao.trim())
        newItemErrors[item.id] = { descricao: "Descrição obrigatória" };
    });
    setErrors(newErrors);
    setItemErrors(newItemErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      Object.keys(newItemErrors).length === 0
    );
  }, [dadosGerais, itens]);

  const handleSaveDraft = async () => {
    if (!validar()) {
      setToast({ message: "Corrija os erros antes de salvar.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const payload = OrcamentosService.mapearParaBackend(
        { ...dadosGerais, status_id: "RASCUNHO" },
        itens,
        subtotalGeral,
        descontoGeral,
        totalFinal,
      );

      const result = savedOrcamentoId
        ? await OrcamentosService.atualizarOrcamento(savedOrcamentoId, payload)
        : await OrcamentosService.criarOrcamento(payload);

      if (result.success) {
        if (!savedOrcamentoId && result.data?.id) setSavedOrcamentoId(result.data.id);
        setLastSaved(new Date());
        queryClient.invalidateQueries({ queryKey: queryKeys.orcamentos.all() });
        setToast({ message: "Rascunho salvo com sucesso!", type: "success" });
        setTimeout(() => {
          setToast(null);
          navigate(returnTo ?? `/Servicos/${pedidoId || dadosGerais.pedido_id}/orcamentos`);
        }, 2000);
      } else {
        setToast({ message: result.error || "Erro ao salvar rascunho.", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast({ message: "Erro ao salvar rascunho.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!validar()) {
      setToast({
        message: "Corrija os erros antes de gerar o orçamento.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const payload = OrcamentosService.mapearParaBackend(
        dadosGerais,
        itens,
        subtotalGeral,
        descontoGeral,
        totalFinal,
      );

      let orcId = savedOrcamentoId ? parseInt(savedOrcamentoId) : null;
      let numeroOrcamento = dadosGerais.numero_orcamento;

      if (!orcId) {
        const createResult = await OrcamentosService.criarOrcamento(payload);
        if (!createResult.success || !createResult.data) {
          setToast({ message: createResult.error || "Erro ao salvar orçamento.", type: "error" });
          setTimeout(() => setToast(null), 4000);
          return;
        }
        orcId = createResult.data.id;
        numeroOrcamento = createResult.data.numeroOrcamento || numeroOrcamento;
        setSavedOrcamentoId(orcId);
        setLastSaved(new Date());
      } else {
        const updateResult = await OrcamentosService.atualizarOrcamento(orcId, payload);
        if (!updateResult.success) {
          setToast({ message: updateResult.error || "Erro ao atualizar orçamento.", type: "error" });
          setTimeout(() => setToast(null), 4000);
          return;
        }
        setLastSaved(new Date());
      }

      const pdfResult = await OrcamentosService.gerarPdf(orcId);
      if (!pdfResult.success) {
        setToast({ message: pdfResult.error || "Erro ao iniciar geração do PDF.", type: "error" });
        setTimeout(() => setToast(null), 4000);
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.orcamentos.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.all() });

      startProgress(orcId, numeroOrcamento);
      setToast({ message: "Orçamento enviado para geração!", type: "success" });
      setTimeout(() => {
        setToast(null);
        navigate(`/Servicos/${pedidoId || dadosGerais.pedido_id}/orcamentos`);
      }, 2000);
    } catch (e) {
      setToast({ message: "Erro ao gerar orçamento.", type: "error" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="app-page flex min-h-screen bg-[#f7f9fa] overflow-x-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="app-content flex-1 flex flex-col">
          <Header
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
          <main className="app-scroll-area flex-1 px-4 pt-20 pb-24 sm:px-6 flex justify-center">
            <div className="w-full max-w-[1400px] flex flex-col gap-5">
            {isLoadingOrcamento ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 size={48} className="animate-spin text-slate-400" />
                <p className="text-slate-500">Carregando orçamento...</p>
              </div>
            ) : (
              <>
                <OrcamentoHeader
                  isEdicao={!!orcamentoId}
                  onBack={() => (returnTo ? navigate(returnTo) : navigate(-1))}
                />
                <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="flex flex-col gap-8">
                    <OrcamentoInformacoes
                      dados={dadosGerais}
                      onChange={handleDadosChange}
                      errors={errors}
                      pedidos={pedidos}
                    />
                    <OrcamentoItens
                      itens={itens}
                      onAdd={handleAddItem}
                      onRemove={handleRemoveItem}
                      onChange={handleItemChange}
                      onProductSelect={handleItemProductSelect}
                      errors={itemErrors}
                      produtos={produtos}
                    />
                  </div>
                  <OrcamentoResumo
                    subtotalGeral={subtotalGeral}
                    descontoGeral={descontoGeral}
                    totalFinal={totalFinal}
                    onDescontoChange={setDescontoGeral}
                  />
                </div>
              </>
            )}
            </div>
          </main>
          <div className="shrink-0 border-t-2 bg-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_-2px_12px_rgba(0,0,0,0.1)]" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-sm text-gray-400 hidden sm:block">
              {lastSaved
                ? `Última atualização: ${lastSaved.toLocaleTimeString("pt-BR")}`
                : `Orçamento #${String(pedidoId || dadosGerais.pedido_id || "").padStart(3, "0")} · ${dadosGerais.cliente_nome || "Cliente não selecionado"}`}
            </p>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                onClick={() => navigate(returnTo ?? -1)}
                className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Cancelar</span>
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-[#002A4B] border border-gray-300 text-white rounded-lg hover:bg-[#01345c] transition-colors text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
                type="button"
              >
                <span className="hidden sm:inline">{isSaving ? "Salvando..." : "Salvar Rascunho"}</span>
                <span className="sm:hidden">Salvar</span>
              </button>

              <button
                onClick={handleSaveAndDownload}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer transition-all bg-[#007EA7] hover:bg-[#006891] disabled:opacity-50"
                type="button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Gerar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
