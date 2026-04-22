export const queryKeys = {
  dashboard: {
    all: () => ["dashboard"],
    qtdAgendamentosHoje: () => ["dashboard", "qtdAgendamentosHoje"],
    qtdAgendamentosFuturos: () => ["dashboard", "qtdAgendamentosFuturos"],
    agendamentosFuturos: () => ["dashboard", "agendamentosFuturos"],
    estoqueCritico: () => ["dashboard", "estoqueCritico"],
    taxaOcupacaoServicos: () => ["dashboard", "taxaOcupacaoServicos"],
    qtdItensCriticos: () => ["dashboard", "qtdItensCriticos"],
    qtdServicosHoje: () => ["dashboard", "qtdServicosHoje"],
    faturamentoMes: () => ["dashboard", "faturamentoMes"],
    faturamentoAnual: () => ["dashboard", "faturamentoAnual"],
    orcamentosAbertos: () => ["dashboard", "orcamentosAbertos"],
  },

  agendamentos: {
    all: () => ["agendamentos"],
    list: () => ["agendamentos", "lista"],
    detail: (id) => ["agendamentos", "detalhe", id],
  },

  pedidos: {
    all: () => ["pedidos"],
    list: () => ["pedidos", "lista"],
    produtos: () => ["pedidos", "produtos"],
    servicos: () => ["pedidos", "servicos"],
    detail: (id) => ["pedidos", "detalhe", id],
    byEtapa: (etapa) => ["pedidos", "etapa", etapa],
  },

  servicos: {
    all: () => ["servicos"],
    list: () => ["servicos", "lista"],
    detail: (id) => ["servicos", "detalhe", id],
    byEtapa: (etapa) => ["servicos", "etapa", etapa],
  },
  funcionarios: {
    all: () => ["funcionarios"],
    list: () => ["funcionarios", "lista"],
    detail: (id) => ["funcionarios", "detalhe", id],
    agenda: (id, dataInicio, dataFim) => [
      "funcionarios",
      "agenda",
      id,
      dataInicio,
      dataFim,
    ],
    disponiveis: (data, inicio, fim) => [
      "funcionarios",
      "disponiveis",
      data,
      inicio,
      fim,
    ],
  },

  orcamentos: {
    all: () => ["orcamentos"],
    list: () => ["orcamentos", "lista"],
    detail: (id) => ["orcamentos", "detalhe", id],
    porPedido: (pedidoId) => ["orcamentos", "pedido", pedidoId],
  },
};
