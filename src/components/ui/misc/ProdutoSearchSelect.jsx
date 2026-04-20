import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

/**
 * Select pesquisável de produtos.
 * Props:
 *  - produtos: [{ id, nome, preco }]
 *  - value: { id, nome } | null
 *  - onChange: ({ id, nome, preco }) => void
 *  - placeholder: string
 *  - className: string
 */
const ProdutoSearchSelect = ({
  produtos = [],
  value,
  onChange,
  placeholder = "Pesquisar produto...",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtrados = produtos.filter((p) =>
    p.nome?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (produto) => {
    onChange(produto);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearch("");
  };

  const handleOpen = () => {
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {open ? (
        <div className="flex items-center gap-2 border-2 border-[#007EA7] rounded-md px-3 py-2 bg-white">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between gap-2 border-2 border-[#005a7a] rounded-md px-3 py-2 bg-white text-sm hover:border-[#007EA7] transition-colors"
        >
          <span className={value?.nome ? "text-gray-800" : "text-gray-400"}>
            {value?.nome || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <X
                className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      )}

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">
              Nenhum produto encontrado
            </li>
          ) : (
            filtrados.map((p) => (
              <li
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-[#007EA7] transition-colors"
              >
                <span>{p.nome}</span>
                <span className="text-gray-400 text-xs ml-2 shrink-0">
                  R$ {Number(p.preco ?? 0).toFixed(2)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ProdutoSearchSelect;
