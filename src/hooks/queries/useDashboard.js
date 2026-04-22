import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import {
  getQtdAgendamentosHoje,
  getQtdAgendamentosFuturos,
  getAgendamentosFuturos,
  getEstoqueCritico,
  getTaxaOcupacaoServicos,
  getQtdItensCriticos,
  getQtdServicosHoje,
  getFaturamentoMes,
  getFaturamentoAnual,
  getOrcamentosAbertos,
} from "../../api/services/dashboardService";

const unwrap = (field, fallback) => async (fetcher) => {
  const res = await fetcher();
  if (!res.success) throw new Error(res.error ?? "Erro ao carregar dados");
  return field ? (res.data?.[field] ?? fallback) : (res.data ?? fallback);
};

export function useQtdAgendamentosHoje(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.qtdAgendamentosHoje(),
    queryFn: () =>
      unwrap("qtdAgendamentosHoje", 0)(() => getQtdAgendamentosHoje()),
    ...options,
  });
}

export function useQtdAgendamentosFuturos(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.qtdAgendamentosFuturos(),
    queryFn: () =>
      unwrap("qtdAgendamentosFuturos", 0)(() => getQtdAgendamentosFuturos()),
    ...options,
  });
}

export function useAgendamentosFuturos(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.agendamentosFuturos(),
    queryFn: async () => {
      const res = await getAgendamentosFuturos();
      if (!res.success)
        throw new Error(res.error ?? "Erro ao carregar agendamentos futuros");
      return Array.isArray(res.data) ? res.data : [];
    },
    ...options,
  });
}

export function useEstoqueCritico(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.estoqueCritico(),
    queryFn: async () => {
      const res = await getEstoqueCritico();
      if (!res.success)
        throw new Error(res.error ?? "Erro ao carregar estoque crítico");
      return Array.isArray(res.data) ? res.data : [];
    },
    ...options,
  });
}

export function useTaxaOcupacaoServicos(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.taxaOcupacaoServicos(),
    queryFn: () =>
      unwrap("taxaOcupacaoServicos", 0)(() => getTaxaOcupacaoServicos()),
    ...options,
  });
}

export function useQtdItensCriticos(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.qtdItensCriticos(),
    queryFn: () => unwrap("quantidade", 0)(() => getQtdItensCriticos()),
    ...options,
  });
}

export function useQtdServicosHoje(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.qtdServicosHoje(),
    queryFn: () => unwrap("qtdServicosHoje", 0)(() => getQtdServicosHoje()),
    ...options,
  });
}

export function useFaturamentoMes(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.faturamentoMes(),
    queryFn: async () => {
      const res = await getFaturamentoMes();
      if (!res.success) throw new Error(res.error ?? "Erro ao carregar faturamento");
      return res.data ?? { faturamentoMes: 0, percentualVariacao: null };
    },
    ...options,
  });
}

export function useFaturamentoAnual(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.faturamentoAnual(),
    queryFn: async () => {
      const res = await getFaturamentoAnual();
      if (!res.success) throw new Error(res.error ?? "Erro ao carregar faturamento anual");
      return res.data ?? { ano: new Date().getFullYear(), meses: [] };
    },
    ...options,
  });
}

export function useOrcamentosAbertos(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.orcamentosAbertos(),
    queryFn: async () => {
      const res = await getOrcamentosAbertos();
      if (!res.success) throw new Error(res.error ?? "Erro ao carregar orçamentos abertos");
      return res.data ?? { quantidade: 0, valorTotal: 0 };
    },
    ...options,
  });
}

export function useDashboardKpis() {
  const qtdAgendamentosHoje = useQtdAgendamentosHoje();
  const qtdAgendamentosFuturos = useQtdAgendamentosFuturos();
  const agendamentosFuturos = useAgendamentosFuturos();
  const estoqueCritico = useEstoqueCritico();
  const taxaOcupacaoServicos = useTaxaOcupacaoServicos();
  const qtdItensCriticos = useQtdItensCriticos();
  const faturamentoMes = useFaturamentoMes();
  const orcamentosAbertos = useOrcamentosAbertos();

  const isLoading =
    qtdAgendamentosHoje.isLoading ||
    qtdAgendamentosFuturos.isLoading ||
    agendamentosFuturos.isLoading ||
    estoqueCritico.isLoading ||
    taxaOcupacaoServicos.isLoading ||
    qtdItensCriticos.isLoading ||
    faturamentoMes.isLoading ||
    orcamentosAbertos.isLoading;

  const isError =
    qtdAgendamentosHoje.isError ||
    qtdAgendamentosFuturos.isError ||
    agendamentosFuturos.isError ||
    estoqueCritico.isError ||
    taxaOcupacaoServicos.isError ||
    qtdItensCriticos.isError ||
    faturamentoMes.isError ||
    orcamentosAbertos.isError;

  return {
    qtdAgendamentosHoje: qtdAgendamentosHoje.data ?? 0,
    qtdAgendamentosFuturos: qtdAgendamentosFuturos.data ?? 0,
    agendamentosFuturos: agendamentosFuturos.data ?? [],
    itensCriticos: estoqueCritico.data ?? [],
    taxaOcupacaoServicos: taxaOcupacaoServicos.data ?? 0,
    qtdItensCriticos: qtdItensCriticos.data ?? 0,
    faturamentoMes: faturamentoMes.data?.faturamentoMes ?? 0,
    percentualFaturamento: faturamentoMes.data?.percentualVariacao ?? null,
    orcamentosAberto: orcamentosAbertos.data?.quantidade ?? 0,
    valorOrcamentosAberto: orcamentosAbertos.data?.valorTotal ?? 0,
    isLoading,
    isError,
  };
}
