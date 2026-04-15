import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import PedidosList from "./PedidosList";
import ServicosList from "../servicos/ServicosList";
import FilterDropdown from "./components/FilterDropdown";
import { PackageOpen, Wrench, Filter, Search, ChevronDown, Plus } from "lucide-react";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";

export default function Pedidos() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const location = useLocation();
  const initialTab = location.state?.initialTab || (location.pathname.includes("/servicos")
    ? "servicos"
    : "pedidos");
  const [activeTab, setActiveTab] = useState(initialTab);

  const [busca, setBusca] = useState("");
  const [triggerNovo, setTriggerNovo] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [filters, setFilters] = useState({
    situacao: [],
    pagamento: [],
    etapa: [],
  });

  const handleNovoRegistroClick = () => setTriggerNovo(true);
  const handleNovoRegistroHandled = () => setTriggerNovo(false);

  const hasActiveFilters = Object.values(filters).some(
    (arr) => arr && arr.length > 0,
  );

  const getStatusFilter = () => {
    if (
      !filters.situacao ||
      filters.situacao.length === 0 ||
      filters.situacao.includes("Todos")
    ) {
      return "Todos";
    }
    return filters.situacao;
  };

  const getPaymentFilter = () => {
    if (
      !filters.pagamento ||
      filters.pagamento.length === 0 ||
      filters.pagamento.includes("Todos")
    ) {
      return "Todos";
    }
    return filters.pagamento;
  };

  const getEtapaFilter = () => {
    if (
      !filters.etapa ||
      filters.etapa.length === 0 ||
      filters.etapa.includes("Todos")
    ) {
      return "Todos";
    }
    return filters.etapa;
  };

  const tabBaseClass =
    "px-6 md:px-9 py-3 md:py-4 rounded-t-lg font-semibold text-base md:text-lg transition-all duration-300 flex items-center gap-2 md:gap-3 border-t border-l border-r cursor-pointer select-none translate-y-[1px] shadow-[0_-2px_4px_-2px_rgba(0,0,0,0.1),2px_0_4px_-2px_rgba(0,0,0,0.1),-2px_0_8px_-2px_rgba(0,0,0,0.1)]";
  const activeTabClass = "bg-white text-[#007EA7] border-slate-200";
  const inactiveTabClass =
    "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200";

  return (
    <div
      className="flex flex-col items-center min-h-screen"
      style={{ backgroundColor: "#f7f9fa" }}
    >
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col w-full items-center">
        <div className="w-full">
          <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        </div>

        <div className="pt-20 lg:pt-20" />

        <div className="w-full flex flex-col items-center px-4">
          <div className="text-center mb-8 w-full max-w-[1380px] py-7">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
              Pedidos
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Acompanhe todos seus pedidos de produtos e serviços em um só
              lugar.
            </p>
          </div>

          <main className="w-full flex justify-center pb-8">
            <section className="w-full max-w-[1380px]">
              {/* Abas de Navegação */}
              <div className="flex items-end gap-2 w-full">
                <button
                  onClick={() => setActiveTab("pedidos")}
                  className={`${tabBaseClass} ${activeTab === "pedidos" ? activeTabClass : inactiveTabClass} text-black`}
                >
                  <PackageOpen
                    className={
                      activeTab === "pedidos"
                        ? "text-[#002A4B]"
                        : "text-slate-400"
                    }
                    size={18}
                  />
                  Produtos
                </button>

                <button
                  onClick={() => setActiveTab("servicos")}
                  className={`${tabBaseClass} ${activeTab === "servicos" ? activeTabClass : inactiveTabClass} text-black`}
                >
                  <Wrench
                    className={
                      activeTab === "servicos"
                        ? "text-[#002A4B]"
                        : "text-slate-400"
                    }
                    size={18}
                  />
                  Serviços
                </button>
              </div>

              {/* Estrutura da página - REMOVIDO min-h-[500px] DAQUI */}
              <div className="w-full bg-white border border-slate-200 rounded-b-lg rounded-tr-lg shadow-sm relative z-0 p-6">
                {/* Barra de Ferramentas */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <Button
                    variant="primary"
                    className="w-full md:w-auto"
                    onClick={handleNovoRegistroClick}
                    startIcon={<Plus className="w-6 h-6" />}
                  >
                    Novo Registro
                  </Button>

                  <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-[350px]">
                      <UniversalInput
                        variant="search"
                        placeholder="Busque por..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        startIcon={<Search className="w-3.5 h-3.5" />}
                      />
                    </div>

                    <div className="relative w-full md:w-auto py-1">
                      <button
                        onClick={() =>
                          setIsFilterDropdownOpen(!isFilterDropdownOpen)
                        }
                        className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 h-10 rounded-md border text-sm font-semibold cursor-pointer transition-colors shadow-sm ${
                          hasActiveFilters
                            ? "border-[#007EA7] text-[#007EA7] bg-[#e6f0f5]"
                            : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                        }`}
                        title="Filtrar"
                      >
                        <Filter
                          className={`w-3 h-3 ${hasActiveFilters ? "text-[#007EA7]" : "text-slate-800"}`}
                        />
                        Filtrar
                        <ChevronDown
                          className={`text-slate-400 w-4 h-4 ml-1 transition-transform ${isFilterDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <FilterDropdown
                        isOpen={isFilterDropdownOpen}
                        onClose={() => setIsFilterDropdownOpen(false)}
                        selectedFilters={filters}
                        onFilterChange={setFilters}
                        mode={activeTab}
                      />
                    </div>
                  </div>
                </div>

                {/* Conteúdo das Listas com AnimatePresence */}
                <div className="overflow-x-auto overflow-y-hidden">
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {activeTab === "pedidos" && (
                          <PedidosList
                            busca={busca}
                            triggerNovoRegistro={
                              triggerNovo && activeTab === "pedidos"
                            }
                            onNovoRegistroHandled={handleNovoRegistroHandled}
                            statusFilter={getStatusFilter()}
                            paymentFilter={getPaymentFilter()}
                          />
                        )}
                        {activeTab === "servicos" && (
                          <ServicosList
                            busca={busca}
                            triggerNovoRegistro={
                              triggerNovo && activeTab === "servicos"
                            }
                            onNovoRegistroHandled={handleNovoRegistroHandled}
                            statusFilter={getStatusFilter()}
                            etapaFilter={getEtapaFilter()}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
