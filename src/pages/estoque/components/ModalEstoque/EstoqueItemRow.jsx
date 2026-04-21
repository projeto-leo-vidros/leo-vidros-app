import { memo } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import UniversalInput from "../../../../components/ui/Input/UniversalInput";

const EstoqueItemRow = ({
  item,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const situacaoClasse =
    item.situacao === "Fora de estoque"
      ? "text-red-600 font-semibold"
      : item.situacao === "Abaixo do normal"
        ? "text-yellow-600 font-semibold"
        : item.situacao === "Reservado"
          ? "text-yellow-500 font-semibold"
          : "text-green-600 font-semibold";

  const produto = item.produto || {};
  const unidadeMedida = produto.unidademedida || "—";
  const produtoId = produto.id;
  const nome = produto.nome || "Sem nome";
  const preco = produto.preco || "R$ 0,00";
  const quantidade = produto.quantidade ?? 0;
  const ativo = produto.ativo;

  if (!produtoId) {
    console.error(" EstoqueItemRow: produto.id está undefined!", item);
  }

  return (
    <div
      className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors min-h-[56px]"
      id={`item-${produto.id || item.id}`}
    >
      <div className="py-3 w-[5%] pl-4 pr-1">
        <UniversalInput
          as="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label={`Selecionar ${nome}`}
        />
      </div>

      <div
        className="py-3 w-[20%] sm:w-[15%] pl-2 pr-1 truncate font-medium text-gray-800"
        title={nome}
      >
        {nome}
      </div>
      <div className="py-3 w-[12%] sm:w-[10%] text-center text-gray-700 font-medium">
        {preco}
      </div>

      <div className="hidden md:block py-3 w-[15%] px-4 text-gray-600 truncate">
        {unidadeMedida}
      </div>

      <div className="py-3 w-[20%] text-center font-semibold text-gray-800">
        {quantidade}
      </div>

      <div
        className={`py-3 w-[13%] sm:w-[10%] text-center ${ativo === true ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}`}
      >
        {ativo === true ? "Ativo" : "Inativo"}
      </div>

      <div className={`hidden sm:block py-3 w-[10%] text-center ${situacaoClasse}`}>
        {item.situacao}
      </div>

      <div className="py-3 w-[30%] sm:w-[15%] text-right pr-4 flex justify-end gap-2">
        <button
          onClick={onViewDetails}
          className="p-2 rounded-md hover:bg-blue-50 text-[#007EA7] transition-colors duration-150 cursor-pointer"
          title="Ver detalhes"
          aria-label={`Ver detalhes de ${nome}`}
        >
          <Eye className="w-5 h-5" />
        </button>

        <button
          onClick={onDelete}
          className="p-2 rounded-md hover:bg-red-50 text-red-600 transition-colors duration-150"
          title="Excluir item"
          aria-label={`Excluir ${nome}`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default memo(EstoqueItemRow, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.situacao === nextProps.item.situacao &&
    prevProps.item.produto.nome === nextProps.item.produto.nome &&
    prevProps.item.produto.descricao === nextProps.item.produto.descricao &&
    prevProps.item.produto.preco === nextProps.item.produto.preco &&
    prevProps.item.produto.quantidade === nextProps.item.produto.quantidade &&
    prevProps.isSelected === nextProps.isSelected
  );
});
