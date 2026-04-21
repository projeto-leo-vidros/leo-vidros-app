import { useState, useEffect } from "react";
import { ShoppingCart, X, Edit, Save, Plus, Trash2 } from "lucide-react";
import Api from "../../../api/client/Api";
import { onlyLetters } from "../../../utils/masks";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import FeedbackModal from "../../../components/feedback/FeedbackModal/FeedbackModal";
import ProdutoSearchSelect from "../../../components/ui/misc/ProdutoSearchSelect";

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

const EditarPedidoModal = ({ isOpen, onClose, pedido, onSuccess }) => {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [formData, setFormData] = useState({
    clienteNome: "",
    data: "",
    formaPagamento: "",
    parcelas: 1,
    observacoes: "",
    produtos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);

  useEffect(() => {
    if (isOpen) {
      Api.get("/produtos?size=200").then((res) => {
        const lista = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
        setProdutosDisponiveis(lista);
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && pedido) {
      const { metodo, parcelas } = parseFormaPagamento(pedido.formaPagamento);
      setFormData({
        clienteNome: pedido.clienteNome || "Cliente não informado",
        data: pedido.data || "",
        formaPagamento: metodo,
        parcelas,
        observacoes: pedido.observacoes || "",
        produtos: pedido.produtos || [],
      });
      setModoEdicao(false);
      setError(null);
    }
  }, [isOpen, pedido]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === "clienteNome") {
      maskedValue = onlyLetters(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: maskedValue,
    }));
  };

  const handleProdutoChange = (index, field, value) => {
    const novosProdutos = [...formData.produtos];
    novosProdutos[index] = {
      ...novosProdutos[index],
      [field]:
        field === "quantidade" || field === "preco"
          ? parseFloat(value) || 0
          : value,
    };
    setFormData((prev) => ({ ...prev, produtos: novosProdutos }));
  };

  const handleProdutoSelect = (index, produto) => {
    const novosProdutos = [...formData.produtos];
    novosProdutos[index] = {
      ...novosProdutos[index],
      nome: produto?.nome ?? "",
      preco: parseFloat(produto?.preco ?? 0),
      estoqueId: produto?.id ?? 0,
    };
    setFormData((prev) => ({ ...prev, produtos: novosProdutos }));
  };

  const handleAdicionarProduto = () => {
    setFormData((prev) => ({
      ...prev,
      produtos: [
        ...prev.produtos,
        {
          nome: "",
          quantidade: 1,
          preco: 0,
        },
      ],
    }));
  };

  const handleRemoverProduto = (index) => {
    setFormData((prev) => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index),
    }));
  };

  const calcularValorTotal = () => {
    return formData.produtos.reduce((total, produto) => {
      return total + produto.quantidade * produto.preco;
    }, 0);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const valorTotal = calcularValorTotal();

      // Construir o corpo da requisição no formato esperado pela API
      const requestBody = {
        pedido: {
          valorTotal: valorTotal,
          ativo: pedido.ativo !== undefined ? pedido.ativo : true,
          formaPagamento: composeFormaPagamento(formData.formaPagamento, formData.parcelas),
          observacao: formData.observacoes,
          clienteId: pedido.clienteId || pedido.clienteInfo?.id,
          clienteNome: formData.clienteNome,
          status: {
            tipo: pedido.statusOriginal?.tipo || "PEDIDO",
            nome: pedido.statusOriginal?.nome || "ATIVO",
          },
        },
        servico: null,
        produtos: formData.produtos.map((produto) => ({
          estoqueId: produto.estoqueId || 0,
          quantidadeSolicitada: parseFloat(produto.quantidade) || 0,
          precoUnitarioNegociado: parseFloat(produto.preco) || 0,
          observacao: produto.observacao || "",
        })),
      };

      // Chamar API para atualizar
      await Api.put(`/pedidos/${pedido.id}`, requestBody);

      // Exibe modal de sucesso e aguarda antes de fechar
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        if (onSuccess) {
          onSuccess();
        }
        setModoEdicao(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error("❌ Erro ao atualizar pedido:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao atualizar pedido",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pedido) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex justify-center items-start px-10 py-20 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[130vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-[#eeeeee] p-2.5 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-[#828282]" />
              </div>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Pedido #{pedido.id?.toString().padStart(3, "0")}
                </h2>
                <p className="text-md text-gray-500">
                  (
                  {modoEdicao
                    ? "Editando informações"
                    : "Visualizando informações"}
                  )
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Informações Pedido */}
          <div className="px-6 py-4 space-y-4 flex flex-col gap-6">
            {/* Cliente */}
            <div className="flex flex-row gap-10 items-start">
              <UniversalInput
                label="Cliente"
                name="clienteNome"
                value={formData.clienteNome}
                onChange={handleChange}
                readOnly={!modoEdicao}
                wrapperClassName="flex-1"
              />
              <UniversalInput
                label="Data do Pedido"
                type="date"
                value={formData.data}
                readOnly
                wrapperClassName="flex-1"
              />
            </div>

            {/* Produtos */}
            <div className="flex flex-col gap-3 items-start rounded-md">
              <div className="flex items-center gap-5 justify-between mb-3">
                <label className="block text-md font-semibold text-gray-700">
                  Produtos
                </label>
                {modoEdicao && (
                  <Button
                    type="button"
                    onClick={handleAdicionarProduto}
                    startIcon={<Plus />}
                    className="px-3 py-2 bg-[#007EA7] text-white rounded-md hover:bg-[#006891] transition-colors flex items-center gap-1 text-md font-semibold cursor-pointer"
                  >
                    Adicionar
                  </Button>
                )}
              </div>

              <div className="flex flex-col items-center justify-center gap-3">
                {formData.produtos.map((produto, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 bg-white p-3 rounded-md border"
                  >
                    <div className="col-span-5 flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Nome do Produto
                      </label>
                      {modoEdicao ? (
                        <ProdutoSearchSelect
                          produtos={produtosDisponiveis}
                          value={produto.nome ? { id: produto.estoqueId, nome: produto.nome } : null}
                          onChange={(p) => handleProdutoSelect(index, p)}
                          placeholder="Pesquisar produto..."
                        />
                      ) : (
                        <span className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md bg-gray-50">
                          {produto.nome || "—"}
                        </span>
                      )}
                    </div>
                    <UniversalInput
                      label="Quantidade"
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
                      readOnly={!modoEdicao}
                      wrapperClassName="col-span-2"
                    />
                    <UniversalInput
                      label="Preço Unitário"
                      type="number"
                      step="0.01"
                      min="0"
                      value={produto.preco}
                      onChange={(e) =>
                        handleProdutoChange(index, "preco", e.target.value)
                      }
                      readOnly={!modoEdicao}
                      wrapperClassName="col-span-3"
                    />
                    {modoEdicao && (
                      <div className="col-span-2 flex flex-col justify-end">
                        <Button
                          type="button"
                          onClick={() => handleRemoverProduto(index)}
                          className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {formData.produtos.length === 0 && (
                  <div className="w-180 h-10 p-10 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <span>Nenhum produto adicionado</span>
                  </div>
                )}
              </div>

              {/* Valor Total */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-md font-semibold text-gray-700">
                    Valor Total:
                  </span>
                  <span className="text-xl font-bold text-[#007EA7]">
                    R$ {calcularValorTotal().toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="flex flex-col gap-2">
              <UniversalInput
                as="select"
                label="Forma de Pagamento"
                name="formaPagamento"
                value={formData.formaPagamento}
                onChange={(e) => {
                  handleChange(e);
                  if (!METODOS_COM_PARCELA.includes(e.target.value))
                    setFormData((prev) => ({ ...prev, parcelas: 1 }));
                }}
                disabled={!modoEdicao}
                placeholder="Selecione..."
                options={[
                  { value: "Dinheiro", label: "Dinheiro" },
                  { value: "Pix", label: "Pix" },
                  { value: "Cartão de crédito", label: "Cartão de crédito" },
                  { value: "Cartão de débito", label: "Cartão de débito" },
                  { value: "Boleto", label: "Boleto" },
                  { value: "Transferência", label: "Transferência bancária" },
                ]}
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
                  disabled={!modoEdicao}
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: i + 1,
                    label: `${i + 1}x${i === 0 ? " (à vista)" : ""}`,
                  }))}
                />
              )}
            </div>

            {/* Observações */}
            <UniversalInput
              as="textarea"
              label="Observações"
              name="observacoes"
              rows={3}
              value={formData.observacoes}
              onChange={handleChange}
              readOnly={!modoEdicao}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>

            {modoEdicao ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setModoEdicao(false);
                    setFormData({
                      clienteNome:
                        pedido.clienteNome || "Cliente não informado",
                      data: pedido.data || "",
                      formaPagamento: pedido.formaPagamento || "",
                      observacoes: pedido.observacoes || "",
                      produtos: pedido.produtos || [],
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )
                  }
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => setModoEdicao(true)}
                startIcon={<Edit className="w-4 h-4" />}
              >
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Sucesso - FORA do modal para garantir visibilidade */}
      <FeedbackModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Sucesso!"
        description="Pedido atualizado com sucesso!"
        duration={2500}
      />
    </>
  );
};

export default EditarPedidoModal;
