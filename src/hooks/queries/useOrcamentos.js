import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import OrcamentosService from "../../api/services/orcamentosService";

const unwrapList = async (promise) => {
  const res = await promise;
  if (!res.success)
    throw new Error(res.error ?? "Erro ao carregar orçamentos");
  return Array.isArray(res.data) ? res.data : [];
};

const unwrapOne = async (promise) => {
  const res = await promise;
  if (!res.success)
    throw new Error(res.error ?? "Erro ao carregar orçamento");
  return res.data ?? null;
};

export function useOrcamentos(options = {}) {
  return useQuery({
    queryKey: queryKeys.orcamentos.list(),
    queryFn: () => unwrapList(OrcamentosService.buscarTodos()),
    ...options,
  });
}

export function useOrcamento(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.orcamentos.detail(id),
    queryFn: () => unwrapOne(OrcamentosService.buscarPorId(id)),
    enabled: !!id,
    ...options,
  });
}

export function useOrcamentosPorPedido(pedidoId, options = {}) {
  return useQuery({
    queryKey: queryKeys.orcamentos.porPedido(pedidoId),
    queryFn: () => unwrapList(OrcamentosService.buscarPorPedido(pedidoId)),
    enabled: !!pedidoId,
    ...options,
  });
}

export function useCriarOrcamento(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados) => OrcamentosService.criarOrcamento(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orcamentos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.pedidos.all() });
    },
    ...options,
  });
}
