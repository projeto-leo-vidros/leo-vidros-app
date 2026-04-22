import './App.css';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appRouter } from './router/AppRouter.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';
import { queryClient } from './lib/queryClient.js';
import { OrcamentoProgressProvider, useOrcamentoProgress } from './context/OrcamentoProgressContext.jsx';
import { OrcamentoProgressToast } from './components/feedback/OrcamentoProgressToast/index.js';
import AgendamentoNotificationLayer from './components/feedback/AgendamentoNotificationLayer/AgendamentoNotificationLayer.jsx';

function AppWithToast() {
  const { orcamentoId, numeroOrcamento, showToast, closeToast } = useOrcamentoProgress();
  const { user } = useUser();

  return (
    <>
      <RouterProvider router={appRouter} />
      {user.isAuthenticated && <AgendamentoNotificationLayer />}
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