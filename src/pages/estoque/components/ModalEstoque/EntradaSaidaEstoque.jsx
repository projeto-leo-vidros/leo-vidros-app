import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ArrowRightLeft, ChevronDown, Hash, AlertCircle } from "lucide-react";
import Api from "../../../../api/client/Api";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/Button/Button.component";

const EntradaSaidaEstoque = ({ isOpen, onClose, itemIds, estoque }) => {
  const navigate = useNavigate();
  const [tipoMovimento, setTipoMovimento] = useState("entrada");
  const [quantidade, setQuantidade] = useState(1);
  const [itemsInfo, setItemsInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [processedItems, setProcessedItems] = useState([]);

  useEffect(() => {
    if (isOpen && itemIds.length > 0) {
      const items = itemIds
        .map((id) => {
          const item = estoque.find((e) => e.id === id);
          if (item) {
            return {
              id: item.id,
              nome: item.produto?.nome || "Produto sem nome",
              unidade: item.detalhes?.unidadeMedida || "Unidade",
              localizacao: item.localizacao || "localizacao_padrao",
            };
          }
          return null;
        })
        .filter(Boolean);

      setItemsInfo(items);
      setCurrentItemIndex(0);
      setProcessedItems([]);
      setTipoMovimento("entrada");
      setQuantidade(1);
      setError("");
      setSuccess(false);
    } else if (!isOpen) {
      setItemsInfo([]);
      setCurrentItemIndex(0);
      setProcessedItems([]);
      setError("");
      setSuccess(false);
    }
  }, [isOpen, itemIds, estoque]);

  const handleSaveClick = async () => {
    setError("");
    setLoading(true);

    try {
      const endpoint = tipoMovimento === "entrada" ? "/estoques/entrada" : "/estoques/saida";
      const item = itemsInfo[currentItemIndex];
      
      const requestBody = {
        produtoId: item.id,
        localizacao: item.localizacao,
        quantidadeTotal: parseInt(quantidade, 10) || 0,
        dataHora: new Date().toISOString(),
      };

      await Api.post(endpoint, requestBody);

      setProcessedItems((prev) => [...prev, item.nome]);

      if (currentItemIndex < itemsInfo.length - 1) {
        setCurrentItemIndex((prev) => prev + 1);
        setQuantidade(1);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          navigate(0); // Recarrega a página para atualizar o estoque
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao registrar movimento");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || itemIds.length === 0) return null;

  const unidadeMedida = itemsInfo[currentItemIndex]?.unidade || "Unidade";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div className="flex items-center gap-2">
            <div className="rounded bg-blue-100 p-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Movimentar Estoque</h2>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          {/* Status do Processamento */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
              Item {currentItemIndex + 1} de {itemsInfo.length}
            </p>
            <div className="rounded-lg bg-white/80 px-4 py-3 shadow-sm">
              <span className="text-base font-bold text-gray-900">
                {itemsInfo[currentItemIndex]?.nome}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 shadow-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-r-lg border-l-4 border-green-500 bg-green-50 p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-900">
                ✓ Movimento registrado!
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-900">Tipo</label>
              <select
                className="w-full rounded-lg border-2 border-gray-200 bg-white py-3 pl-3 pr-10 text-sm font-medium outline-none focus:border-blue-500"
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value)}
                disabled={loading}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-900">
                Quantidade ({unidadeMedida})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg border-2 border-gray-200 py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-blue-500"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  disabled={loading}
                />
                <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={loading || quantidade <= 0 || success}
          >
            {loading ? "Processando..." : currentItemIndex < itemsInfo.length - 1 ? "Próximo Item" : "Finalizar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

EntradaSaidaEstoque.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemIds: PropTypes.array.isRequired,
  estoque: PropTypes.array.isRequired,
};

export default EntradaSaidaEstoque;