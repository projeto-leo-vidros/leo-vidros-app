import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../context/ProtectedRoute.jsx";

const Login = lazy(() => import("../pages/login/login.jsx"));
const Cadastro = lazy(() => import("../pages/cadastro/cadastro.jsx"));
const PaginaInicial = lazy(() => import("../pages/pagina-inicial/PaginaInicial.jsx"));
const Funcionarios = lazy(() => import("../pages/funcionarios/funcionarios.jsx"));
const Clientes = lazy(() => import("../pages/clientes/clientes.jsx"));
const Estoque = lazy(() => import("../pages/estoque/estoque.jsx"));
const ProdutoDetalhe = lazy(() => import("../pages/estoque/ProdutoDetalhe.jsx"));
const Pedidos = lazy(() => import("../pages/pedidos/pedidos.jsx"));
const ServicoDetalhe = lazy(() => import("../pages/pedidos/servicos/ServicoDetalhe.jsx"));
const Solicitacoes = lazy(() => import("../pages/solicitacoes/Solicitacoes.jsx"));
const Agendamentos = lazy(() => import("../pages/agendamentos/agendamentos.jsx"));
const Perfil = lazy(() => import("../pages/perfil/perfil.jsx"));
const MapContainer = lazy(() => import("../pages/geo-localizacao/MapContainer.jsx"));
const NovaSenha = lazy(() => import("../pages/nova-senha/NovaSenha.jsx"));
const EsqueceuSenha = lazy(() => import("../pages/esqueceu-senha/EsqueceuSenha.jsx"));
const OrcamentoERP = lazy(() => import("../pages/orcamento/Orcamento.jsx"));
const OrcamentosServico = lazy(() => import("../pages/orcamento/OrcamentosServico.jsx"));

// Loader simples para o Suspense
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#134074ff] border-t-transparent"></div>
  </div>
);

const withSuspense = (Node) => (
  <Suspense fallback={<LoadingFallback />}>
    {Node}
  </Suspense>
);

export const appRouter = createBrowserRouter([
  { path: "/", element: withSuspense(<Login />) },
  { path: "/login", element: withSuspense(<Login />) },
  { path: "/cadastro", element: withSuspense(<Cadastro />) },
  {
    path: "/pagina-inicial",
    element: withSuspense(
      <ProtectedRoute>
        <PaginaInicial />
      </ProtectedRoute>
    ),
  },
  {
    path: "/funcionarios",
    element: withSuspense(
      <ProtectedRoute>
        <Funcionarios />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clientes",
    element: withSuspense(
      <ProtectedRoute>
        <Clientes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/estoque",
    element: withSuspense(
      <ProtectedRoute>
        <Estoque />
      </ProtectedRoute>
    ),
  },
  {
    path: "/estoque/:id",
    element: withSuspense(
      <ProtectedRoute>
        <ProdutoDetalhe />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pedidos",
    element: withSuspense(
      <ProtectedRoute>
        <Pedidos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pedidos/:pedidoId/orcamento",
    element: withSuspense(
      <ProtectedRoute>
        <OrcamentoERP />
      </ProtectedRoute>
    ),
  },
  {
    path: "/orcamentos/:orcamentoId/editar",
    element: withSuspense(
      <ProtectedRoute>
        <OrcamentoERP />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Servicos/:id",
    element: withSuspense(
      <ProtectedRoute>
        <ServicoDetalhe />
      </ProtectedRoute>
    ),
  },
  {
    path: "/Servicos/:id/orcamentos",
    element: withSuspense(
      <ProtectedRoute>
        <OrcamentosServico />
      </ProtectedRoute>
    ),
  },
  {
    path: "/acesso",
    element: withSuspense(
      <ProtectedRoute>
        <Solicitacoes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agendamentos",
    element: withSuspense(
      <ProtectedRoute>
        <Agendamentos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/primeiroAcesso/:idUsuario",
    element: withSuspense(
      <ProtectedRoute>
        <NovaSenha />
      </ProtectedRoute>
    ),
  },
  {
    path: "/perfil",
    element: withSuspense(
      <ProtectedRoute>
        <Perfil />
      </ProtectedRoute>
    ),
  },
  {
    path: "/geo-localizacao",
    element: withSuspense(
      <ProtectedRoute>
        <MapContainer />
      </ProtectedRoute>
    ),
  },
  { path: "/esqueceu-senha", element: withSuspense(<EsqueceuSenha />) },
]);