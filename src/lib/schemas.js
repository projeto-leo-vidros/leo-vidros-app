import { z } from "zod";

const cpfRequired = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length > 0, { message: "CPF e obrigatorio" })
  .refine((v) => v.length === 11, { message: "CPF invalido" });

const telefoneRequired = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length > 0, { message: "Telefone e obrigatorio" })
  .refine((v) => v.length === 10 || v.length === 11, {
    message: "Telefone invalido",
  });

const cepRaw = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/\D/g, "") : ""))
  .refine((v) => v === "" || v.length === 8, { message: "CEP invalido" });

const cepRequired = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length > 0, { message: "CEP e obrigatorio" })
  .refine((v) => v.length === 8, { message: "CEP invalido" });

const ufField = z
  .string()
  .max(2, "UF deve ter no maximo 2 caracteres")
  .optional()
  .default("");

const ufRequired = z
  .string()
  .trim()
  .min(1, "UF e obrigatoria")
  .max(2, "UF deve ter no maximo 2 caracteres");

export const enderecoSchema = z.object({
  cep: cepRaw,
  rua: z.string().min(1, "Rua e obrigatoria"),
  complemento: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  cidade: z.string().min(1, "Cidade e obrigatoria"),
  uf: ufField,
  pais: z.string().optional().default("Brasil"),
});

export const enderecoOpcionalSchema = z.object({
  cep: cepRaw,
  rua: z.string().optional().default(""),
  complemento: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  cidade: z.string().optional().default(""),
  uf: ufField,
  pais: z.string().optional().default("Brasil"),
});

export const clienteSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: cpfRequired,
  contato: telefoneRequired,
  email: z
    .string()
    .trim()
    .min(1, "Email e obrigatorio")
    .email("Email invalido"),
  status: z.enum(["Ativo", "Inativo", "Finalizado"]).default("Inativo"),
  cep: cepRequired,
  rua: z.string().trim().min(1, "Rua e obrigatoria"),
  complemento: z.string().optional().default(""),
  bairro: z.string().trim().min(1, "Bairro e obrigatorio"),
  cidade: z.string().trim().min(1, "Cidade e obrigatoria"),
  uf: ufRequired,
});

export const clientePayloadSchema = clienteSchema.transform((data) => ({
  nome: data.nome,
  cpf: data.cpf || undefined,
  email: data.email || undefined,
  telefone: data.contato || undefined,
  status: data.status,
  enderecos: [
    {
      cep: data.cep,
      rua: data.rua,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      pais: "Brasil",
    },
  ],
}));

export const pedidoProdutoEtapa0Schema = z
  .object({
    tipoCliente: z.enum(["existente", "novo", "nenhum"]),
    clienteId: z.union([z.string(), z.number()]).optional(),
    clienteNome: z.string().optional().default(""),
    clienteTelefone: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.tipoCliente === "existente" && !data.clienteId) {
      ctx.addIssue({
        path: ["clienteId"],
        code: z.ZodIssueCode.custom,
        message: "Selecione um cliente",
      });
    }
    if (data.tipoCliente === "novo") {
      if (!data.clienteNome?.trim()) {
        ctx.addIssue({
          path: ["clienteNome"],
          code: z.ZodIssueCode.custom,
          message: "Nome do cliente e obrigatorio",
        });
      }
      if (!data.clienteTelefone?.trim()) {
        ctx.addIssue({
          path: ["clienteTelefone"],
          code: z.ZodIssueCode.custom,
          message: "Telefone do cliente e obrigatorio",
        });
      }
    }
  });

const itemProdutoSchema = z.object({
  produtoId: z
    .union([z.string(), z.number()])
    .refine((v) => v !== "" && v !== 0, {
      message: "Selecione um produto",
    }),
  nome: z.string().optional().default(""),
  quantidade: z
    .number({ coerce: true })
    .min(1, "Quantidade deve ser maior que zero"),
  preco: z.number({ coerce: true }).min(0, "Preco invalido"),
  subtotal: z.number({ coerce: true }).optional().default(0),
});

export const pedidoProdutoEtapa1Schema = z.object({
  produtos: z.array(itemProdutoSchema).min(1, "Adicione pelo menos um produto"),
});

export const pedidoProdutoEtapa2Schema = z.object({
  formaPagamento: z.string().min(1, "Selecione uma forma de pagamento"),
});

export const pedidoServicoEtapa0Schema = z
  .object({
    tipoCliente: z.enum(["existente", "novo", "nenhum"]),
    clienteId: z.union([z.string(), z.number()]).optional(),
    clienteNome: z.string().optional().default(""),
    clienteTelefone: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.tipoCliente === "existente" && !data.clienteId) {
      ctx.addIssue({
        path: ["clienteId"],
        code: z.ZodIssueCode.custom,
        message: "Selecione um cliente",
      });
    }
    if (data.tipoCliente === "novo") {
      if (!data.clienteNome?.trim()) {
        ctx.addIssue({
          path: ["clienteNome"],
          code: z.ZodIssueCode.custom,
          message: "Nome do cliente e obrigatorio",
        });
      }
      if (!data.clienteTelefone?.trim()) {
        ctx.addIssue({
          path: ["clienteTelefone"],
          code: z.ZodIssueCode.custom,
          message: "Telefone do cliente e obrigatorio",
        });
      }
    }
    if (data.tipoCliente === "nenhum" && !data.clienteNome?.trim()) {
      ctx.addIssue({
        path: ["clienteNome"],
        code: z.ZodIssueCode.custom,
        message: "Nome para identificacao e obrigatorio",
      });
    }
  });

export const pedidoServicoEtapa1Schema = z.object({
  endereco: z.object({
    rua: z.string().min(1, "Endereco e obrigatorio"),
    cidade: z.string().min(1, "Cidade e obrigatoria"),
    cep: z.string().optional().default(""),
    complemento: z.string().optional().default(""),
    bairro: z.string().optional().default(""),
    uf: z.string().max(2).optional().default(""),
  }),
});

const itemServicoSchema = z.object({
  nome: z.string().min(1, "Nome do servico e obrigatorio"),
  descricao: z.string().optional().default(""),
  precoEstimado: z.number({ coerce: true }).min(0).optional().default(0),
  observacoes: z.string().optional().default(""),
});

export const pedidoServicoEtapa2Schema = z.object({
  servicos: z.array(itemServicoSchema).min(1, "Adicione pelo menos um servico"),
});

export const zodFirstError = (zodError) =>
  zodError.errors[0]?.message ?? "Dados invalidos";
