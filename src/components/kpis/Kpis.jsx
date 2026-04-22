export default function Kpis({ stats = [], gridClassName }) {
  const resolvedGridClassName =
    gridClassName || "grid w-full grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={resolvedGridClassName}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const cardClassName = [
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-5 text-center transition-all duration-200",
          stat.onClick
            ? "cursor-pointer shadow-sm hover:border-blue-300 hover:shadow-md"
            : "shadow-sm hover:shadow-md",
          stat.cardClassName,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={index}
             onClick={stat.onClick}
            role={stat.onClick ? "button" : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
            onKeyDown={
              stat.onClick
                ? (event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " " ||
                      event.key === "Spacebar"
                    ) {
                      event.preventDefault();
                      stat.onClick(event);
                    }
                  }
                : undefined
            }
            className={cardClassName}
          >
            {/* Título e ícone */}
            <div className={`mb-4 flex w-full items-center justify-center gap-2 text-center ${stat.headerClassName || ""}`}>
              {Icon && <Icon className={`h-5 w-5 ${stat.iconClassName || "text-[#003d6b]"}`} />}
              <p className={`text-sm leading-tight font-semibold break-words ${stat.titleClassName || "text-gray-800"}`}>
                {stat.title}
              </p>
            </div>

            {/* Valor e legenda */}
            <div className="mt-2 flex flex-col items-center justify-center gap-4">
              <h2 className={`text-3xl font-bold tracking-tight ${stat.valueClassName || "text-gray-900"}`}>
                {stat.value}
              </h2>
              {stat.caption && (
                <p className={`text-sm ${stat.captionClassName || "text-gray-500"}`}>
                  {stat.caption}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
