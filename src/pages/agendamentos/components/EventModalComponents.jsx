import React from "react";
import {
  MapPin,
  FileText,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  Edit,
  Trash2,
  Package,
  X,
  Tag,
} from "lucide-react";
import { getAgendamentoDisplayName, getInitials } from "../utils/eventHelpers";
import Button from "../../../components/ui/Button/Button.component";
import { cn } from "../../../utils/cn";

export const EventInfoRow = ({
  icon: Icon,
  title,
  content,
  className = "",
}) => {
  if (!content) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2 text-gray-500">
        {Icon && <Icon size={18} className="shrink-0 text-[#134074ff]/60" />}
        <span className="text-xs font-bold tracking-wider uppercase">
          {title}
        </span>
      </div>
      <div className="pl-7 text-sm text-gray-800">{content}</div>
    </div>
  );
};

export const EventHeader = ({ title, badges, onClose }) => {
  return (
    <div className="flex flex-row items-center justify-between border-b border-gray-100 px-6 pt-5 pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded">
            <Calendar size={20} className="text-gray-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {title || "Detalhes do Agendamento"}
          </h2>
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const EventInfo = ({
  event,
  date,
  startTime,
  endTime,
  servico,
  endereco,
  produtos,
}) => {
  const formatEndereco = (endereco) => {
    if (!endereco) return "Endereço não informado";

    const parts = [
      endereco.rua,
      endereco.numero ? `nº ${endereco.numero}` : null,
      endereco.complemento,
      endereco.bairro,
      endereco.cidade,
      endereco.uf,
    ].filter(Boolean);

    return parts.join(", ");
  };

  return (
    <div className="flex flex-col gap-5 px-6 pt-2">
      {/* Data e Horário em Destaque Absoluto */}
      <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex flex-1 items-center gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm">
            <Calendar className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <p className="mb-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Data do Agendamento
            </p>
            <span className="text-base font-bold text-gray-900">
              {date}
            </span>
          </div>
        </div>

        <div className="hidden h-10 w-px bg-gray-200 sm:block" />

        <div className="flex flex-1 items-center gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm">
            <Clock className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <p className="mb-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Horário
            </p>
            <span className="text-base font-bold text-gray-900">
              {startTime} — {endTime}
            </span>
          </div>
        </div>
      </div>

      {/* Serviço */}
      {servico ? (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="rounded-md border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div className="mt-1 w-full text-start">
            <h3 className="text-md mb-1.5 text-left font-bold text-gray-900">
              {getAgendamentoDisplayName(event || { servico }).fullTitle}
            </h3>
            {servico.descricao && (
              <p className="mt-1.5 text-sm text-gray-800">
                {servico.descricao}
              </p>
            )}
          </div>

          <div className="my-2 h-px w-full bg-gray-200 sm:my-0 sm:h-12 sm:w-px" />

          <span className="flex w-max items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-gray-600">
            Cód: {servico.codigo}
          </span>

          <div className="my-2 h-px w-full shrink-0 bg-gray-200 sm:my-0 sm:h-12 sm:w-px" />

          <span className="flex w-max items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-green-700">
            <Tag size={12} />
            <span className="text-sm font-bold text-green-700">
              R$ {servico.precoBase?.toFixed(2)}
            </span>
          </span>
        </div>
      ) : (
        <EventInfoRow
          icon={FileText}
          title="Serviço"
          content={<span className="text-gray-500 italic">Não informado</span>}
        />
      )}

      {/* Localização */}
      <div className="flex items-start gap-4">
        <div className="rounded-md border border-gray-200 bg-white p-2 text-gray-500 shadow-sm">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="mt-1 flex-1 text-left">
          <h3 className="pb-1.5 text-sm font-bold tracking-wider text-gray-900 uppercase">
            Localização
          </h3>
          <p className="text-sm leading-relaxed font-medium text-gray-800">
            {formatEndereco(endereco)}
          </p>
          {endereco?.cep && (
            <p className="mt-1.5 text-xs font-semibold text-gray-400">
              CEP: {endereco.cep}
            </p>
          )}
        </div>
      </div>

      {/* Produtos */}
      {produtos && produtos.length > 0 && (
        <div className="flex items-start gap-4">
          <div className="rounded-md border border-gray-200 bg-white p-2 text-gray-500 shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <div className="mt-1 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                Produtos Utilizados
              </h3>
              <span className="rounded bg-[#134074ff]/10 px-2 py-0.5 text-[10px] font-bold text-[#134074ff]">
                {produtos.length} ITENS
              </span>
            </div>

            <div className="space-y-3">
              {produtos.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-[#007EA7]" />
                    <span className="text-sm font-medium text-gray-800">
                      {item.produto.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Reserva:
                    </span>
                    <span className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1 text-sm font-bold text-gray-700">
                      {item.quantidadeReservada}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const EventTeam = ({ funcionarios }) => {
  return (
    <div className="flex flex-col gap-3 px-6 pt-3 pb-2">
      <div className="flex items-start gap-4">
        <div className="rounded-md border border-gray-200 bg-white p-2 text-gray-500 shadow-sm">
          <Users className="h-5 w-5" />
        </div>
        <div className="mt-1 flex-1">
          <h3 className="mb-3 text-start text-sm font-bold tracking-wider text-gray-900 uppercase">
            Equipe Responsável
          </h3>

          {!funcionarios || funcionarios.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Sem equipe atribuída</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {funcionarios.map((func, idx) => {
                const nome = func.label || func.nome || func;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 py-1.5 pr-4 pl-1.5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#134074ff] text-xs font-bold tracking-wider text-white uppercase shadow-sm">
                      {getInitials(nome)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {nome}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const EventObservations = ({ observacao }) => {
  if (!observacao) return null;

  return (
    <div className="px-6 py-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-amber-600" />
          <h3 className="text-xs font-bold tracking-wider text-amber-800 uppercase">
            Observações Importantes
          </h3>
        </div>
        <p className="leading-relaxed whitespace-pre-wrap">
          {observacao}
        </p>
      </div>
    </div>
  );
};

export const EventFooter = ({
  onDelete,
  onViewMap,
  onEdit,
  isDeleting,
  isLoading,
  hasAddress,
  canDelete = true,
  canEdit = true,
}) => {
  return (
    <div className="mt-4 flex flex-wrap-reverse items-center justify-end gap-3 rounded-b-xl border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-nowrap">
      {canDelete && (
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={isLoading || isDeleting}
          className="mr-auto w-full sm:w-auto"
          startIcon={<Trash2 size={16} />}
        >
          {isDeleting ? "Cancelando..." : "Cancelar Agendamento"}
        </Button>
      )}

      {canEdit && (
        <Button
          variant="outline"
          onClick={onEdit}
          disabled={isLoading}
          className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 sm:w-auto"
          startIcon={<Edit size={16} />}
        >
          Editar Detalhes
        </Button>
      )}

      <Button
        variant="primary"
        onClick={onViewMap}
        disabled={!hasAddress || isLoading}
        className="w-full bg-[#134074ff] text-white hover:bg-[#0c2e59] sm:w-auto"
        startIcon={<MapPin size={16} />}
      >
        Ver no Mapa
      </Button>
    </div>
  );
};

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-gray-100 border-t-[#134074ff]"></div>
      <span className="text-sm font-semibold tracking-wide text-gray-500">
        Carregando detalhes...
      </span>
    </div>
  );
};

export const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="m-7 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      <X size={18} className="mt-0.5 shrink-0 text-red-600" />
      <span className="text-sm leading-relaxed font-medium">{message}</span>
    </div>
  );
};
