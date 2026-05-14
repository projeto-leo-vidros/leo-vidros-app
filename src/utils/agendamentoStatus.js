export const normalizeStatus = (s) =>
  (s || "PENDENTE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

export const statusConfig = {
  PENDENTE: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
  },
  CONFIRMADO: {
    label: "Confirmado",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  CONCLUIDO: {
    label: "Concluído",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  CANCELADO: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  "EM ANDAMENTO": {
    label: "Em Andamento",
    color: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
};

export const getStatusConfig = (status) =>
  statusConfig[normalizeStatus(status)] || statusConfig.PENDENTE;

export const tipoConfig = {
  SERVICO: {
    label: "Serviço",
    color: "bg-blue-100 text-blue-700",
    dotColor: "#3B82F6",
  },
  ORCAMENTO: {
    label: "Orçamento",
    color: "bg-amber-100 text-amber-700",
    dotColor: "#FBBF24",
  },
};

export const getTipoConfig = (tipo) => tipoConfig[tipo] || tipoConfig.SERVICO;

export const statusColors = {
  PENDENTE: {
    bg: "bg-yellow-100",
    border: "border-l-yellow-500",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  CONFIRMADO: {
    bg: "bg-green-100",
    border: "border-l-green-500",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  CONCLUIDO: {
    bg: "bg-blue-100",
    border: "border-l-blue-500",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  CANCELADO: {
    bg: "bg-red-100",
    border: "border-l-red-500",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  "EM ANDAMENTO": {
    bg: "bg-purple-100",
    border: "border-l-purple-500",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
};

export const tipoColors = {
  SERVICO: "#3B82F6",
  ORCAMENTO: "#FBBF24",
};

export const STATUS_COLORS_MAP = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EM_EXECUCAO: "bg-indigo-100 text-indigo-800",
  "EM ANDAMENTO": "bg-indigo-100 text-indigo-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export const getStatusColor = (status) =>
  STATUS_COLORS_MAP[normalizeStatus(status)] || "bg-gray-100 text-gray-800";

export const TIPO_COLORS = {
  SERVICO: "bg-purple-100 text-purple-800",
  ORCAMENTO: "bg-orange-100 text-orange-800",
};

const normalizePedidoStatus = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\//g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

export const pedidoStatusConfig = {
  "AGUARDANDO AGENDA DE ORCAMENTO": {
    label: "Aguardando Orçamento",
    color: "bg-amber-100 text-amber-800",
    gradient: "from-amber-500 to-amber-600 border-amber-700",
  },
  "ORCAMENTO AGENDADO": {
    label: "Orçamento Agendado",
    color: "bg-sky-100 text-sky-800",
    gradient: "from-sky-500 to-sky-600 border-sky-700",
  },
  "ANALISE DO ORCAMENTO": {
    label: "Análise do Orçamento",
    color: "bg-indigo-100 text-indigo-800",
    gradient: "from-indigo-500 to-indigo-600 border-indigo-700",
  },
  "ORCAMENTO APROVADO": {
    label: "Orçamento Aprovado",
    color: "bg-green-100 text-green-800",
    gradient: "from-green-500 to-green-600 border-green-700",
  },
  "AGUARDANDO AGENDA DE SERVICO INSTALACAO": {
    label: "Aguardando Serviço",
    color: "bg-orange-100 text-orange-800",
    gradient: "from-orange-500 to-orange-600 border-orange-700",
  },
  "SERVICO AGENDADO": {
    label: "Serviço Agendado",
    color: "bg-cyan-100 text-cyan-800",
    gradient: "from-cyan-500 to-cyan-600 border-cyan-700",
  },
  "AGENDAMENTO EM EXECUCAO": {
    label: "Em Execução",
    color: "bg-purple-100 text-purple-800",
    gradient: "from-purple-500 to-purple-600 border-purple-700",
  },
  "CONCLUIDO": {
    label: "Concluído",
    color: "bg-slate-100 text-slate-600",
    gradient: "from-slate-500 to-slate-600 border-slate-700",
  },
  // Legacy / produto pedido statuses
  "ATIVO": {
    label: "Ativo",
    color: "bg-blue-100 text-blue-800",
    gradient: "from-blue-500 to-blue-600 border-blue-700",
  },
  "PENDENTE": {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800",
    gradient: "from-yellow-500 to-yellow-600 border-yellow-700",
  },
  "INATIVO": {
    label: "Inativo",
    color: "bg-slate-100 text-slate-600",
    gradient: "from-slate-500 to-slate-600 border-slate-700",
  },
  "FINALIZADO": {
    label: "Finalizado",
    color: "bg-slate-100 text-slate-600",
    gradient: "from-slate-500 to-slate-600 border-slate-700",
  },
  "CANCELADO": {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    gradient: "from-red-500 to-red-600 border-red-700",
  },
  "EM ANDAMENTO": {
    label: "Em Andamento",
    color: "bg-yellow-100 text-yellow-800",
    gradient: "from-yellow-500 to-yellow-600 border-yellow-700",
  },
};

export const getPedidoStatusConfig = (status) => {
  const norm = normalizePedidoStatus(status);
  return (
    pedidoStatusConfig[norm] || {
      label: status || "Indefinido",
      color: "bg-gray-100 text-gray-700",
      gradient: "from-[#007EA7] to-[#006891] border-[#005a7a]",
    }
  );
};
