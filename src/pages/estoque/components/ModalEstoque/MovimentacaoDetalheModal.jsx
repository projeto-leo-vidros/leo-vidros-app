import {
  X,
  Calendar,
  User,
  Package,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  ShoppingCart,
  Wrench,
  Clock,
  AlertTriangle,
  Settings,
  Edit3,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "../../../../utils/formatters";
import Button from "../../../../components/ui/Button/Button.component";

const MovimentacaoDetalheModal = ({ isOpen, onClose, movimento, produto }) => {
  if (!isOpen || !movimento) return null;

  const formatQuantity = (value) => {
    if (typeof value !== "number") value = parseFloat(value) || 0;
    return Number.isInteger(value) ? value : value.toFixed(2);
  };

  const getOrigemInfo = (origem) => {
    const origemMap = {
      PEDIDO: {
        label: "Pedido",
        icon: ShoppingCart,
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
      },
      SERVICO: {
        label: "Serviço",
        icon: Wrench,
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
      },
      AGENDAMENTO: {
        label: "Agendamento",
        icon: Clock,
        color: "text-purple-600",
        bgColor: "bg-purple-50 border-purple-200",
      },
      PERDA: {
        label: "Perda",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
      },
      AJUSTE: {
        label: "Ajuste",
        icon: Settings,
        color: "text-orange-600",
        bgColor: "bg-orange-50 border-orange-200",
      },
      MANUAL: {
        label: "Manual",
        icon: Edit3,
        color: "text-gray-600",
        bgColor: "bg-gray-50 border-gray-200",
      },
    };

    return (
      origemMap[origem] || {
        label: origem || "N/A",
        icon: Package,
        color: "text-gray-600",
        bgColor: "bg-gray-50 border-gray-200",
      }
    );
  };

  const isEntrada = movimento.tipoMovimentacao === "ENTRADA";
  const temPedido = movimento.pedido;
  const origemInfo = getOrigemInfo(movimento.origem);

  const quantidadeAnterior = isEntrada
    ? movimento.quantidadeAtual - movimento.quantidade
    : movimento.quantidadeAtual + movimento.quantidade;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-[10001]">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="bg-gray-100 p-2 rounded">
              <MessageCircle className="w-5 h-5 text-gray-700" />
            </span>
            Detalhes da Movimentação #{movimento.id}
          </h2>
        </div>

        {/* Conteúdo do Modal - Estilo Chat */}
        <div className="flex flex-col gap-3 p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Mensagem Principal da Movimentação */}
          <div className="flex justify-center w-full">
            <div
              className={`w-full max-w-2xl rounded-xl p-6 shadow-md ${
                isEntrada
                  ? "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300"
                  : "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                {isEntrada ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
                <span
                  className={`font-bold text-xl ${isEntrada ? "text-green-700" : "text-red-700"}`}
                >
                  {movimento.tipoMovimentacao}
                </span>
              </div>
              <p
                className={`text-2xl font-bold text-center ${isEntrada ? "text-green-800" : "text-red-800"}`}
              >
                {isEntrada ? "+" : "-"}
                {formatQuantity(movimento.quantidade)} {produto?.unidademedida}
              </p>
              <p
                className={`text-sm text-center mt-3 ${isEntrada ? "text-green-600" : "text-red-600"}`}
              >
                {formatDateTime(movimento.dataHora)}
              </p>
              <br />

              {/* Badge da Origem */}
              {movimento.origem && (
                <div className="flex justify-center mt-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${origemInfo.bgColor}`}
                  >
                    <origemInfo.icon
                      className={`w-4 h-4 ${origemInfo.color}`}
                    />
                    <span className={`text-sm font-medium ${origemInfo.color}`}>
                      Origem: {origemInfo.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações Gerais */}
          <div className="flex justify-center w-full">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 w-full max-w-2xl border-2 border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-700" />
                <span className="font-bold text-gray-800 text-lg">
                  Resumo da Movimentação
                </span>
              </div>
              <div className="space-y-3 text-base text-gray-700">
                {/* Origem da Movimentação */}
                {movimento.origem && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="font-medium">Origem:</span>
                    <div className="flex items-center gap-2">
                      <origemInfo.icon
                        className={`w-4 h-4 ${origemInfo.color}`}
                      />
                      <span className={`font-semibold ${origemInfo.color}`}>
                        {origemInfo.label}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium">Quantidade Anterior:</span>
                  <span className="font-semibold text-gray-900">
                    {formatQuantity(quantidadeAnterior)}{" "}
                    {produto?.unidademedida}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium">Quantidade Movimentada:</span>
                  <span
                    className={`font-bold text-lg ${isEntrada ? "text-green-600" : "text-red-600"}`}
                  >
                    {isEntrada ? "+" : "-"}
                    {formatQuantity(movimento.quantidade)}{" "}
                    {produto?.unidademedida}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium">Quantidade Atual:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {formatQuantity(movimento.quantidadeAtual)}{" "}
                    {produto?.unidademedida}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Usuário */}
          {movimento.usuario && (
            <div className="flex justify-center w-full">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 w-full max-w-2xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-800 text-lg">
                    Usuário Responsável
                  </span>
                </div>
                <div className="flex flex-col gap-2 space-y-3 text-base text-blue-700 text-center">
                  <p className="font-bold text-xl text-blue-900">
                    {movimento.usuario.nome}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{movimento.usuario.email}</span>
                  </div>
                  {movimento.usuario.telefone && (
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{movimento.usuario.telefone}</span>
                    </div>
                  )}
                  <p className="text-sm text-blue-600 mt-3">
                    CPF: {movimento.usuario.cpf}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Observação */}
          {movimento.observacao && (
            <div className="flex justify-center gap-2 w-full">
              <div className="flex flex-col gap-2 bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 rounded-xl p-6 w-full max-w-2xl shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800 text-lg">
                    Observação
                  </span>
                </div>
                <p className="text-base text-yellow-700 leading-relaxed text-center">
                  {movimento.observacao}
                </p>
              </div>
            </div>
          )}

          {/* Detalhes do Pedido (se existir) */}
          {temPedido && (
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 w-full max-w-2xl border-2 border-purple-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-purple-800 text-lg">
                    Pedido #{movimento.pedido.id}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Informações Básicas do Pedido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-sm">
                      <span className="text-xs font-bold text-purple-600 uppercase block mb-2">
                        Valor Total
                      </span>
                      <p className="text-xl font-bold text-purple-800">
                        {formatCurrency(movimento.pedido.valorTotal)}
                      </p>
                    </div>
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-sm">
                      <span className="text-xs font-bold text-purple-600 uppercase block mb-2">
                        Forma de Pagamento
                      </span>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <span className="font-bold text-purple-800">
                          {movimento.pedido.formaPagamento}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-sm">
                    <span className="text-xs font-bold text-purple-600 uppercase block mb-2">
                      Status do Pedido
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-purple-200 text-purple-800 border border-purple-400">
                      {movimento.pedido.status?.nome || "N/A"}
                    </span>
                  </div>

                  {movimento.pedido.descricao && (
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-sm">
                      <span className="text-xs font-bold text-purple-600 uppercase block mb-2">
                        Descrição do Pedido
                      </span>
                      <p className="text-purple-800 font-medium">
                        {movimento.pedido.descricao}
                      </p>
                    </div>
                  )}

                  {/* Cliente */}
                  {movimento.pedido.cliente && (
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-sm">
                      <h4 className="text-xs font-bold text-purple-600 uppercase mb-3">
                        Informações do Cliente
                      </h4>
                      <div className="space-y-3">
                        {movimento.pedido.cliente.nome && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-900">
                              Nome:
                            </span>
                            <span className="text-purple-700">
                              {movimento.pedido.cliente.nome}
                            </span>
                          </div>
                        )}
                        {movimento.pedido.cliente.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-900">
                              Email:
                            </span>
                            <span className="text-purple-700">
                              {movimento.pedido.cliente.email}
                            </span>
                          </div>
                        )}
                        {movimento.pedido.cliente.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-900">
                              Telefone:
                            </span>
                            <span className="text-purple-700">
                              {movimento.pedido.cliente.telefone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Produtos do Pedido */}
                  {movimento.pedido.produtos &&
                    movimento.pedido.produtos.length > 0 && (
                      <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-purple-600 uppercase mb-3">
                          Produtos do Pedido
                        </h4>
                        <div className="space-y-3">
                          {movimento.pedido.produtos.map((prod, index) => (
                            <div
                              key={index}
                              className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                            >
                              <p className="font-bold text-purple-900 mb-3 text-base">
                                {prod.nomeProduto}
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded p-2 border border-purple-200">
                                  <span className="text-xs text-purple-600 font-semibold block mb-1">
                                    Quantidade
                                  </span>
                                  <span className="font-bold text-purple-900">
                                    {prod.quantidadeSolicitada}{" "}
                                    {produto?.unidademedida}
                                  </span>
                                </div>
                                <div className="bg-white rounded p-2 border border-purple-200">
                                  <span className="text-xs text-purple-600 font-semibold block mb-1">
                                    Preço Unit.
                                  </span>
                                  <span className="font-bold text-purple-900">
                                    {formatCurrency(
                                      prod.precoUnitarioNegociado,
                                    )}
                                  </span>
                                </div>
                                <div className="col-span-2 bg-white rounded p-2 border border-purple-200">
                                  <span className="text-xs text-purple-600 font-semibold block mb-1">
                                    Subtotal
                                  </span>
                                  <span className="font-bold text-purple-900 text-lg">
                                    {formatCurrency(prod.subtotal)}
                                  </span>
                                </div>
                                {prod.observacao && (
                                  <div className="col-span-2 bg-yellow-50 rounded p-2 border border-yellow-200">
                                    <span className="text-xs text-yellow-700 font-semibold block mb-1">
                                      Observação
                                    </span>
                                    <span className="text-yellow-800">
                                      {prod.observacao}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 sticky bottom-0 z-10">
          <Button
            variant="primary"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MovimentacaoDetalheModal;
