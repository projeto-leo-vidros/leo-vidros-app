import { useEffect, useState } from "react";
import { Modal } from "@mui/material";
import PropTypes from "prop-types"; // Lembre-se que agora seu linter pode pedir isso
import { User } from "lucide-react";
import api from "../../../api/client/Api";
import { formatCurrency } from "../../../utils/formatters";
import Button from "../../../components/ui/Button/Button.component";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import PedidosService from "../../../api/services/pedidosService";

export default function ClienteDetailsModal({
  open,
  onClose,
  cliente,
  servicos: servicosProp,
}) {
  // 1. Declare todos os Hooks no topo (Obrigatório)
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(false);

  const PEDIDOS_URL = "/Pedidos";

  // 2. Lógica de variáveis (também antes do early return)
  const endereco =
    cliente?.enderecos?.[0] ||
    servicosProp?.find((p) => p.cliente)?.cliente?.enderecos?.[0] ||
    undefined;

  useEffect(() => {
    let isMounted = true;

    // Se já temos os serviços via props, filtramos e paramos por aqui
    if (Array.isArray(servicosProp) && servicosProp.length > 0 && cliente?.id) {
      const filtered = servicosProp.filter((p) => p.cliente?.id === cliente.id);
      setServicos(filtered);
    } 
    // Caso contrário, buscamos na API
    else if (open && cliente?.id) {
      const fetchServicosPorCliente = async () => {
        setLoading(true);
        try {
          const response = await api.get(`${PEDIDOS_URL}?clienteId=${cliente.id}`);
          const data = Array.isArray(response.data) ? response.data : [];
          if (isMounted) setServicos(data);
        } catch (err) {
          if (isMounted) setServicos([]);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchServicosPorCliente();
    }

    return () => {
      isMounted = false;
    };
  }, [open, cliente, servicosProp]); // Removido o PEDIDOS_URL das dependências pois é constante

  // 3. Early Return (Só agora podemos verificar se o cliente existe para renderizar a UI)
  if (!cliente) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="absolute top-1/2 left-1/2 w-11/12 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 
                      space-y-8 overflow-hidden rounded-xl bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded">
              <User className="h-5 w-5 text-gray-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Detalhes do Cliente</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
             <p className="animate-pulse text-gray-500 font-medium">Carregando histórico...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 pt-4 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <UniversalInput
                  label="Nome"
                  value={cliente.nome || "N/A"}
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-1">
                <UniversalInput
                  label="Telefone"
                  value={cliente.telefone || "N/A"}
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-1">
                <UniversalInput
                  label="Email"
                  value={cliente.email || "N/A"}
                  readOnly
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 pb-6 pt-4">
              <UniversalInput
                label="Endereço"
                value={
                  endereco && (endereco.rua || endereco.bairro || endereco.cep || endereco.numero)
                    ? `${endereco.rua || ""}${endereco.numero ? ", " + endereco.numero : ""}${endereco.bairro ? " - " + endereco.bairro : ""}${endereco.cidade ? " / " + endereco.cidade : ""}${endereco.uf ? " - " + endereco.uf : ""}`
                    : "N/A"
                }
                readOnly
              />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="mb-4 text-lg font-bold text-gray-800">Histórico de Serviços</h3>
              <div className="max-h-[42vh] w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-sm">
                {servicos && servicos.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[#007EA7] text-white">
                      <tr>
                        <th className="p-3 text-left font-semibold">Serviço</th>
                        <th className="p-3 text-left font-semibold">Valor Total</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                        <th className="p-3 text-left font-semibold">Pagamento</th>
                        <th className="p-3 text-left font-semibold">Etapa</th>
                        <th className="p-3 text-left font-semibold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {servicos.map((pedido, index) => {
                        const serv = pedido.servico || {};
                        const statusNome = pedido.status?.nome || pedido.status || "N/A";

                        return (
                          <tr key={pedido.id ?? index} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-900">{serv.nome || "Serviço"}</td>
                            <td className="p-3 text-gray-900">
                              {formatCurrency(pedido.valorTotal ?? serv.precoBase)}
                            </td>
                            <td className="p-3 text-gray-900">{statusNome}</td>
                            <td className="p-3 text-gray-900">{pedido.formaPagamento || "N/A"}</td>
                            <td className="p-3 text-gray-900">{PedidosService.calcularEtapaServicoPorAgendamentos(serv, serv.etapa?.nome || "PENDENTE")}</td>
                            <td className="p-3 text-gray-900 text-sm">{serv.descricao || "N/A"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-6 text-gray-500 italic">Nenhum histórico encontrado para este cliente.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}