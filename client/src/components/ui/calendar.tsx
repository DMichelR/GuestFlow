"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function AdvancedCalendarHeader({
  displayMonth,
  onPreviousClick,
  onNextClick,
  onMonthChange,
  fromDate,
  toDate,
}: {
  displayMonth: Date;
  onPreviousClick?: () => void;
  onNextClick?: () => void;
  onMonthChange?: (month: Date) => void;
  fromDate?: Date;
  toDate?: Date;
}) {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const currentYear = new Date().getFullYear();
  const startYear = fromDate ? fromDate.getFullYear() : currentYear - 50;
  const endYear = toDate ? toDate.getFullYear() : currentYear + 10;

  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(displayMonth);
    newMonth.setMonth(parseInt(monthIndex));
    onMonthChange?.(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(displayMonth);
    newMonth.setFullYear(parseInt(year));
    onMonthChange?.(newMonth);
  };

  return (
    <div className="flex items-center justify-between space-x-2 px-3 py-2 border-b">
      <Button
        variant="outline"
        size="icon"
        onClick={onPreviousClick}
        className="h-8 w-8 hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-2 flex-1">
        <Select
          value={displayMonth.getMonth().toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={displayMonth.getFullYear().toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[90px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onNextClick}
        className="h-8 w-8 hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  formatters,
  components,
  fromDate,
  toDate,
  month,
  onMonthChange,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    month || new Date()
  );

  const currentMonth = month || internalMonth;
  const handleMonthChange = onMonthChange || setInternalMonth;

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    handleMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    handleMonthChange(newDate);
  };

  return (
    <div className="bg-background border rounded-md">
      <AdvancedCalendarHeader
        displayMonth={currentMonth}
        onPreviousClick={goToPreviousMonth}
        onNextClick={goToNextMonth}
        onMonthChange={handleMonthChange}
        fromDate={fromDate}
        toDate={toDate}
      />
      <DayPicker
        showOutsideDays={showOutsideDays}
        fromDate={fromDate}
        toDate={toDate}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        className={cn(
          "bg-background group/calendar p-4 [--cell-size:2.5rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
          className
        )}
        captionLayout="label" // Forzamos a label para ocultar la navegación por defecto
        formatters={{
          formatMonthDropdown: (date) => months[date.getMonth()],
          formatYearDropdown: (date) => date.getFullYear().toString(),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit", defaultClassNames.root),
          months: cn(
            "flex gap-4 flex-col md:flex-row",
            defaultClassNames.months
          ),
          month: cn("flex flex-col w-full", defaultClassNames.month),
          nav: cn("hidden", defaultClassNames.nav), // Ocultamos la navegación por defecto
          month_caption: cn("hidden", defaultClassNames.month_caption), // Ocultamos el caption por defecto
          table: "w-full border-collapse",
          weekdays: cn("flex", defaultClassNames.weekdays),
          weekday: cn(
            "text-muted-foreground rounded-md flex-1 font-medium text-xs select-none uppercase tracking-wide py-2",
            defaultClassNames.weekday
          ),
          week: cn("flex w-full mt-1", defaultClassNames.week),
          week_number_header: cn(
            "select-none w-(--cell-size)",
            defaultClassNames.week_number_header
          ),
          week_number: cn(
            "text-xs select-none text-muted-foreground",
            defaultClassNames.week_number
          ),
          day: cn(
            "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
            defaultClassNames.day
          ),
          range_start: cn(
            "rounded-l-md bg-accent",
            defaultClassNames.range_start
          ),
          range_middle: cn("rounded-none", defaultClassNames.range_middle),
          range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
          today: cn(
            "bg-accent/70 text-accent-foreground rounded-md data-[selected=true]:rounded-none font-semibold",
            defaultClassNames.today
          ),
          outside: cn(
            "text-muted-foreground/60 aria-selected:text-muted-foreground",
            defaultClassNames.outside
          ),
          disabled: cn(
            "text-muted-foreground opacity-30",
            defaultClassNames.disabled
          ),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          DayButton: CalendarDayButton,
          WeekNumber: ({ children, ...props }) => {
            return (
              <td {...props}>
                <div className="flex size-(--cell-size) items-center justify-center text-center">
                  {children}
                </div>
              </td>
            );
          },
          ...components,
        }}
        {...props}
      />
    </div>
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
