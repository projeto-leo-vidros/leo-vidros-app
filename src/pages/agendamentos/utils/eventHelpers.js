import { format, parseISO } from "date-fns";

/**
 * Extrai a data do evento de forma consistente
 * @param {Object} event - Objeto do evento
 * @returns {string|null} - Data no formato yyyy-MM-dd ou null
 */
export const getEventDate = (event) => {
  if (!event) return null;

  const rawDate =
    event.eventDate || event.dataAgendamento || event.date || event.start;

  if (!rawDate) return null;

  try {
    // Se já contém T, é ISO, senão adiciona para normalizar
    const isoDate = rawDate.includes("T") ? rawDate : `${rawDate}T00:00:00`;
    return format(parseISO(isoDate), "yyyy-MM-dd");
  } catch (error) {
    console.error("Erro ao processar data do evento:", error);
    return null;
  }
};

/**
 * Retorna valor ou fallback se vazio/nulo
 * @param {*} value - Valor a verificar
 * @param {string} fallback - Valor padrão
 * @returns {*} - Valor original ou fallback
 */
export const safe = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return value;
};

/**
 * Retorna a cor do badge baseado no tipo de agendamento
 * @param {string|Object} type - Tipo do agendamento
 * @returns {string} - Classes CSS do Tailwind
 */
export const getBadgeColor = (type) => {
  const value = type?.value || type;

  const colorMap = {
    SERVICO: "bg-blue-50 text-blue-700 border-blue-200",
    ORCAMENTO: "bg-amber-50 text-amber-700 border-amber-200",
    MANUTENCAO: "bg-green-50 text-green-700 border-green-200",
    URGENTE: "bg-red-50 text-red-700 border-red-200",
  };

  return colorMap[value] || "bg-gray-50 text-gray-700 border-gray-200";
};

/**
 * Formata endereço completo
 * @param {Object} endereco - Objeto de endereço
 * @returns {string} - Endereço formatado
 */
export const formatAddress = (endereco) => {
  if (!endereco) return "Endereço não informado";

  const parts = [];

  if (endereco.rua) parts.push(endereco.rua);
  if (endereco.numero) parts.push(`nº ${endereco.numero}`);
  if (endereco.complemento) parts.push(endereco.complemento);

  const linha1 = parts.join(", ");

  const partes2 = [];
  if (endereco.bairro) partes2.push(endereco.bairro);
  if (endereco.cidade) partes2.push(endereco.cidade);
  if (endereco.uf) partes2.push(endereco.uf);

  const linha2 = partes2.join(" - ");

  return linha1 && linha2
    ? `${linha1} • ${linha2}`
    : linha1 || linha2 || "Endereço incompleto";
};

/**
 * Retorna label legível para pedido
 * @param {Object|string} pedido - Objeto ou string do pedido
 * @returns {string} - Label formatada
 */
export const getPedidoLabel = (pedido) => {
  if (!pedido) return "Nenhum pedido vinculado";

  if (typeof pedido === "string") return pedido;

  return (
    pedido.label ||
    pedido.descricao ||
    pedido.nome ||
    (pedido.id ? `Pedido #${pedido.id}` : "Pedido sem identificação")
  );
};

/**
 * Retorna iniciais do nome
 * @param {string} nome - Nome completo
 * @returns {string} - Iniciais
 */
export const getInitials = (nome) => {
  if (!nome) return "?";

  const parts = String(nome).trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Agrupa eventos por data
 * @param {Array} events - Array de eventos
 * @returns {Object} - Objeto mapeado { 'yyyy-MM-dd': [eventos] }
 */
export const groupEventsByDate = (events) => {
  if (!events || !Array.isArray(events)) return {};

  const grouped = {};

  events.forEach((event) => {
    const dateKey = getEventDate(event);
    if (!dateKey) return;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });

  return grouped;
};

/**
 * Verifica se há eventos em uma data específica
 * @param {Object} eventsByDate - Objeto com eventos agrupados por data
 * @param {string} dateKey - Data no formato yyyy-MM-dd
 * @returns {boolean}
 */
export const hasEventsOnDate = (eventsByDate, dateKey) => {
  return eventsByDate[dateKey] && eventsByDate[dateKey].length > 0;
};

/**
 * Conta total de eventos em uma data
 * @param {Object} eventsByDate - Objeto com eventos agrupados por data
 * @param {string} dateKey - Data no formato yyyy-MM-dd
 * @returns {number}
 */
export const getEventCountForDate = (eventsByDate, dateKey) => {
  return eventsByDate[dateKey]?.length || 0;
};
