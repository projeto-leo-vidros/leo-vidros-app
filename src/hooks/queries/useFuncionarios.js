import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { funcionariosService } from "../../api/services/funcionariosService";

const unwrapList = async (promise) => {
  const res = await promise;
  if (!res.success)
    throw new Error(res.error ?? "Erro ao carregar funcionários");
  const items = res.data?.content ?? res.data;
  return Array.isArray(items) ? items : [];
};

const unwrapOne = async (promise) => {
  const res = await promise;
  if (!res.success)
    throw new Error(res.error ?? "Erro ao carregar funcionário");
  return res.data ?? null;
};

/* ── Listagem geral ── */

export function useFuncionarios(options = {}) {
  return useQuery({
    queryKey: queryKeys.funcionarios.list(),
    queryFn: () => unwrapList(funcionariosService.getAll()),
    ...options,
  });
}

export function useFuncionario(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.funcionarios.detail(id),
    queryFn: () => unwrapOne(funcionariosService.getById(id)),
    enabled: !!id,
    ...options,
  });
}

/* ── Agenda do funcionário ── */

export function useAgendaFuncionario(id, dataInicio, dataFim, options = {}) {
  return useQuery({
    queryKey: queryKeys.funcionarios.agenda(id, dataInicio, dataFim),
    queryFn: () =>
      unwrapList(funcionariosService.getAgenda(id, dataInicio, dataFim)),
    enabled: !!id && !!dataInicio && !!dataFim,
    ...options,
  });
}

/* ── Funcionários disponíveis ── */

export function useFuncionariosDisponiveis(data, inicio, fim, options = {}) {
  return useQuery({
    queryKey: queryKeys.funcionarios.disponiveis(data, inicio, fim),
    queryFn: () =>
      unwrapList(funcionariosService.getDisponiveis(data, inicio, fim)),
    enabled: !!data && !!inicio && !!fim,
    ...options,
  });
}

/* ── Mutations (CRUD + alocação) ── */

export function useCriarFuncionario(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados) => funcionariosService.create(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.funcionarios.all() });
    },
    ...options,
  });
}

export function useAtualizarFuncionario(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }) => funcionariosService.update(id, dados),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.funcionarios.all() });
      qc.invalidateQueries({ queryKey: queryKeys.funcionarios.detail(id) });
    },
    ...options,
  });
}

export function useDeletarFuncionario(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => funcionariosService.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.funcionarios.all() });
      qc.removeQueries({ queryKey: queryKeys.funcionarios.detail(id) });
    },
    ...options,
  });
}

/* ── Remover funcionário de agendamento ── */

export function useRemoverFuncionarioDeAgendamento(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agendamentoId, funcionarioId }) =>
      funcionariosService.removerDeAgendamento(agendamentoId, funcionarioId),
    onSuccess: () => {
      // Invalida a agenda do funcionário e os agendamentos
      qc.invalidateQueries({ queryKey: queryKeys.funcionarios.all() });
      qc.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
    ...options,
  });
}

/* ── Adicionar funcionário a agendamento ── */

export function useAdicionarFuncionarioAoAgendamento(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agendamentoId, funcionarioId }) =>
      funcionariosService.adicionarAoAgendamento(agendamentoId, funcionarioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.funcionarios.all() });
      qc.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
    ...options,
  });
}
