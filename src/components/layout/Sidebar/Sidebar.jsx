import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  Users,
  Lock,
  Briefcase,
  LogOut,
  ChevronLeft,
  ClipboardList,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../../assets/logo-sidebar.png";

const menuItems = [
  {
    text: "Painel de Controle",
    icon: <LayoutDashboard size={22} />,
    path: "/pagina-inicial",
  },
  { text: "Controle de Estoque", icon: <Package size={22} />, path: "/estoque" },
  { text: "Pedidos", icon: <ClipboardList size={22} />, path: "/pedidos" },
  { text: "Agendamentos", icon: <CalendarDays size={22} />, path: "/agendamentos" },
  { text: "Clientes", icon: <Users size={22} />, path: "/clientes" },
  { text: "Controle de Funcionários", icon: <Briefcase size={22} />, path: "/funcionarios" },
  { text: "Controle de Acesso", icon: <Lock size={22} />, path: "/acesso" },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay escurecido (funcional e cobrindo toda a tela) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-1399 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-full w-[270px] bg-white text-gray-700 shadow-2xl z-1400 flex flex-col border-r border-gray-200"
        style={{ willChange: "transform" }}
      >
        {/* Logo e botão fechar */}
        <div className="relative flex flex-col items-center px-4 pt-6 pb-8">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition cursor-pointer"
          >
            <ChevronLeft size={34} />
          </button>

          <img
            src={Logo}
            alt="Logo"
            className="w-[55%] h-auto object-contain my-5 drop-shadow-sm"
          />
        </div>

        {/* Menu principal */}
        <nav className="grow overflow-y-auto w-full">
          <ul className="flex flex-col gap-2 px-6">
            {menuItems.map((item, i) => {
              const isActive = location.pathname === item.path;

              return (
                <li key={i}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-3 rounded-lg transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#003d6b] text-white shadow-sm"
                        : "hover:bg-[#003d6b]/10 hover:text-[#003d6b] text-gray-700"
                    }`}
                  >
                    <span
                      className={`${isActive ? "text-white" : "text-gray-600"}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-base font-medium">{item.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Botão Sair */}
        <div className="mt-auto px-6 pb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 w-full text-gray-700 hover:bg-[#003d6b]/10 hover:text-[#003d6b] px-3 py-3 rounded-lg font-semibold text-lg transition-all duration-150 cursor-pointer"
          >
            <LogOut size={26} />
            <span>Sair</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
