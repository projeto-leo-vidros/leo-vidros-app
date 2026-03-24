import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  CheckCircle,
  Download,
  Loader2,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import { OrcamentoStatusOptions } from "../../types/enums";

const gerarNumeroOrcamento = (pedidoId) => {
  const ano = new Date().getFullYear();
  if (!pedidoId) return "";
  return `ORC-${ano}-P${pedidoId}`;
};

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

const formatCurrencyBR = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );

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

const tw = {
  card: "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden",
  cardHeader:
    "px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50",
  cardBody: "p-8",
  label:
    "text-[11px] font-semibold text-gray-700 mb-1 block uppercase tracking-[0.05em]",
  input:
    "w-full px-4 py-3 rounded-lg border-[1.5px] border-slate-200 text-sm text-slate-800 bg-white outline-none transition-colors box-border font-[inherit]",
  inputReadOnly: "!bg-slate-50 !text-slate-500 cursor-default",
};

const OrcamentoHeader = () => (
  <div className="mb-10 text-center">
    <h1 className="pb-6 text-2xl font-semibold text-gray-800 sm:text-3xl md:text-4xl">
      Gerar Novo Orçamento
    </h1>
  </div>
);

const OrcamentoInformacoes = ({ dados, onChange, errors, pedidos = [] }) => {
  const statusAtual =
    OrcamentoStatusOptions.find((s) => s.value === dados.status_id) ||
    OrcamentoStatusOptions[0];
  const clienteNome = dados.cliente_nome;

  return (
    <div className={tw.card}>
      <div className={tw.cardHeader}>
        <div className="h-5 w-1.5 rounded-sm bg-[var(--button-color)]" />
        <h2 className="m-0 text-sm font-bold text-slate-800">
          Informações Gerais
        </h2>
      </div>
      <div className={tw.cardBody}>
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

          <div className="flex items-end gap-2">
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
    </div>
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
    <div className={tw.card}>
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary-color)] text-[11px] font-bold text-white">
            {String(index + 1).padStart(2, "0")}
          </div>
          <span className="text-sm font-semibold text-slate-600">Item</span>
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

      <div className="p-7">
        <div
          className="mb-7 grid gap-6"
          style={{ gridTemplateColumns: "1fr 2fr" }}
        >
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
            <div
              className={`${tw.input} ${tw.inputReadOnly} flex items-center font-bold text-[var(--button-color)]`}
            >
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
  <div className={tw.card}>
    <div className={`${tw.cardHeader} justify-between`}>
      <div className="flex items-center gap-2.5">
        <div className="h-5 w-1.5 rounded-sm bg-violet-500" />
        <h2 className="m-0 text-sm font-bold text-slate-800">
          Itens do Orçamento
        </h2>
      </div>
      <Button
        variant="primary"
        onClick={onAdd}
        startIcon={<Plus size={15} />}
      >
        Adicionar Item
      </Button>
    </div>

    <div className="flex flex-col gap-7 p-8">
      {itens.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-400">
          <Package size={32} className="mx-auto mb-2.5 opacity-40" />
          <p className="m-0 text-sm">Nenhum item adicionado.</p>
        
          <p className="mt-1 text-xs">
            Clique em &quot;Adicionar Item&quot; para começar.
          </p>
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
  </div>
);

const OrcamentoResumo = ({
  subtotalGeral,
  descontoGeral,
  totalFinal,
  onDescontoChange,
}) => (
  <div className={`${tw.card} sticky top-24`}>
    <div className={tw.cardHeader}>
      <div className="h-5 w-1.5 rounded-sm bg-emerald-500" />
      <h2 className="m-0 text-sm font-bold text-slate-800">
        Resumo Financeiro
      </h2>
    </div>
    <div className="flex flex-col gap-8 p-8">
      <UniversalInput
        label="Desconto Geral (R$)"
        type="number"
        className="!border-yellow-400 !bg-amber-50"
        value={descontoGeral}
        onChange={(e) => onDescontoChange(e.target.value)}
        placeholder="0"
      />
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-5 py-4">
        <span className={tw.label}>Subtotal Geral</span>
        <span className="text-base font-bold text-slate-700">{formatCurrencyBR(subtotalGeral)}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-[var(--button-color)] px-5 py-5">
        <span className="text-sm font-bold uppercase tracking-wide text-white">Total Final</span>
        <span className="text-2xl font-extrabold text-white">{formatCurrencyBR(totalFinal)}</span>
      </div>
    </div>
  </div>
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
  const { pedidoId } = useParams();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const [itens, setItens] = useState([criarItemVazio(1)]);
  const [descontoGeral, setDescontoGeral] = useState("");
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { startProgress } = useOrcamentoProgress();

  const [savedOrcamentoId, setSavedOrcamentoId] = useState(null);

  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    Api.get("/pedidos")
      .then((res) => {
        const lista = Array.isArray(res.data) ? res.data : [];
        setPedidos(
          lista.map((p) => ({
            id: p.id,
            clienteId: p.cliente?.id || "",
            clienteNome: p.cliente?.nome || "",
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
        const lista = Array.isArray(res.data) ? res.data : [];
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
  }, [pedidos]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDadosChange = useCallback(
    (field, value) => {
      setDadosGerais((prev) => {
        const updates = { ...prev, [field]: value };
        if (field === "pedido_id") {
          updates.numero_orcamento = gerarNumeroOrcamento(value);
          const pedido = pedidos.find((p) => String(p.id) === String(value));
          if (pedido?.clienteId) updates.cliente_id = String(pedido.clienteId);
          updates.cliente_nome = pedido?.clienteNome || "";
        }
        return updates;
      });
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
        setToast({ message: "Rascunho salvo!", type: "success" });
      } else {
        setToast({ message: result.error || "Erro ao salvar rascunho.", type: "error" });
      }
    } catch (e) {
      setToast({ message: "Erro ao salvar rascunho.", type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
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

      const tempId = `temp_${Date.now()}`;
      
      let sseConnection = null;
      const ssePromise = new Promise((resolve) => {
        sseConnection = OrcamentosService.monitorarProgresso(tempId, (eventData) => {
          resolve(eventData);
        });
      });

      const result = await OrcamentosService.criarOrcamento(payload);

      if (result.success && result.data) {
        const orcId = result.data.id;
        setSavedOrcamentoId(orcId);
        setLastSaved(new Date());
        queryClient.invalidateQueries({ queryKey: queryKeys.orcamentos.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
        
        if (sseConnection) {
          sseConnection.close();
        }
        
        startProgress(
          orcId,
          result.data.numeroOrcamento || dadosGerais.numero_orcamento
        );
        setToast({ message: "Orçamento enviado para geração!", type: "success" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({
          message: result.error || "Erro ao gerar orçamento.",
          type: "error",
        });
        if (sseConnection) {
          sseConnection.close();
        }
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      setToast({ message: "Erro ao gerar orçamento.", type: "error" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center bg-[#f7f9fa]">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex w-full flex-1 flex-col items-center">
          <Header
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
          <div className="flex w-full max-w-[1400px] flex-col gap-3 px-6 py-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mt-6 mb-4 self-start"
              startIcon={<ArrowLeft size={16} />}
            >
              Voltar para Pedidos
            </Button>
            <OrcamentoHeader />
            <div
              className="grid items-start gap-8"
              style={{ gridTemplateColumns: "1fr 320px" }}
            >
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
            <div className="mt-15 flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
              <span className="text-xs text-slate-400">
                {lastSaved
                  ? `Última atualização: ${lastSaved.toLocaleTimeString("pt-BR")}`
                  : "Nenhuma alteração salva ainda"}
              </span>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar Rascunho"}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndDownload}
                  disabled={isSaving}
                  startIcon={
                    isSaving ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Download size={15} />
                    )
                  }
                >
                  {isSaving ? "Gerando..." : "Gerar PDF"}
                </Button>
              </div>
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
