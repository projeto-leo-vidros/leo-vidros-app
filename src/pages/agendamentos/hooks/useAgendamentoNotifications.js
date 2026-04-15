import { useState, useEffect, useCallback, useRef } from "react";
import { normalizeStatus } from "../utils/eventHelpers";

/**
 * Hook para gerenciar notificações de agendamentos próximos
 * Verifica a cada minuto se há agendamentos começando em 5 minutos ou menos
 */
export const useAgendamentoNotifications = (agendamentos = []) => {
  const notifiedAgendamentosRef = useRef(new Set());
  const timeoutRef = useRef(null);
  const [currentNotification, setCurrentNotification] = useState(null);

  const checkUpcomingAgendamentos = useCallback(() => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    // Filtrar agendamentos de hoje
    const todayAgendamentos = agendamentos.filter((agendamento) => {
      const agendamentoDate = agendamento.dataAgendamento?.split("T")[0];
      return agendamentoDate === currentDate;
    });

    // Verificar cada agendamento
    for (const agendamento of todayAgendamentos) {
      // Pular se já foi notificado
      if (notifiedAgendamentosRef.current.has(agendamento.id)) {
        continue;
      }

      // Pular se o status já é "EM ANDAMENTO" ou "CONCLUÍDO"
      const statusNome = normalizeStatus(agendamento.statusAgendamento);
      if (
        statusNome === "EM ANDAMENTO" ||
        statusNome === "CONCLUIDO" ||
        statusNome === "CANCELADO"
      ) {
        continue;
      }

      // Calcular minutos até o início
      const [startHours, startMinutes] = agendamento.inicioAgendamento
        ?.substring(0, 5)
        .split(":")
        .map(Number) || [0, 0];

      const agendamentoTimeMinutes = startHours * 60 + startMinutes;
      const minutesUntilStart = agendamentoTimeMinutes - currentTimeMinutes;

      // Notificar se falta 5 minutos ou menos, ou se já começou (mas não passou mais de 30 minutos)
      if (minutesUntilStart <= 5 && minutesUntilStart >= -30) {
        setCurrentNotification(agendamento);
        notifiedAgendamentosRef.current.add(agendamento.id);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Auto-fechar após 15 segundos
        timeoutRef.current = setTimeout(() => {
          setCurrentNotification(null);
        }, 15000);

        break; // Mostrar apenas uma notificação por vez
      }
    }
  }, [agendamentos]);

  useEffect(() => {
    // Verificar imediatamente ao montar
    checkUpcomingAgendamentos();

    // Verificar a cada 60 segundos
    const interval = setInterval(() => {
      checkUpcomingAgendamentos();
    }, 60000); // 60 segundos

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkUpcomingAgendamentos]);

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const resetNotifications = useCallback(() => {
    notifiedAgendamentosRef.current = new Set();
    setCurrentNotification(null);
  }, []);

  return {
    currentNotification,
    dismissNotification,
    resetNotifications,
  };
};
