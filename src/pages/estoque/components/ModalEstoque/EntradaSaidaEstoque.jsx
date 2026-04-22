import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ArrowRightLeft, Hash, AlertCircle, AlertTriangle } from "lucide-react";
import Api from "../../../../api/client/Api";
import Button from "../../../../components/ui/Button/Button.component";
import UniversalInput from "../../../../components/ui/Input/UniversalInput";
import { modalClasses } from "../../../../components/ui/modal/modalStyles";

const EntradaSaidaEstoque = ({
  isOpen,
  onClose,
  itemIds,
  estoque,
  onMovementComplete,
}) => {
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
              disponivel: item.quantidadeDisponivel ?? 0,
              reservado: item.reservado ?? 0,
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

  const handleCancel = () => {
    onClose();
    if (processedItems.length > 0 && onMovementComplete) {
      onMovementComplete();
    }
  };

  const handleSaveClick = async () => {
    setError("");
    setLoading(true);

    try {
      const endpoint =
        tipoMovimento === "entrada" ? "/estoques/entrada" : "/estoques/saida";
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
          if (onMovementComplete) {
            onMovementComplete();
          }
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao registrar movimento",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || itemIds.length === 0) return null;

  const currentItem = itemsInfo[currentItemIndex];
  const unidadeMedida = currentItem?.unidade || "Unidade";
  const quantidadeSolicitada = parseFloat(quantidade) || 0;
  const disponivelAtual = parseFloat(currentItem?.disponivel ?? 0);
  const itemReservado =
    tipoMovimento === "saida" && (currentItem?.reservado ?? 0) > 0;
  const bloqueadoPorReserva =
    tipoMovimento === "saida" && quantidadeSolicitada > disponivelAtual;

  return (
    <div
      className={modalClasses.overlay}
      onClick={handleCancel}
    >
      <div
        className={`${modalClasses.panel} flex max-h-[92vh] max-w-lg flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className={modalClasses.headerTitle}>Movimentar Estoque</h2>
              <p className={modalClasses.headerSubtitle}>
                Controle entradas e saidas com contexto do item.
              </p>
            </div>
          </div>
        </div>

        <div className={`${modalClasses.body} space-y-5 flex flex-col gap-5`}>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
              Item {currentItemIndex + 1} de {itemsInfo.length}
            </p>
            <div className="rounded-lg bg-white/80 px-4 py-3 shadow-sm">
              <span className="text-base font-bold text-gray-900">
                {currentItem?.nome}
              </span>
              {tipoMovimento === "saida" && (
                <p className="mt-1 text-xs text-gray-500">
                  Disponivel:{" "}
                  <span className="font-semibold text-gray-700">
                    {currentItem?.disponivel}
                  </span>
                  {(currentItem?.reservado ?? 0) > 0 && (
                    <>
                      {" "}
                      · Reservado:{" "}
                      <span className="font-semibold text-amber-600">
                        {currentItem?.reservado}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {bloqueadoPorReserva && (
            <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4">
              <AlertTriangle className={`${modalClasses.alertIcon} text-red-600`} />
              <p className="text-sm text-red-800">
                <strong>Saida bloqueada.</strong> A quantidade solicitada
                ultrapassa o disponivel para retirada. Disponivel:{" "}
                <strong>{currentItem?.disponivel}</strong>
                {(currentItem?.reservado ?? 0) > 0 && (
                  <>
                    {" "}
                    · Reservado em agendamentos ativos:{" "}
                    <strong>{currentItem?.reservado}</strong>
                  </>
                )}
              </p>
            </div>
          )}

          {itemReservado && !bloqueadoPorReserva && (
            <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4">
              <AlertTriangle className={`${modalClasses.alertIcon} text-amber-600`} />
              <p className="text-sm text-amber-800">
                Este item possui <strong>{currentItem?.reservado}</strong>{" "}
                {unidadeMedida.toLowerCase()}(s) reservada(s), mas ainda ha saldo
                disponivel para retirada.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 shadow-sm">
              <AlertCircle className={`${modalClasses.alertIcon} text-red-600`} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-r-lg border-l-4 border-green-500 bg-green-50 p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-900">
                Movimento registrado!
              </p>
            </div>
          )}

          <div className="space-y-4 flex flex-col gap-4">
            <UniversalInput
              as="select"
              label="Tipo"
              value={tipoMovimento}
              onChange={(e) => setTipoMovimento(e.target.value)}
              disabled={loading}
              options={[
                { value: "entrada", label: "Entrada" },
                { value: "saida", label: "Saida" },
              ]}
            />

            <UniversalInput
              type="number"
              label={`Quantidade (${unidadeMedida})`}
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              disabled={loading}
              startIcon={<Hash className="h-4 w-4 text-blue-600" />}
            />
          </div>
        </div>

        <div className={modalClasses.footer}>
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={loading || quantidade <= 0 || success || bloqueadoPorReserva}
          >
            {loading
              ? "Processando..."
              : currentItemIndex < itemsInfo.length - 1
                ? "Próximo Item"
                : "Finalizar"}
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
  onMovementComplete: PropTypes.func,
};

export default EntradaSaidaEstoque;
