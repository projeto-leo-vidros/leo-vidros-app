export const formatCurrency = (value) => {
  if (value == null || isNaN(Number(value))) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
};

export const parseCurrency = (value) => {
  if (!value) return 0;
  return Number(
    String(value)
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
};

export const formatPhone = (value) => {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");

  if (digits.length === 8) {
    return digits.replace(/(\d{4})(\d{4})/, "$1-$2");
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    return digits.replace(/(\d{5})(\d{4})/, "$1-$2");
  }

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export const formatDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR").format(date);
};

export const formatDateTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const toInputDate = (date = new Date()) => {
  return date.toISOString().split("T")[0];
};

export const formatCpf = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export const formatCep = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
};
