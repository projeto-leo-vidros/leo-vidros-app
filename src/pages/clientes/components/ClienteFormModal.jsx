import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";
import PropTypes from "prop-types";
import { User, X, Save } from "lucide-react";
import { cn } from "../../../utils/cn";
import { clienteSchema } from "../../../lib/schemas";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import Button from "../../../components/ui/Button/Button.component";

//  Valores padrão do formulário
const DEFAULT_VALUES = {
  nome: "",
  cpf: "",
  contato: "",
  email: "",
  status: "Inativo",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

//  Helper para gerar classes adicionais específicas de máscara.
//  O estilo base (bordas, foco, erro, desabilitado, etc.) vem do UniversalInput.
const getMaskedInputClasses = () => "";



export default function ClienteFormModal({
  open,
  onClose,
  onSubmit,
  modoEdicao,
  clienteInicial,
}) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepApiError, setCepApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  //  React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const statusAtual = watch("status");

  // Popula o formulário ao abrir no modo edição
  useEffect(() => {
    if (!open) return;

    if (modoEdicao && clienteInicial) {
      const endereco = clienteInicial.enderecos?.[0] || {};
      reset({
        nome: clienteInicial.nome ?? "",
        cpf: clienteInicial.cpf ?? "",
        contato: clienteInicial.telefone ?? "",
        email: clienteInicial.email ?? "",
        status: clienteInicial.status ?? "Inativo",
        cep: endereco.cep ?? "",
        rua: endereco.rua ?? "",
        numero: String(endereco.numero ?? ""),
        complemento: endereco.complemento ?? "",
        bairro: endereco.bairro ?? "",
        cidade: endereco.cidade ?? "",
        uf: endereco.uf ?? "",
      });
    } else {
      reset(DEFAULT_VALUES);
    }
    setCepApiError("");
  }, [open, modoEdicao, clienteInicial, reset]);

  //  Lookup de CEP via ViaCEP
  const buscarCep = async (cepMasked) => {
    const cepLimpo = cepMasked.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setLoadingCep(true);
    setCepApiError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepApiError("CEP nao encontrado");
        return;
      }
      if (data.logradouro)
        setValue("rua", data.logradouro, { shouldValidate: true });
      if (data.bairro)
        setValue("bairro", data.bairro, { shouldValidate: true });
      if (data.localidade)
        setValue("cidade", data.localidade, { shouldValidate: true });
      if (data.uf) setValue("uf", data.uf, { shouldValidate: true });
    } catch {
      setCepApiError("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  //  Submit
  // Zod ja remove mascaras via .transform()  data aqui ja tem digitos puros
  const onFormSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        nome: data.nome,
        cpf: data.cpf || undefined,
        email: data.email || undefined,
        telefone: data.contato || undefined,
        status: data.status,
        enderecos: [
          {
            cep: data.cep,
            rua: data.rua,
            numero: data.numero ? Number(data.numero) : undefined,
            complemento: data.complemento,
            bairro: data.bairro,
            cidade: data.cidade,
            uf: data.uf?.toUpperCase(),
            pais: "Brasil",
          },
        ],
      };

      const result = onSubmit(payload);
      if (result && typeof result.then === "function") await result;
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => reset(DEFAULT_VALUES), 300);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-start px-10 py-20 overflow-y-auto z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[130vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-[#eeeeee] p-2.5 rounded-lg">
              <User className="w-6 h-6 text-[#828282]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {modoEdicao ? "Editar Cliente" : "Adicionar novo cliente"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
          noValidate
        >
          <div className="flex flex-col gap-9 px-6 py-4 space-y-6 flex-1 overflow-y-auto">
            {/* Informacoes Basicas */}
            <section className="flex flex-col gap-5">
              <h3 className="text-lg font-bold text-gray-700">
                Informacoes Basicas
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <UniversalInput
                  label="Nome"
                  required
                  registration={register("nome")}
                  error={errors.nome}
                  placeholder="Ex: Tiago Mendes"
                />

                <UniversalInput label="CPF" required error={errors.cpf}>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        {...field}
                        mask="000.000.000-00"
                        placeholder="Ex: 123.456.789-00"
                        className={getMaskedInputClasses(!!errors.cpf)}
                        onAccept={(value) => field.onChange(value)}
                      />
                    )}
                  />
                </UniversalInput>

                <UniversalInput
                  label="Telefone"
                  required
                  error={errors.contato}
                >
                  <Controller
                    name="contato"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        {...field}
                        mask="(00) 00000-0000"
                        placeholder="Ex: (11) 91234-5678"
                        className={getMaskedInputClasses(!!errors.contato)}
                        onAccept={(value) => field.onChange(value)}
                      />
                    )}
                  />
                </UniversalInput>

                <UniversalInput
                  label="Email"
                  required
                  type="email"
                  registration={register("email")}
                  error={errors.email}
                  placeholder="Ex: tiago.mendes@email.com"
                />
              </div>
            </section>

            {/* Endereco */}
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-gray-700">Endereco</h3>

              <div className="grid grid-cols-2 gap-4">
                <UniversalInput
                  label="CEP"
                  required
                  error={
                    errors.cep ||
                    (cepApiError ? { message: cepApiError } : undefined)
                  }
                  endIcon={
                    loadingCep && (
                      <div className="w-4 h-4 border-2 border-[#007EA7] border-t-transparent rounded-full animate-spin" />
                    )
                  }
                >
                  <Controller
                    name="cep"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        {...field}
                        mask="00000-000"
                        placeholder="Ex: 80035-010"
                        className={cn(
                          getMaskedInputClasses(!!errors.cep || !!cepApiError),
                          loadingCep && "pr-10"
                        )}
                        onAccept={(value) => {
                          field.onChange(value);
                          buscarCep(value);
                        }}
                      />
                    )}
                  />
                </UniversalInput>

                <UniversalInput
                  label="Rua"
                  required
                  registration={register("rua")}
                  error={errors.rua}
                  placeholder="Ex: Rua das Flores"
                />

                <UniversalInput
                  label="Bairro"
                  required
                  registration={register("bairro")}
                  error={errors.bairro}
                  placeholder="Ex: Centro"
                />

                <UniversalInput
                  label="Complemento"
                  registration={register("complemento")}
                  error={errors.complemento}
                  placeholder="Ex: Bloco B, apto 13"
                />

                <UniversalInput
                  label="Cidade"
                  required
                  registration={register("cidade")}
                  error={errors.cidade}
                  placeholder="Ex: Sao Paulo"
                />

                <UniversalInput
                  label="UF"
                  required
                  registration={register("uf")}
                  error={errors.uf}
                  placeholder="Ex: SP"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
            </section>

            {/* Status */}
            <section className="flex flex-col gap-3">
              <h3 className="text-md font-semibold text-gray-700">Status</h3>
              <UniversalInput
                as="toggle"
                label={`Possui servico em andamento (Status: ${statusAtual})`}
                checked={statusAtual === "Ativo"}
                onChange={(e) =>
                  setValue(
                    "status",
                    e.target.checked ? "Ativo" : "Inativo",
                    {
                      shouldValidate: true,
                    },
                  )
                }
              />
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              startIcon={<Save className="w-4 h-4" />}
            >
              {submitting
                ? "Salvando..."
                : modoEdicao
                  ? "Salvar Alteracoes"
                  : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

ClienteFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  modoEdicao: PropTypes.bool,
  clienteInicial: PropTypes.object,
};
