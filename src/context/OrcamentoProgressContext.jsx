/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const OrcamentoProgressContext = createContext();

export function OrcamentoProgressProvider({ children }) {
  const [showToast, setShowToast] = useState(false);
  const [orcamentoId, setOrcamentoId] = useState(null);
  const [numeroOrcamento, setNumeroOrcamento] = useState(null);

  const startProgress = useCallback((id, numero) => {
    setOrcamentoId(id);
    setNumeroOrcamento(numero);
    setShowToast(true);
  }, []);

  const closeToast = useCallback(() => {
    setShowToast(false);
    setOrcamentoId(null);
    setNumeroOrcamento(null);
  }, []);

  return (
    <OrcamentoProgressContext.Provider
      value={{
        showToast,
        orcamentoId,
        numeroOrcamento,
        startProgress,
        closeToast,
      }}
    >
      {children}
    </OrcamentoProgressContext.Provider>
  );
}

export function useOrcamentoProgress() {
  const context = useContext(OrcamentoProgressContext);
  if (!context) {
    throw new Error('useOrcamentoProgress deve ser usado dentro de OrcamentoProgressProvider');
  }
  return context;
}
