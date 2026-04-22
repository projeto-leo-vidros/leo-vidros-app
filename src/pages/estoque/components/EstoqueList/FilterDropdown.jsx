import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

const FilterDropdown = ({
  isOpen,
  onClose,
  selectedFilters,
  onFilterChange,
}) => {
  const [tempFilters, setTempFilters] = useState(selectedFilters);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(selectedFilters);
    }
  }, [isOpen, selectedFilters]);

  const filterOptions = {
    situacao: {
      title: "Situação do Estoque",
      options: [
        "Disponível",
        "Abaixo do normal",
        "Fora de estoque",
        "Reservado",
      ],
    },
    tipo: {
      title: "Status do Produto",
      options: ["Ativo", "Inativo"],
    },
  };

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
    <div className="absolute z-10 top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl shadow-slate-400/60 border border-gray-200 p-4 flex flex-col gap-2">
      <div className="flex items-center text-sm font-bold text-gray-700 mb-4 border-b pb-3">
        <Filter className="w-4 h-4 mr-2" />
        Filtros
      </div>
      <br />
      {Object.keys(filterOptions).map((key) => (
        <div key={key} className="mb-4 last:mb-0 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            {filterOptions[key].title}
          </h3>
          <div className="space-y-2 flex flex-col gap-2">
            {filterOptions[key].options.map((option) => {
              const isSelected = (tempFilters[key] || []).includes(option);
              return (
                <label
                  key={option}
                  className={`flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-[#007EA7] bg-[#EAF7FC]"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleFilter(key, option)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#007EA7] focus:ring-2 focus:ring-[#007EA7] focus:ring-offset-0"
                  />
                  <span
                    className={`text-sm ${
                      isSelected
                        ? "font-medium text-[#007EA7]"
                        : "text-gray-700"
                    }`}
                  >
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleClear}
          className="text-sm font-medium text-gray-600 cursor-pointer hover:text-red-600 transition-colors"
        >
          Limpar Filtros
        </button>
        <button
          onClick={handleApply}
          className="bg-[#007EA7] text-white text-sm font-medium py-1.5 px-4 rounded-md cursor-pointer hover:bg-[#006891] transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

export default FilterDropdown;
