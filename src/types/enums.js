export const TipoAgendamento = Object.freeze({
  ORCAMENTO: "ORCAMENTO",
  SERVICO: "SERVICO",
});

export const StatusAgendamento = Object.freeze({
  PENDENTE: "PENDENTE",
  CONFIRMADO: "CONFIRMADO",
  EM_ANDAMENTO: "EM ANDAMENTO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
});

export const TipoPedido = Object.freeze({
  PRODUTO: "PRODUTO",
  SERVICO: "SERVICO",
});

export const StatusPedido = Object.freeze({
  AGUARDANDO_AGENDA_ORCAMENTO: "AGUARDANDO AGENDA DE ORÇAMENTO",
  ORCAMENTO_AGENDADO: "ORÇAMENTO AGENDADO",
  ANALISE_ORCAMENTO: "ANÁLISE DO ORÇAMENTO",
  ORCAMENTO_APROVADO: "ORÇAMENTO APROVADO",
  AGUARDANDO_AGENDA_SERVICO: "AGUARDANDO AGENDA DE SERVIÇO/INSTALAÇÃO",
  SERVICO_AGENDADO: "SERVIÇO AGENDADO",
  AGENDAMENTO_EM_EXECUCAO: "AGENDAMENTO EM EXECUÇÃO",
  CONCLUIDO: "CONCLUÍDO",
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

export const OrcamentoStatusOptions = Object.freeze([
  { value: StatusOrcamento.RASCUNHO,   label: "Rascunho",   color: "#64748b" },
  { value: StatusOrcamento.ENVIADO,    label: "Enviado",    color: "#3b82f6" },
  { value: StatusOrcamento.EM_ANALISE, label: "Em Análise", color: "#f59e0b" },
  { value: StatusOrcamento.APROVADO,   label: "Aprovado",   color: "#10b981" },
  { value: StatusOrcamento.RECUSADO,   label: "Recusado",   color: "#ef4444" },
  { value: StatusOrcamento.EXPIRADO,   label: "Expirado",   color: "#6b7280" },
]);
