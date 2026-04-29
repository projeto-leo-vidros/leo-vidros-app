import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PropTypes from "prop-types";
import { User } from "lucide-react";
import { clienteSchema, clienteAvulsoSchema } from "../../../lib/schemas";
import UniversalInput from "../../../components/ui/Input/UniversalInput";
import Button from "../../../components/ui/Button/Button.component";
import { modalClasses } from "../../../components/ui/modal/modalStyles";
import { cepMask, cpfMask, phoneMask } from "../../../utils/masks";

const normalizeClienteStatus = (status) => {
  const normalized = String(status ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalized === "ATIVO") return "Ativo";
  if (normalized === "INATIVO") return "Inativo";
  if (normalized === "FINALIZADO") return "Finalizado";
  if (normalized === "AVULSO") return "Avulso";

  return "Inativo";
};

const isAvulso = (status) =>
  String(status ?? "").trim().toUpperCase() === "AVULSO";

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

  const clienteEhAvulso = modoEdicao && isAvulso(clienteInicial?.status);
  const schemaAtivo = clienteEhAvulso ? clienteAvulsoSchema : clienteSchema;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaAtivo),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const statusAtual = watch("status");
  const cpfValue = watch("cpf");
  const contatoValue = watch("contato");
  const cepValue = watch("cep");

  useEffect(() => {
    if (!open) return;

    if (modoEdicao && clienteInicial) {
      const endereco = clienteInicial.enderecos?.[0] || {};
      reset({
        nome: clienteInicial.nome ?? "",
        cpf: cpfMask(clienteInicial.cpf ?? ""),
        contato: phoneMask(clienteInicial.telefone ?? ""),
        email: clienteInicial.email ?? "",
        status: normalizeClienteStatus(clienteInicial.status),
        cep: cepMask(endereco.cep ?? ""),
        rua: endereco.rua ?? "",
        numero: endereco.numero ?? "",
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

      if (data.logradouro) {
        setValue("rua", data.logradouro, { shouldValidate: true });
      }
      if (data.bairro) {
        setValue("bairro", data.bairro, { shouldValidate: true });
      }
      if (data.localidade) {
        setValue("cidade", data.localidade, { shouldValidate: true });
      }
      if (data.uf) {
        setValue("uf", data.uf, { shouldValidate: true });
      }
    } catch {
      setCepApiError("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const onFormSubmit = async (data) => {
    setSubmitting(true);

    try {
      const enderecoTemDados = data.rua?.trim() || data.cep?.trim() || data.cidade?.trim();
      const payload = {
        nome: data.nome,
        cpf: data.cpf || undefined,
        email: data.email || undefined,
        telefone: data.contato || undefined,
        status: data.status,
        enderecos: enderecoTemDados
          ? [
              {
                cep: data.cep || "",
                rua: data.rua || "",
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro || "",
                cidade: data.cidade || "",
                uf: data.uf?.toUpperCase() || "",
                pais: "Brasil",
              },
            ]
          : [],
      };

      const result = onSubmit(payload);
      if (result && typeof result.then === "function") {
        await result;
      }
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
    <div className={modalClasses.overlay} onClick={handleClose}>
      <div
        className={`${modalClasses.panel} flex max-h-[92vh] max-w-4xl flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className={modalClasses.headerTitle}>
                {modoEdicao ? "Editar Cliente" : "Adicionar novo cliente"}
              </h2>
              {clienteEhAvulso && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  Cliente avulso — preencha os dados para completar o cadastro
                </p>
              )}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
          noValidate
        >
          <div
            className={`${modalClasses.body} flex flex-1 flex-col gap-9 space-y-6`}
          >
            <section className="flex flex-col gap-5">
              <h3 className="text-left text-lg font-bold text-gray-700">
                Informações Básicas
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <UniversalInput
                  label="Nome"
                  required
                  registration={register("nome")}
                  error={errors.nome}
                  placeholder="Digite o nome completo"
                />

                <UniversalInput
                  label="CPF"
                  required={!clienteEhAvulso}
                  error={errors.cpf}
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpfValue}
                  onChange={(e) =>
                    setValue("cpf", cpfMask(e.target.value), {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />

                <UniversalInput
                  label="Telefone"
                  required={!clienteEhAvulso}
                  error={errors.contato}
                  type="text"
                  inputMode="tel"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  value={contatoValue}
                  onChange={(e) =>
                    setValue("contato", phoneMask(e.target.value), {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />

                <UniversalInput
                  label="Email"
                  required={!clienteEhAvulso}
                  type="email"
                  registration={register("email")}
                  error={errors.email}
                  placeholder="nome@exemplo.com"
                />
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-left text-lg font-bold text-gray-700">
                Endereço
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <UniversalInput
                  label="CEP"
                  required={!clienteEhAvulso}
                  error={
                    errors.cep ||
                    (cepApiError ? { message: cepApiError } : undefined)
                  }
                  endIcon={
                    loadingCep && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#007EA7] border-t-transparent" />
                    )
                  }
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  value={cepValue}
                  onChange={(e) => {
                    const maskedValue = cepMask(e.target.value);

                    setValue("cep", maskedValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    if (maskedValue.replace(/\D/g, "").length === 8) {
                      buscarCep(maskedValue);
                    }
                  }}
                />

                <UniversalInput
                  label="Rua"
                  required={!clienteEhAvulso}
                  registration={register("rua")}
                  error={errors.rua}
                  placeholder="Digite a rua"
                />

                <UniversalInput
                  label="Número"
                  registration={register("numero")}
                  error={errors.numero}
                  placeholder="Digite o número"
                />

                <UniversalInput
                  label="Bairro"
                  required={!clienteEhAvulso}
                  registration={register("bairro")}
                  error={errors.bairro}
                  placeholder="Digite o bairro"
                />

                <UniversalInput
                  label="Complemento"
                  registration={register("complemento")}
                  error={errors.complemento}
                  placeholder="Digite o complemento"
                />

                <UniversalInput
                  label="Cidade"
                  required={!clienteEhAvulso}
                  registration={register("cidade")}
                  error={errors.cidade}
                  placeholder="Digite a cidade"
                />

                <UniversalInput
                  label="UF"
                  required={!clienteEhAvulso}
                  registration={register("uf")}
                  error={errors.uf}
                  placeholder="Digite a UF"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-md font-semibold text-gray-700">Status</h3>
              {clienteEhAvulso ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-500">
                    Status atual: <span className="font-medium text-amber-600">Avulso</span>
                  </p>
                  <UniversalInput
                    as="toggle"
                    label="Promover para cliente Ativo (preencha os dados acima)"
                    checked={statusAtual === "Ativo"}
                    onChange={(e) =>
                      setValue("status", e.target.checked ? "Ativo" : "Avulso", {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              ) : (
                <UniversalInput
                  as="toggle"
                  label={`Possui servico em andamento (Status: ${statusAtual})`}
                  checked={statusAtual === "Ativo"}
                  onChange={(e) =>
                    setValue("status", e.target.checked ? "Ativo" : "Inativo", {
                      shouldValidate: true,
                    })
                  }
                />
              )}
            </section>
          </div>

          <div className={modalClasses.footer}>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
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
