import './App.css';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appRouter } from './router/AppRouter.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { queryClient } from './lib/queryClient.js';
import { OrcamentoProgressProvider, useOrcamentoProgress } from './context/OrcamentoProgressContext.jsx';
import { OrcamentoProgressToast } from './components/feedback/OrcamentoProgressToast/index.js';

function AppWithToast() {
  const { orcamentoId, numeroOrcamento, showToast, closeToast } = useOrcamentoProgress();

  return (
    <>
      <RouterProvider router={appRouter} />
      {showToast && orcamentoId && (
        <OrcamentoProgressToast
          orcamentoId={orcamentoId}
          numeroOrcamento={numeroOrcamento}
          onClose={closeToast}
        />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <OrcamentoProgressProvider>
          <AppWithToast />
        </OrcamentoProgressProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;