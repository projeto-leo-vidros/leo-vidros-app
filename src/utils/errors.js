const mensagensGenericas = {
  400: "Os dados informados são inválidos. Verifique e tente novamente.",
  401: "Sessão expirada. Faça login novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "Registro não encontrado.",
  409: "Operação não permitida: conflito com os dados atuais.",
  422: "Os dados enviados não são válidos.",
  500: "Erro interno no servidor. Tente novamente em instantes.",
  503: "Serviço temporariamente indisponível. Tente novamente em instantes.",
};

const mensagensTecnicas = [
  [/network error/i, "Sem conexão com o servidor. Verifique sua internet."],
  [/timeout/i, "O servidor demorou para responder. Tente novamente."],
  [/request failed/i, "Falha ao conectar com o servidor."],
  [/internal server error/i, "Erro interno no servidor. Tente novamente em instantes."],
  [/bad request/i, "Os dados informados são inválidos."],
  [/not found/i, "Registro não encontrado."],
  [/unauthorized/i, "Sessão expirada. Faça login novamente."],
  [/forbidden/i, "Você não tem permissão para realizar esta ação."],
];

export function getErroAmigavel(error, fallback = "Ocorreu um erro. Tente novamente.") {
  if (!error) return fallback;

  const mensagem = typeof error === "string" ? error : error?.message ?? "";
  const status = typeof error === "object" ? error?.status : null;

  if (status && mensagensGenericas[status]) {
    const mensagemBackend = mensagem?.trim();
    const ehTecnica = mensagensTecnicas.some(([regex]) => regex.test(mensagemBackend));
    if (mensagemBackend && !ehTecnica && mensagemBackend.length < 200) {
      return mensagemBackend;
    }
    return mensagensGenericas[status];
  }

  for (const [regex, amigavel] of mensagensTecnicas) {
    if (regex.test(mensagem)) return amigavel;
  }

  if (mensagem && mensagem.length < 200 && !/exception|stacktrace|java\.|org\./i.test(mensagem)) {
    return mensagem;
  }

  return fallback;
}

export function mostrarErro(Swal, mensagem, titulo = "Erro") {
  return Swal.fire({
    icon: "error",
    title: titulo,
    text: mensagem,
    confirmButtonText: "OK",
    confirmButtonColor: "#dc2626",
  });
}

export function mostrarSucesso(Swal, mensagem, titulo = "Sucesso") {
  return Swal.fire({
    icon: "success",
    title: titulo,
    text: mensagem,
    timer: 2000,
    showConfirmButton: false,
  });
}
