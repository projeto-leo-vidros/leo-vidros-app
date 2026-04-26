import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import PedidosService from "../../api/services/pedidosService";

const sortById = (lista) =>
  [...lista].sort((a, b) => {
    const aNum = /^\d+$/.test(String(a.id));
    const bNum = /^\d+$/.test(String(b.id));
    if (aNum && bNum) return parseInt(b.id, 10) - parseInt(a.id, 10);
    return String(b.id) < String(a.id) ? -1 : 1;
  });

export function usePedidosProduto(options = {}) {
  return useQuery({
    queryKey: queryKeys.pedidos.produtos(),
    queryFn: async () => {
      const res = await PedidosService.buscarPedidosDeProduto();
      if (!res.success)
        throw new Error(res.error ?? "Erro ao carregar pedidos");
      const mapeados = (res.data ?? [])
        .filter((p) => {
          const tipoPedido = String(p?.tipoPedido ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          return tipoPedido === "produto";
        })
        .map((p) => PedidosService.mapearParaFrontend(p));
      return sortById(mapeados);
    },
    ...options,
  });
}

export function usePedidosServico(options = {}) {
  return useQuery({
    queryKey: queryKeys.pedidos.servicos(),
    queryFn: async () => {
      const res = await PedidosService.buscarPedidosDeServico();
      if (!res.success)
        throw new Error(res.error ?? "Erro ao carregar serviços");
      const mapeados = (res.data ?? []).map((p) =>
        PedidosService.mapearParaFrontend(p),
      );
      return sortById(mapeados);
    },
    ...options,
  });
}

export function usePedido(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.pedidos.detail(id),
    queryFn: async () => {
      const res = await PedidosService.buscarPorId(id);
      if (!res.success) throw new Error(res.error ?? "Erro ao carregar pedido");
      return res.data ?? null;
    },
    enabled: !!id,
    ...options,
  });
}

export function useCriarPedido(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados) => PedidosService.criarPedido(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
    },
    ...options,
  });
}

export function useAtualizarPedido(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }) => PedidosService.atualizarPedido(id, dados),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.detail(id) });
    },
    ...options,
  });
}

export function useDeletarPedido(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => PedidosService.deletarPedido(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
      qc.removeQueries({ queryKey: queryKeys.pedidos.detail(id) });
    },
    ...options,
  });
}

export function useAtualizarServico(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }) => PedidosService.atualizarServico(id, dados),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.detail(id) });
    },
    ...options,
  });
}

export function useDeletarServico(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => PedidosService.deletarServico(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
      qc.removeQueries({ queryKey: queryKeys.pedidos.detail(id) });
    },
    ...options,
  });
}
