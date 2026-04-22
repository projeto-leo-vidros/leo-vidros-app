import { X, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useFaturamentoAnual } from "../../hooks/queries/useDashboard";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MES_ATUAL = new Date().getMonth() + 1;

function formatReais(valor) {
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-base font-bold text-[#003d6b]">
        R$ {Number(payload[0].value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function FaturamentoAnualModal({ onClose }) {
  const { data, isLoading } = useFaturamentoAnual();

  const chartData = (data?.meses ?? []).map((item) => ({
    nome: MESES_ABREV[item.mes - 1],
    valor: Number(item.valor),
    mes: item.mes,
  }));

  const totalAnual = chartData.reduce((acc, m) => acc + m.valor, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-2xl bg-[#002A4B] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5" />
            <div>
              <h2 className="text-base font-semibold">Faturamento Bruto Mensal</h2>
              <p className="text-xs text-blue-200">Ano {data?.ano ?? new Date().getFullYear()} — todos os setores</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="animate-pulse text-gray-400">Carregando gráfico...</span>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">Total acumulado no ano</p>
                <p className="text-2xl font-bold text-[#002A4B]">
                  R$ {totalAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatReais}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f6ff" }} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.mes}
                        fill={entry.mes === MES_ATUAL ? "#003d6b" : "#93c5fd"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p className="mt-3 text-center text-xs text-gray-400">
                Barra mais escura = mês atual
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
