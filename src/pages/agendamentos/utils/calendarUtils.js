export const calculateEventStyle = (
  startTime,
  endTime,
  startHour = 7,
  pixelsPerHour = 70,
) => {
  if (!startTime || !endTime) return { top: "0px", height: "auto" };
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = (startH - startHour) * 60 + startM;
  const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
  const pixelsPerMinute = pixelsPerHour / 60;

  return {
    top: `${Math.max(0, startMinutes * pixelsPerMinute)}px`,
    height: `${Math.max(20, durationMinutes * pixelsPerMinute)}px`,
  };
};

export const calculateEventLayout = (events) => {
  if (!events || events.length === 0) return [];
  const validEvents = events.filter(
    (event) =>
      event.startTime &&
      event.endTime &&
      typeof event.startTime === "string" &&
      typeof event.endTime === "string" &&
      event.startTime.includes(":") &&
      event.endTime.includes(":"),
  );
  if (validEvents.length === 0) return [];
  const sortedEvents = [...validEvents].sort((a, b) => {
    const [aH, aM] = a.startTime.split(":").map(Number);
    const [bH, bM] = b.startTime.split(":").map(Number);
    return aH * 60 + aM - (bH * 60 + bM);
  });
  const eventsWithLayout = [];
  const columns = [];
  sortedEvents.forEach((event) => {
    const [startH, startM] = event.startTime.split(":").map(Number);
    const [endH, endM] = event.endTime.split(":").map(Number);
    const eventStart = startH * 60 + startM;
    const eventEnd = endH * 60 + endM;
    let columnIndex = 0;
    while (columnIndex < columns.length) {
      const lastEventInColumn = columns[columnIndex];
      if (!lastEventInColumn || !lastEventInColumn.endTime) {
        break;
      }
      const [lastEndH, lastEndM] = lastEventInColumn.endTime
        .split(":")
        .map(Number);
      const lastEnd = lastEndH * 60 + lastEndM;
      if (eventStart >= lastEnd) break;
      columnIndex++;
    }
    if (columnIndex === columns.length) columns.push(event);
    else columns[columnIndex] = event;
    const overlappingColumns = columns.filter((col) => {
      if (!col || !col.startTime || !col.endTime) return false;
      const [colStartH, colStartM] = col.startTime.split(":").map(Number);
      const [colEndH, colEndM] = col.endTime.split(":").map(Number);
      const colStart = colStartH * 60 + colStartM;
      const colEnd = colEndH * 60 + colEndM;
      return !(eventEnd <= colStart || eventStart >= colEnd);
    }).length;
    eventsWithLayout.push({
      ...event,
      column: columnIndex,
      totalColumns: Math.max(overlappingColumns, columnIndex + 1),
    });
  });
  return eventsWithLayout;
};
