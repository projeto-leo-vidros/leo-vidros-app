import { useState, useEffect, useCallback } from "react";

/**
 * Hook para gerenciar notificações de agendamentos próximos
 * Verifica a cada minuto se há agendamentos começando em 5 minutos ou menos
 */
export const useAgendamentoNotifications = (agendamentos = []) => {
  const [notifiedAgendamentos, setNotifiedAgendamentos] = useState(new Set());
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
      if (notifiedAgendamentos.has(agendamento.id)) {
        continue;
      }

      // Pular se o status já é "EM ANDAMENTO" ou "CONCLUÍDO"
      const statusNome = agendamento.statusAgendamento?.nome?.toUpperCase();
      if (
        statusNome === "EM ANDAMENTO" ||
        statusNome === "CONCLUÍDO" ||
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
        setNotifiedAgendamentos((prev) => new Set([...prev, agendamento.id]));

        // Auto-fechar após 60 segundos
        setTimeout(() => {
          setCurrentNotification(null);
        }, 60000);

        break; // Mostrar apenas uma notificação por vez
      }
    }
  }, [agendamentos, notifiedAgendamentos]);

  useEffect(() => {
    // Verificar imediatamente ao montar
    checkUpcomingAgendamentos();

    // Verificar a cada 60 segundos
    const interval = setInterval(() => {
      checkUpcomingAgendamentos();
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [checkUpcomingAgendamentos]);

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const resetNotifications = useCallback(() => {
    setNotifiedAgendamentos(new Set());
    setCurrentNotification(null);
  }, []);

  return {
    currentNotification,
    dismissNotification,
    resetNotifications,
  };
};
