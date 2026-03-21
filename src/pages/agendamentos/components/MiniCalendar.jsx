import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import Icon from "../../../components/ui/misc/AppIcon";
import Button from "../../../components/ui/Button/Button.component";

const MiniCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth((prevMonth) => {
        if (!isSameMonth(selectedDate, prevMonth)) {
          return selectedDate;
        }
        return prevMonth;
      });
    }
  }, [selectedDate]);

  const fixedHolidays = [
    "01/01",
    "21/04",
    "01/05",
    "07/09",
    "12/10",
    "02/11",
    "15/11",
    "25/12",
  ];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;

      const isCurrentMonth = isSameMonth(day, monthStart);
      const isSelected = isSameDay(day, selectedDate);
      const isDateToday = isToday(day);
      const isHoliday = fixedHolidays.includes(format(day, "dd/MM"));

      // Removi o 'hover-scale' daqui
      let dayClasses =
        "aspect-square p-1 cursor-pointer transition-micro text-xs flex items-center justify-center ";

      if (!isCurrentMonth) {
        // Dia de outro mês: Adicionei o hover azul claro também
        dayClasses += "text-text-secondary/50 rounded-modern hover:bg-blue-100";
      } else if (isDateToday) {
        // HOJE: Azul forte (bg-blue-500)
        dayClasses +=
          "bg-[#134074ff] text-white font-bold rounded-full hover:bg-blue-600";
      } else if (isSelected) {
        // Selecionado
        dayClasses +=
          "bg-[#134074ff] text-white rounded-modern hover:bg-primary/90";
      } else if (isHoliday) {
        // Feriado: Hover azul claro
        dayClasses +=
          "bg-warning/10 text-warning font-medium rounded-modern hover:bg-blue-100";
      } else {
        // Dia comum: Hover azul claro (bg-blue-100)
        dayClasses += "text-text-primary rounded-modern hover:bg-blue-100";
      }

      days?.push(
        <div
          className={dayClasses}
          key={day}
          onClick={() => onDateSelect?.(cloneDay)}
        >
          <span>{formattedDate}</span>
        </div>,
      );
      day = addDays(day, 1);
    }
    rows?.push(
      <div className="grid grid-cols-7 gap-1" key={day}>
        {days}
      </div>,
    );
    days = [];
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-card border border-hairline rounded-modern p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          className="cursor-pointer hover:bg-blue-100"
        >
          <Icon name="ChevronLeft" size={16} />
        </Button>

        <span className="font-medium text-text-primary text-sm capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="cursor-pointer hover:bg-blue-100"
        >
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]?.map((day) => (
          <div
            key={day}
            className="aspect-square p-1 text-xs font-medium text-text-secondary text-center flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">{rows}</div>
    </div>
  );
};

export default MiniCalendar;
