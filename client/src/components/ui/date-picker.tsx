"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha",
  disabled,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange?.(selectedDate);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={disabled}
          initialFocus
          fromDate={minDate}
          toDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}
