import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../context/ProtectedRoute.jsx";
import Login from "../pages/login/login.jsx";
import Cadastro from "../pages/cadastro/cadastro.jsx";
import PaginaInicial from "../pages/pagina-inicial/PaginaInicial.jsx";
import Funcionarios from "../pages/funcionarios/funcionarios.jsx";
import Clientes from "../pages/clientes/clientes.jsx";
import Estoque from "../pages/estoque/estoque.jsx";
import ProdutoDetalhe from "../pages/estoque/ProdutoDetalhe.jsx";
import Pedidos from "../pages/pedidos/pedidos.jsx";
import Solicitacoes from "../pages/solicitacoes/Solicitacoes.jsx";
import Agendamentos from "../pages/agendamentos/agendamentos.jsx";
import CalendarDashboard from "../pages/calendar-dashboard/index.jsx";
import Perfil from "../pages/perfil/perfil.jsx";
import MapContainer from "../pages/geo-localizacao/MapContainer.jsx";
import NovaSenha from "../pages/nova-senha/NovaSenha.jsx";
import EsqueceuSenha from "../pages/esqueceu-senha/EsqueceuSenha.jsx";
import OrcamentoERP from "../pages/orcamento/Orcamento.jsx";

export const appRouter = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/Login", element: <Login /> },
  { path: "/Cadastro", element: <Cadastro /> },
  {
    path: "/pagina-inicial",
    element: (
      <ProtectedRoute>
        <PaginaInicial />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Funcionarios",
    element: (
      <ProtectedRoute>
        <Funcionarios />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Clientes",
    element: (
      <ProtectedRoute>
        <Clientes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Estoque",
    element: (
      <ProtectedRoute>
        <Estoque />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Estoque/:id",
    element: (
      <ProtectedRoute>
        <ProdutoDetalhe />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Pedidos",
    element: (
      <ProtectedRoute>
        <Pedidos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Pedidos/:pedidoId/orcamento",
    element: (
      <ProtectedRoute>
        <OrcamentoERP />
      </ProtectedRoute>
    ),
  },
  {
    path: "/orcamentos/:orcamentoId/editar",
    element: (
      <ProtectedRoute>
        <OrcamentoERP />
      </ProtectedRoute>
    ),
  },
  {
    path: "/acesso",
    element: (
      <ProtectedRoute>
        <Solicitacoes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Agendamentos",
    element: (
      <ProtectedRoute>
        <Agendamentos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Agenda",
    element: (
      <ProtectedRoute>
        <CalendarDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/primeiroAcesso/:idUsuario",
    element: (
      <ProtectedRoute>
        <NovaSenha />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Perfil",
    element: (
      <ProtectedRoute>
        <Perfil />
      </ProtectedRoute>
    ),
  },
  {
    path: "/geo-localizacao",
    element: (
      <ProtectedRoute>
        <MapContainer />
      </ProtectedRoute>
    ),
  },
  { path: "/esqueceu-senha", element: <EsqueceuSenha /> },
]);