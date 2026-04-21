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

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="relative flex flex-col items-center px-4 pt-5 pb-6 md:pt-6 md:pb-8">
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition cursor-pointer"
        >
          <ChevronLeft size={30} />
        </button>

        <img
          src={Logo}
          alt="Logo"
          className="w-[48%] h-auto object-contain my-4 drop-shadow-sm md:w-[55%] md:my-5"
        />
      </div>

      <nav className="grow overflow-y-auto w-full">
        <ul className="flex flex-col gap-1.5 px-4 md:gap-2 md:px-6">
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={i}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-3.5 md:py-3 rounded-lg transition-all duration-150 cursor-pointer ${
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
                  <span className="text-[1.02rem] md:text-base font-medium leading-tight">{item.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-6 md:pb-8">
        <button
          onClick={() => handleNavigate("/")}
          className="flex items-center gap-3 w-full text-gray-700 hover:bg-[#003d6b]/10 hover:text-[#003d6b] px-3 py-3 rounded-lg font-semibold text-lg transition-all duration-150 cursor-pointer"
        >
          <LogOut size={26} />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
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

      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-full w-[82vw] max-w-[320px] md:w-[270px] md:max-w-[270px] bg-white text-gray-700 shadow-2xl z-1400 flex flex-col border-r border-gray-200 rounded-r-2xl md:rounded-none"
        style={{ willChange: "transform" }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
