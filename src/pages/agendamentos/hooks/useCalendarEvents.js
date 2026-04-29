import { useState, useEffect, useMemo } from "react";
import { getEventDate } from "../utils/eventHelpers";
import Api from "../../../api/client/Api";

export const useEventDetails = (initialEvent) => {
  const [details, setDetails] = useState(initialEvent || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialEvent?.id) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await Api.get(`/agendamentos/${initialEvent.id}`);
        const apiData = response.data;

        // Mesclar dados da API com dados processados do initialEvent
        const mergedDetails = {
          ...apiData,
          title: initialEvent.fullTitle || initialEvent.title,
          startTime: initialEvent.startTime,
          endTime: initialEvent.endTime,
          date: initialEvent.date,
          backgroundColor: initialEvent.backgroundColor,
        };

        setDetails(mergedDetails);
      } catch (err) {
        console.error("❌ Erro ao buscar detalhes:", err);
        setError(err.message);
        // Fallback: mantém os dados iniciais se a API falhar
        setDetails(initialEvent);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [initialEvent]);

  return { details, loading, error };
};

export const useDeleteAgendamento = (onSuccess) => {
  const [deleting, setDeleting] = useState(false);

  const deleteAgendamento = async (id) => {
    if (!id) {
      console.error(
        "❌ Erro: ID inválido ou undefined fornecido para exclusão.",
      );
      alert("Erro interno: ID do agendamento não encontrado.");
      return false;
    }

    setDeleting(true);
    try {
      await Api.delete(`/agendamentos/${id}`);

      if (onSuccess) {
        onSuccess(id);
      }
      return true;
    } catch (err) {
      console.error("❌ Erro fatal ao excluir:", err);
      console.error("Detalhes do erro:", err.response?.data);

      // Feedback visual para o usuário
      const msgErro =
        err.response?.data?.message || "Erro desconhecido ao excluir.";
      alert(`Falha ao excluir agendamento: ${msgErro}`);

      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteAgendamento, deleting };
};

export const useEventsByDate = (events) => {
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events?.forEach((evt) => {
      const dateKey = getEventDate(evt);
      if (!dateKey) return;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(evt);
    });
    return grouped;
  }, [events]);

  return { eventsByDate };
};
