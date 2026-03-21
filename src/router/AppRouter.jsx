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
import Perfil from "../pages/perfil/perfil.jsx";
import MapContainer from "../pages/geo-localizacao/MapContainer.jsx";
import NovaSenha from "../pages/nova-senha/NovaSenha.jsx";
import EsqueceuSenha from "../pages/esqueceu-senha/EsqueceuSenha.jsx";
import OrcamentoERP from "../pages/orcamento/Orcamento.jsx";

export const appRouter = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/cadastro", element: <Cadastro /> },
  {
    path: "/pagina-inicial",
    element: (
      <ProtectedRoute>
        <PaginaInicial />
      </ProtectedRoute>
    ),
  },
  {
    path: "/funcionarios",
    element: (
      <ProtectedRoute>
        <Funcionarios />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clientes",
    element: (
      <ProtectedRoute>
        <Clientes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/estoque",
    element: (
      <ProtectedRoute>
        <Estoque />
      </ProtectedRoute>
    ),
  },
  {
    path: "/estoque/:id",
    element: (
      <ProtectedRoute>
        <ProdutoDetalhe />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pedidos",
    element: (
      <ProtectedRoute>
        <Pedidos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pedidos/:pedidoId/orcamento",
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
    path: "/agendamentos",
    element: (
      <ProtectedRoute>
        <Agendamentos />
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
    path: "/perfil",
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