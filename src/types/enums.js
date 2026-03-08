export const TipoAgendamento = Object.freeze({
  ORCAMENTO: "ORCAMENTO",
  SERVICO: "SERVICO",
});

export const StatusAgendamento = Object.freeze({
  PENDENTE: "PENDENTE",
  CONFIRMADO: "CONFIRMADO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
});

export const TipoPedido = Object.freeze({
  PRODUTO: "PRODUTO",
  SERVICO: "SERVICO",
});

export const StatusPedido = Object.freeze({
  EM_ABERTO: "EM_ABERTO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDO: "CONCLUIDO",
  CANCELADO: "CANCELADO",
});

export const StatusSolicitacao = Object.freeze({
  PENDENTE: "PENDENTE",
  ACEITO: "ACEITO",
  RECUSADO: "RECUSADO",
});

export const StatusSolicitacaoMap = Object.freeze({
  Pendentes: StatusSolicitacao.PENDENTE,
  Aprovados: StatusSolicitacao.ACEITO,
  Recusados: StatusSolicitacao.RECUSADO,
});

export const TipoMovimentacao = Object.freeze({
  ENTRADA: "ENTRADA",
  SAIDA: "SAIDA",
});

export const StatusEstoque = Object.freeze({
  ATIVO: "ATIVO",
  INATIVO: "INATIVO",
  CRITICO: "CRITICO",
});

export const StatusOrcamento = Object.freeze({
  RASCUNHO: "RASCUNHO",
  ENVIADO: "ENVIADO",
  EM_ANALISE: "EM_ANALISE",
  APROVADO: "APROVADO",
  RECUSADO: "RECUSADO",
  EXPIRADO: "EXPIRADO",
});

export const OrcamentoProgressStatus = Object.freeze({
  GERANDO_ORCAMENTO: "GERANDO_ORCAMENTO",
  GERANDO_PDF: "GERANDO_PDF",
  FINALIZADO: "FINALIZADO",
  ERRO: "ERRO",
});
