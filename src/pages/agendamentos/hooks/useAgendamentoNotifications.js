import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { normalizeStatus } from "../utils/eventHelpers";

/**
 * Hook para gerenciar notificações de agendamentos próximos
 * Verifica a cada minuto se há agendamentos começando em 5 minutos ou menos
 */
export const useAgendamentoNotifications = (agendamentos = []) => {
  const notifiedAgendamentosRef = useRef(new Set());
  const [notifications, setNotifications] = useState([]);

  const parseMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [hours = "0", minutes = "0"] = String(timeStr)
      .substring(0, 5)
      .split(":");
    return Number(hours) * 60 + Number(minutes);
  };

  const checkUpcomingAgendamentos = useCallback(() => {
    const now = new Date();
    const currentDate = format(now, "yyyy-MM-dd");
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    // Filtrar agendamentos de hoje
    const todayAgendamentos = agendamentos.filter((agendamento) => {
      const agendamentoDate = agendamento.dataAgendamento?.split("T")[0];
      return agendamentoDate === currentDate;
    });

    // Verificar cada agendamento
    for (const agendamento of todayAgendamentos) {
      const statusNome = normalizeStatus(agendamento.statusAgendamento);
      if (
        statusNome === "CANCELADO" ||
        statusNome === "CONCLUIDO"
      ) {
        continue;
      }

      const startTimeMinutes = parseMinutes(agendamento.inicioAgendamento);
      const endTimeMinutes = parseMinutes(agendamento.fimAgendamento);

      if (startTimeMinutes === null) {
        continue;
      }

      const minutesUntilStart = startTimeMinutes - currentTimeMinutes;
      const minutesSinceEnd = endTimeMinutes === null ? null : currentTimeMinutes - endTimeMinutes;

      const finalizeKey = `${agendamento.id}:finalizar`;
      const startKey = `${agendamento.id}:iniciar`;

      const shouldFinalize =
        statusNome === "EM ANDAMENTO" &&
        minutesSinceEnd !== null &&
        minutesSinceEnd >= 0 &&
        minutesSinceEnd <= 30;

      const shouldStart =
        statusNome === "PENDENTE" &&
        minutesUntilStart <= 2 &&
        minutesUntilStart >= -30;

      if (shouldFinalize && !notifiedAgendamentosRef.current.has(finalizeKey)) {
        setNotifications((prev) => {
          if (prev.some((item) => item.key === finalizeKey)) return prev;
          return [...prev, { key: finalizeKey, agendamento, tipo: "finalizar" }];
        });
        notifiedAgendamentosRef.current.add(finalizeKey);

        continue;
      }

      if (shouldStart && !notifiedAgendamentosRef.current.has(startKey)) {
        setNotifications((prev) => {
          if (prev.some((item) => item.key === startKey)) return prev;
          return [...prev, { key: startKey, agendamento, tipo: "iniciar" }];
        });
        notifiedAgendamentosRef.current.add(startKey);
        continue;
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
    };
  }, [checkUpcomingAgendamentos]);

  const dismissNotification = useCallback((key) => {
    if (!key) return;
    setNotifications((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const resetNotifications = useCallback(() => {
    notifiedAgendamentosRef.current = new Set();
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    resetNotifications,
  };
};
