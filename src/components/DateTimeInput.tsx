import React from "react";

interface DateTimeInputProps {
  label?: string;
  value: string; // Expected format: "YYYY-MM-DDTHH:MM:SS.sssZ" (ISO timestamp)
  onChange: (value: string) => void;
}

export default function DateTimeInput({
  label,
  value,
  onChange,
}: DateTimeInputProps) {
  // Parse the ISO timestamp
  const date = new Date(value);
  const dateStr = value ? value.split('T')[0] : ""; // YYYY-MM-DD
  const parts = dateStr.split("-");
  const year = parts[0] || "";
  const month = parts[1] || "";
  const day = parts[2] || "";

  // Parse time
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const isAM = hours24 < 12;
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  
  const [timeInput, setTimeInput] = React.useState(`${hours12}:${minutes.toString().padStart(2, '0')}`);
  const [isAMSelected, setIsAMSelected] = React.useState(isAM);

  const updateDateTime = (newYear?: string, newMonth?: string, newDay?: string, newTimeInput?: string, newIsAM?: boolean) => {
    const updatedYear = newYear !== undefined ? newYear : year;
    const updatedMonth = newMonth !== undefined ? newMonth : month;
    const updatedDay = newDay !== undefined ? newDay : day;
    const updatedTimeInput = newTimeInput !== undefined ? newTimeInput : timeInput;
    const updatedIsAM = newIsAM !== undefined ? newIsAM : isAMSelected;

    // Parse time input
    const timeParts = updatedTimeInput.split(':');
    let hours = parseInt(timeParts[0]) || 0;
    const mins = parseInt(timeParts[1]) || 0;

    // Convert to 24-hour format
    if (!updatedIsAM && hours !== 12) {
      hours += 12;
    } else if (updatedIsAM && hours === 12) {
      hours = 0;
    }

    // Create new date
    const newDate = new Date();
    if (updatedYear && updatedMonth && updatedDay) {
      newDate.setFullYear(parseInt(updatedYear));
      newDate.setMonth(parseInt(updatedMonth) - 1);
      newDate.setDate(parseInt(updatedDay));
    }
    newDate.setHours(hours);
    newDate.setMinutes(mins);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    onChange(newDate.toISOString());
  };

  // Date handlers - work exactly like ModalDateInput (just store raw values)
  const handleYearChange = (newYear: string) => {
    if (newYear === "" || /^\d{1,4}$/.test(newYear)) {
      // Just update the ISO string with the new year part, don't validate during typing
      const currentTime = value.split('T')[1] || '00:00:00.000Z';
      onChange(`${newYear}-${month}-${day}T${currentTime}`);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    // Just update the ISO string with the new month part, don't validate during typing
    const currentTime = value.split('T')[1] || '00:00:00.000Z';
    onChange(`${year}-${newMonth}-${day}T${currentTime}`);
  };

  const handleDayChange = (newDay: string) => {
    // Just update the ISO string with the new day part, don't validate during typing
    const currentTime = value.split('T')[1] || '00:00:00.000Z';
    onChange(`${year}-${month}-${newDay}T${currentTime}`);
  };

  const handleTimeChange = (newTimeInput: string) => {
    // Allow typing of time in HH:MM format
    if (/^\d{0,2}:?\d{0,2}$/.test(newTimeInput)) {
      setTimeInput(newTimeInput);
      // Only update the full datetime if it's a valid time format
      if (/^\d{1,2}:\d{2}$/.test(newTimeInput)) {
        updateDateTime(undefined, undefined, undefined, newTimeInput);
      }
    }
  };

  const handleTimeBlur = () => {
    // Format the time input on blur
    const timeParts = timeInput.split(':');
    let hours = parseInt(timeParts[0]) || 12;
    const mins = parseInt(timeParts[1]) || 0;

    // Ensure valid hour range (1-12)
    if (hours < 1) hours = 12;
    if (hours > 12) hours = 12;

    const formattedTime = `${hours}:${mins.toString().padStart(2, '0')}`;
    setTimeInput(formattedTime);
    updateDateTime(undefined, undefined, undefined, formattedTime);
  };

  const handleAMPMChange = (newIsAM: boolean) => {
    setIsAMSelected(newIsAM);
    updateDateTime(undefined, undefined, undefined, undefined, newIsAM);
  };

  const handleMonthBlur = () => {
    if (month.length === 1 && month !== "0") {
      const formattedMonth = `0${month}`;
      const currentTime = value.split('T')[1] || '00:00:00.000Z';
      onChange(`${year}-${formattedMonth}-${day}T${currentTime}`);
    }
  };

  const handleDayBlur = () => {
    if (day.length === 1 && day !== "0") {
      const formattedDay = `0${day}`;
      const currentTime = value.split('T')[1] || '00:00:00.000Z';
      onChange(`${year}-${month}-${formattedDay}T${currentTime}`);
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
      <div className="flex items-center gap-1 flex-wrap">
        {/* Date inputs */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={year || ""}
            onChange={(e) => handleYearChange(e.target.value)}
            className={`w-12 bg-[#090C08] px-1 py-1 text-xs rounded text-center ${getYearInputClass()}`}
            placeholder="YYYY"
            maxLength={4}
          />
          <span className="text-[rgba(247,243,227,0.6)]">/</span>
          <input
            type="text"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            onBlur={handleMonthBlur}
            className={`w-8 bg-[#090C08] px-1 py-1 text-xs rounded text-center ${getMonthInputClass()}`}
            placeholder="MM"
            maxLength={2}
          />
          <span className="text-[rgba(247,243,227,0.6)]">/</span>
          <input
            type="text"
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            onBlur={handleDayBlur}
            className={`w-8 bg-[#090C08] px-1 py-1 text-xs rounded text-center ${getDayInputClass()}`}
            placeholder="DD"
            maxLength={2}
          />
        </div>

        {/* Time inputs */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[rgba(247,243,227,0.6)] text-xs">at</span>
          <input
            type="text"
            value={timeInput}
            onChange={(e) => handleTimeChange(e.target.value)}
            onBlur={handleTimeBlur}
            className="w-12 bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-1 py-1 text-xs rounded text-center"
            placeholder="12:00"
            maxLength={5}
          />
          
          {/* AM/PM Radio buttons */}
          <div className="flex items-center gap-1 ml-1">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="ampm"
                checked={isAMSelected}
                onChange={() => handleAMPMChange(true)}
                className="w-3 h-3"
              />
              <span className="text-[rgba(247,243,227,0.8)] text-xs">AM</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="ampm"
                checked={!isAMSelected}
                onChange={() => handleAMPMChange(false)}
                className="w-3 h-3"
              />
              <span className="text-[rgba(247,243,227,0.8)] text-xs">PM</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
