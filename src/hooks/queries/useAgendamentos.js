import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { agendamentosService } from "../../api/services/agendamentosService";

const unwrapList = async (promise) => {
  const res = await promise;
  if (!res.success)
    throw new Error(res.error ?? "Erro ao carregar agendamentos");
  const items = res.data?.content ?? res.data;
  return Array.isArray(items) ? items : [];
};

const unwrapOne = async (promise) => {
  const res = await promise;
  if (!res.success)
    throw new Error(res.error ?? "Erro ao carregar agendamento");
  return res.data ?? null;
};

export function useAgendamentos(options = {}) {
  return useQuery({
    queryKey: queryKeys.agendamentos.list(),
    queryFn: () => unwrapList(agendamentosService.getAll()),
    ...options,
  });
}

export function useAgendamento(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.agendamentos.detail(id),
    queryFn: () => unwrapOne(agendamentosService.getById(id)),
    enabled: !!id,
    ...options,
  });
}

export function useCriarAgendamento(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados) => agendamentosService.create(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
    ...options,
  });
}

export function useAtualizarAgendamento(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }) => agendamentosService.update(id, dados),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.agendamentos.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
    ...options,
  });
}

export function useDeletarAgendamento(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => agendamentosService.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      qc.removeQueries({ queryKey: queryKeys.agendamentos.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
    ...options,
  });
}
