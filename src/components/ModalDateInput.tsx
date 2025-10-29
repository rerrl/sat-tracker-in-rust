import React from "react";

interface ModalDateInputProps {
  label: string;
  value: string; // Expected format: "YYYY-MM-DDTHH:MM:SS.sssZ" (ISO timestamp)
  onChange: (value: string) => void;
  yearInputId?: string;
  monthInputId?: string;
  dayInputId?: string;
  isStartDate?: boolean; // New prop to determine if this is a start date
}

export default function ModalDateInput({
  label,
  value,
  onChange,
  yearInputId,
  monthInputId,
  dayInputId,
  isStartDate = false,
}: ModalDateInputProps) {
  // Set default values if value is empty
  React.useEffect(() => {
    if (!value) {
      const today = new Date();
      let targetDate: Date;
      
      if (isStartDate) {
        // 6 months back from today for start date
        targetDate = new Date(today);
        targetDate.setMonth(today.getMonth() - 6);
      } else {
        // Today for end date
        targetDate = today;
      }
      
      const defaultValue = targetDate.toISOString();
      onChange(defaultValue);
    }
  }, [value, onChange, isStartDate]);

  // Parse the ISO timestamp
  const date = new Date(value);
  const dateStr = value ? value.split('T')[0] : ""; // YYYY-MM-DD
  const parts = dateStr.split("-");
  const year = parts[0] || "";
  const month = parts[1] || "";
  const day = parts[2] || "";

  const handleYearChange = (newYear: string) => {
    if (newYear === "" || /^\d{1,4}$/.test(newYear)) {
      onChange(`${newYear}-${month}-${day}`);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    onChange(`${year}-${newMonth}-${day}`);
  };

  const handleDayChange = (newDay: string) => {
    onChange(`${year}-${month}-${newDay}`);
  };

  const handleMonthBlur = () => {
    if (month.length === 1 && month !== "0") {
      const formattedMonth = `0${month}`;
      onChange(`${year}-${formattedMonth}-${day}`);
    }
  };

  const handleDayBlur = () => {
    if (day.length === 1 && day !== "0") {
      const formattedDay = `0${day}`;
      onChange(`${year}-${month}-${formattedDay}`);
    }
  };

  const getMonthInputClass = () => {
    if (!month) return "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]";
    const monthNum = parseInt(month);
    return monthNum < 1 || monthNum > 12
      ? "border-2 border-red-500 text-red-400"
      : "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]";
  };

  const getDayInputClass = () => {
    if (!day) return "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]";
    const dayNum = parseInt(day);
    return dayNum < 1 || dayNum > 31
      ? "border-2 border-red-500 text-red-400"
      : "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]";
  };

  const getYearInputClass = () => {
    if (!year || year.length < 4) return "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]";
    const inputYear = parseInt(year);
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const minYear = 2009;
    const maxYear = nextYear;
    return inputYear < minYear || inputYear > maxYear
      ? "border-2 border-red-500 text-red-400"
      : "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]";
  };

  return (
    <div>
      {label && (
        <label className="block text-[rgba(247,243,227,0.8)] font-medium mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={year || ""}
          onChange={(e) => handleYearChange(e.target.value)}
          className={`w-12 bg-[#090C08] px-1 py-2 text-xs rounded text-center ${getYearInputClass()}`}
          placeholder="YYYY"
          maxLength={4}
          id={yearInputId}
        />
        <span className="text-[rgba(247,243,227,0.6)]">/</span>
        <input
          type="text"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          onBlur={handleMonthBlur}
          className={`w-8 bg-[#090C08] px-1 py-2 text-xs rounded text-center ${getMonthInputClass()}`}
          placeholder="MM"
          maxLength={2}
          id={monthInputId}
        />
        <span className="text-[rgba(247,243,227,0.6)]">/</span>
        <input
          type="text"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          onBlur={handleDayBlur}
          className={`w-8 bg-[#090C08] px-1 py-2 text-xs rounded text-center ${getDayInputClass()}`}
          placeholder="DD"
          maxLength={2}
          id={dayInputId}
        />
      </div>
    </div>
  );
}
