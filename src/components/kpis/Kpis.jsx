export default function Kpis({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 w-full">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            onClick={stat.onClick}
            className={`bg-white border border-gray-200 rounded-lg flex flex-col gap-2 items-center justify-center px-6 py-5 transition-all duration-200 text-center ${stat.onClick ? "cursor-pointer hover:shadow-md hover:border-blue-300 shadow-sm" : "shadow-sm hover:shadow-md"}`}
          >
            {/* Título e ícone */}
            <div className="flex items-center justify-center gap-2 mb-4 text-center w-full">
              {Icon && <Icon className="w-5 h-5 text-[#003d6b]" />}
              <p className="text-sm font-semibold text-gray-800 leading-tight break-words">
                {stat.title}
              </p>
            </div>

            {/* Valor e legenda */}
            <div className="flex flex-col items-center justify-center gap-4 mt-2">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {stat.value}
              </h2>
              {stat.caption && (
                <p className="text-sm text-gray-500">{stat.caption}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
