import { useState, useEffect } from "react";
import { Filter, Check } from "lucide-react";

const FilterDropdown = ({
  isOpen,
  onClose,
  selectedFilters,
  onFilterChange,
  mode = "pedidos",
}) => {
  const [tempFilters, setTempFilters] = useState(selectedFilters);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(selectedFilters);
    }
  }, [isOpen, selectedFilters]);

  const filterOptionsPedidos = {
    pagamento: {
      title: "Forma de Pagamento",
      options: ["Pix", "Cartão de crédito", "Dinheiro", "Boleto"],
    },
  };

  const filterOptionsServicos = {
    situacao: {
      title: "Situação do Serviço",
      options: ["Ativo", "Em Andamento", "Aguardando", "Finalizado", "Cancelado"],
    },
    etapa: {
      title: "Etapa do Serviço",
      options: [
        "Pendente",
        "Aguardando Orçamento",
        "Análise do Orçamento",
        "Orçamento Aprovado",
        "Serviço Agendado",
        "Serviço em Execução",
        "Concluído",
      ],
    },
  };

  const filterOptions =
    mode === "pedidos" ? filterOptionsPedidos : filterOptionsServicos;

  const handleToggleFilter = (filterKey, option) => {
    setTempFilters((prev) => {
      const currentSelection = prev[filterKey] || [];

      const newSelection = currentSelection.includes(option)
        ? currentSelection.filter((item) => item !== option)
        : [...currentSelection, option];

      return {
        ...prev,
        [filterKey]: newSelection,
      };
    });
  };

  const handleClear = () => {
    setTempFilters({});
  };

  const handleApply = () => {
    onFilterChange(tempFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute z-10 top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl/20 border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 border-b pb-3">
        <Filter className="w-4 h-4 mr-2" />
        Filtros
      </div>

      {Object.keys(filterOptions).map((key) => (
        <div key={key} className="mb-4 last:mb-0 py-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            {filterOptions[key].title}
          </h3>
          <div className="space-y-1">
            {filterOptions[key].options.map((option) => {
              const isSelected = (tempFilters[key] || []).includes(option);
              return (
                <div
                  key={option}
                  className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleToggleFilter(key, option)}
                >
                  <span
                    className={`text-sm ${
                      isSelected
                        ? "font-medium text-[#003d6b]"
                        : "text-gray-700"
                    }`}
                  >
                    {option}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#003d6b]" />}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleClear}
          className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
        >
          Limpar Filtros
        </button>
        <button
          onClick={handleApply}
          className="bg-[#007EA7] text-white text-sm font-medium py-1.5 px-4 rounded-md hover:bg-[#006891] transition-colors cursor-pointer"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

export default FilterDropdown;
