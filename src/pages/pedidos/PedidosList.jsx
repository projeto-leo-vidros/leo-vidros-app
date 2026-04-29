import { useState, useEffect, useMemo } from 'react';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import SkeletonLoader from '../../components/feedback/Skeleton/SkeletonLoader';
import NovoPedidoProdutoModal from './components/NovoPedidoProdutoModal';
import EditarPedidoModal from './components/EditarPedidoModal';
import PedidosService from '../../api/services/pedidosService';
import { usePedidosProduto, useDeletarPedido } from '../../hooks/queries/usePedidos';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button.component';
import Swal from 'sweetalert2';

const ITEMS_PER_PAGE = 5;

// Removido NOVO_FORM_PEDIDO pois não estava sendo usado

const formatPedidoId = (id) => {
    if (!id) return '';
    const idString = String(id);
    if (/^\d+$/.test(idString)) {
        return idString.padStart(3, '0');
    }
    return idString;
}

export default function PedidosList({ busca = "", triggerNovoRegistro, pedidoParaAbrirId = null, onNovoRegistroHandled, statusFilter, paymentFilter }) {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        data: pedidos = [],
        isLoading: loading,
        isError,
        error: queryError,
        refetch,
    } = usePedidosProduto();

    const deletarMutation = useDeletarPedido();

    const { modal, open: openModal, closeAll: fecharTodos } = useModal(['confirm', 'view', 'form', 'novo', 'editar']);
    
    // Removidos os estados mode, form e errors que não eram utilizados
    const [current, setCurrent] = useState(null);
    const [targetId, setTargetId] = useState(null);

    useEffect(() => {
        if (triggerNovoRegistro) {
            openModal('novo');
            onNovoRegistroHandled();
        }
    }, [triggerNovoRegistro, onNovoRegistroHandled, openModal]);

    useEffect(() => {
        if (!pedidoParaAbrirId || !pedidos.length) return;

        const pedidoAlvo = pedidos.find(
            (item) => String(item.id) === String(pedidoParaAbrirId),
        );

        if (!pedidoAlvo) return;

        setCurrent(pedidoAlvo);
        openModal('editar');
        navigate(location.pathname, { replace: true, state: {} });
    }, [pedidoParaAbrirId, pedidos, openModal, navigate, location.pathname]);


    const listaFiltrada = useMemo(() => {
        return PedidosService.filtrarPedidos(pedidos, {
            busca,
            status: statusFilter,
            pagamento: paymentFilter
        });
    }, [busca, pedidos, statusFilter, paymentFilter]);

    const {
        page,
        setPage,
        paginated: pagina,
        totalPages,
        next: proxima,
        prev: anterior,
    } = usePagination(listaFiltrada, ITEMS_PER_PAGE);

    // CÁLCULO DE START E END PARA RESOLVER O ERRO
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + pagina.length;

    const abrirEditar = (item) => {
        setCurrent(item);
        openModal('editar');
    };

    const abrirConfirmarExclusao = (id) => {
        setTargetId(id);
        openModal('confirm');
    };

    const confirmarExclusao = async () => {
        if (!targetId) return;
        deletarMutation.mutate(targetId, {
            onSuccess: () => fecharTodos(),
            onError: () => Swal.fire({ icon: "error", title: "Erro ao excluir", text: "Não foi possível excluir o pedido. Tente novamente.", confirmButtonColor: "#dc2626" }),
        });
    };

    const handleNovoPedidoSuccess = () => {
        setPage(1);
        refetch();
    };

    const handleEditarPedidoSuccess = () => {
        // TanStack Query cuida do refetch
    };

    return (
        <>
            <div className="flex flex-col gap-4 w-full py-4">
                {loading && <SkeletonLoader count={ITEMS_PER_PAGE} />}

                {!loading && isError && (
                    <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-medium">Erro ao carregar pedidos</p>
                        <p className="text-sm mt-1">{queryError?.message}</p>
                        <Button variant="danger" size="sm" onClick={() => refetch()}>
                            Tentar Novamente
                        </Button>
                    </div>
                )}

                {!loading && !isError && pagina.length === 0 && (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        {listaFiltrada.length === 0 && pedidos.length === 0 
                            ? "Nenhum pedido cadastrado ainda." 
                            : "Nenhum pedido encontrado com os filtros atuais."
                        }
                    </div>
                )}

                {!loading && !isError && pagina.map((item) => (
                    <article key={item.id} className="flex flex-col gap-4 rounded-lg border p-5 w-full shadow-[0_10px_24px_-8px_rgba(15,23,42,0.24),-10px_0_20px_-16px_rgba(15,23,42,0.18),10px_0_20px_-16px_rgba(15,23,42,0.18)] transition-all hover:shadow-[0_16px_36px_-10px_rgba(15,23,42,0.28),-12px_0_24px_-18px_rgba(15,23,42,0.2),12px_0_24px_-18px_rgba(15,23,42,0.2)] bg-white border-slate-200">
                        <header className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md text-slate-400 bg-slate-100">
                                    <Package size={16} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm md:text-base text-slate-800">
                                        Pedido #{formatPedidoId(item.id)}
                                    </h3>
                                    <span className="text-xs block md:hidden text-slate-500">{formatDate(item.dataCompra)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button type="button" className="p-1.5 rounded-md text-slate-500 cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors" title="Editar" onClick={() => abrirEditar(item)}>
                                    <Pencil size={18} />
                                </button>
                                <button type="button" className="p-1.5 rounded-md text-slate-500 cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Excluir" onClick={() => abrirConfirmarExclusao(item.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                            <div className="md:col-span-2 flex flex-col items-start justify-start gap-1">
                                <span className="text-md font-bold text-slate-500">
                                    {item.itensCount} {item.itensCount === 1 ? 'item' : 'itens'}
                                </span>
                                <span className="text-base font-bold text-[#157A98]">
                                    {formatCurrency(item.valorTotal)}
                                </span>
                            </div>
                            <div className="md:col-span-2 flex flex-col items-start justify-start gap-1">
                                <span className="text-md font-bold text-slate-500">Pagamento</span>
                                <span className="text-md font-medium text-left text-slate-700">
                                    {item.formaPagamento}
                                </span>
                            </div>
                            <div className="md:col-span-2 flex flex-col items-start justify-start gap-1">
                                <span className="text-md font-bold text-slate-500">Produtos</span>
                                <span className="text-md font-medium truncate w-full text-left text-slate-700" title={item.produtosDesc}>
                                    {item.produtosDesc}
                                </span>
                            </div>
                            <div className="md:col-span-2 flex flex-col items-start justify-start gap-1">
                                <span className="text-md font-bold text-slate-500">Descrição</span>
                                <p className="text-md line-clamp-2 leading-snug w-full text-left text-slate-600" title={item.descricao}>
                                    {item.descricao || '-'}
                                </p>
                            </div>
                            <div className="md:col-span-2 flex flex-col items-start justify-start gap-1">
                                <span className="text-md font-bold text-slate-500">Cliente</span>
                                <span className="text-md font-medium truncate w-full text-left text-slate-700" title={item.clienteNome}>
                                    {item.clienteNome}
                                </span>
                            </div>
                            <div className="md:col-span-2 flex flex-col items-start justify-start gap-1">
                                <span className="text-md font-bold text-slate-500">Data da Compra</span>
                                <span className="text-md font-medium text-left text-slate-700">
                                    {formatDate(item.dataCompra)}
                                </span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* Paginação corrigida */}
            {!loading && !isError && listaFiltrada.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                        Mostrando <span className="font-medium text-slate-800">{start + 1}</span> a <span className="font-medium text-slate-800">{Math.min(end, listaFiltrada.length)}</span> de {listaFiltrada.length}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={anterior} disabled={page === 1}>
                            Anterior
                        </Button>
                        <Button variant="primary" size="sm" onClick={proxima} disabled={page === totalPages}>
                            Próximo
                        </Button>
                    </div>
                </div>
            )}

            {modal.confirm && (
                <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) fecharTodos(); }}>
                    <div className="flex flex-col gap-4 w-full max-w-md bg-white rounded-xl shadow-2xl p-6 animate-scaleIn">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 text-xl">
                                <AlertTriangle size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Excluir Pedido?</h2>
                            <p className="text-slate-600">
                                Você está prestes a excluir o pedido <span className="font-bold">#{formatPedidoId(targetId)}</span>. Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <Button variant="ghost" onClick={fecharTodos} fullWidth>Cancelar</Button>
                            <Button variant="danger" onClick={confirmarExclusao} fullWidth>Sim, Excluir</Button>
                        </div>
                    </div>
                </div>
            )}  

            <NovoPedidoProdutoModal
                isOpen={modal.novo}
                onClose={fecharTodos}
                onSuccess={handleNovoPedidoSuccess}
                tipoInicial="produto"
            />

            <EditarPedidoModal
                isOpen={modal.editar}
                onClose={fecharTodos}
                pedido={current}
                onSuccess={handleEditarPedidoSuccess}
            />
        </>
    );
}
