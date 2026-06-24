// src/sharedComponents/DateField.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import chevron from "../assets/chevron-down.svg";

// Internal value format kept as "dd/MM/yyyy" to stay compatible with the
// declaration payload (verify/declare endpoints).
const pad = (n) => String(n).padStart(2, "0");
const formatDate = (date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const parseDate = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  if (!d || !m || !y) return null;
  const date = new Date(y, m - 1, d);
  // Guard against invalid dates like 31/02/2024 rolling over.
  return date.getDate() === d && date.getMonth() === m - 1 ? date : null;
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Turn raw typed/pasted text into a "dd/MM/yyyy" mask (digits only, slashes
// auto-inserted). Pasting "30/12/2024" or "30-12-2024" both normalise cleanly.
const maskDate = (raw) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "/" + d.slice(2, 4);
  if (d.length > 4) out += "/" + d.slice(4, 8);
  return out;
};

const DateField = ({ fieldName, value = "", changeValue = () => {} }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || "en";

  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const selected = parseDate(text);
  const [viewDate, setViewDate] = useState(parseDate(value) || new Date());
  const containerRef = useRef(null);
  // Tracks the last value we sent upward, so external resets (e.g. clearing the
  // form) re-sync the input without wiping what the user is mid-typing.
  const emittedRef = useRef(value);

  const today = startOfDay(new Date());

  const emit = (v) => {
    emittedRef.current = v;
    changeValue(v);
  };

  useEffect(() => {
    if (value !== emittedRef.current) {
      emittedRef.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reopen on the selected month each time the picker is opened.
  useEffect(() => {
    if (open) setViewDate(parseDate(text) || new Date());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const typed = parseDate(text);
  const isPastDate = typed && typed <= today;
  // Neutral while empty or incomplete; red only once a full date is invalid.
  const inputValidity =
    text.length === 0 ? null : text.length < 10 ? null : isPastDate ? true : false;

  const handleTextChange = (e) => {
    const masked = maskDate(e.target.value);
    setText(masked);
    const parsed = parseDate(masked);
    if (masked.length === 10 && parsed && parsed <= today) {
      setViewDate(parsed);
      emit(masked);
    } else {
      // Keep the form disabled until a complete, valid past date is entered.
      emit("");
    }
  };

  const weekdays = useMemo(() => {
    // Week starting Monday.
    const ref = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ref);
      d.setDate(ref.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "short" });
    });
  }, [locale]);

  const monthLabel = viewDate.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-based offset for the first cell.
    const lead = (firstDay.getDay() + 6) % 7;
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [viewDate]);

  const goMonth = (delta) =>
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );

  // The import date must be strictly in the past (backend @Past constraint),
  // so future days are not selectable (today is allowed).
  const isDisabledDay = (date) => date > today;
  const isNextDisabled =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  const handleSelect = (date) => {
    if (isDisabledDay(date)) return;
    const formatted = formatDate(date);
    setText(formatted);
    setViewDate(date);
    emit(formatted);
    setOpen(false);
  };

  const isSelected = (date) =>
    selected &&
    date.getDate() === selected.getDate() &&
    date.getMonth() === selected.getMonth() &&
    date.getFullYear() === selected.getFullYear();

  const isToday = (date) => date.getTime() === today.getTime();

  return (
    <FieldContainer ref={containerRef}>
      <FieldName>{t(fieldName)}</FieldName>
      <InputWrapper $open={open} $isValid={inputValidity}>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t("DateField_Placeholder")}
          value={text}
          onChange={handleTextChange}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
        <ToggleButton
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle calendar"
        >
          <Chevron src={chevron} alt="" $open={open} />
        </ToggleButton>
      </InputWrapper>
      <Message $isValid={inputValidity}>
        {inputValidity === false ? t("Invalid") + " " + t(fieldName) : ""}
      </Message>

      {open && (
        <Calendar onMouseDown={(e) => e.preventDefault()}>
          <CalendarHeader>
            <NavButton type="button" onClick={() => goMonth(-1)} aria-label="Previous month">
              <NavIcon src={chevron} alt="" $dir="left" />
            </NavButton>
            <MonthLabel>{monthLabel}</MonthLabel>
            <NavButton
              type="button"
              disabled={isNextDisabled}
              onClick={() => !isNextDisabled && goMonth(1)}
              aria-label="Next month"
            >
              <NavIcon src={chevron} alt="" $dir="right" />
            </NavButton>
          </CalendarHeader>

          <WeekRow>
            {weekdays.map((w) => (
              <Weekday key={w}>{w}</Weekday>
            ))}
          </WeekRow>

          <Grid>
            {days.map((date, index) =>
              date ? (
                <Day
                  key={index}
                  type="button"
                  disabled={isDisabledDay(date)}
                  $selected={isSelected(date)}
                  $today={isToday(date)}
                  onClick={() => handleSelect(date)}
                >
                  {date.getDate()}
                </Day>
              ) : (
                <span key={index} />
              )
            )}
          </Grid>
        </Calendar>
      )}
    </FieldContainer>
  );
};

export default DateField;

const FieldContainer = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 4px;
`;

const FieldName = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #797f94;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1.5px solid
    ${({ $open, $isValid }) => {
      if ($open) return "#436c4d";
      if ($isValid === null) return "#20294c";
      return $isValid ? "#00953F" : "#EC011A";
    }};

  &:focus-within {
    border-bottom-color: #436c4d;
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  padding: 4px 0px;
  background: none;
  color: #20294c;
  caret-color: #436c4d;
  font-family: "Lato", sans-serif;

  &::placeholder {
    color: #c6cace;
    font-weight: 500;
    font-family: "Lato", sans-serif;
  }
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

const Chevron = styled.img`
  width: 16px;
  height: 16px;
  opacity: 0.5;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
`;

const Message = styled.div`
  font-size: 12px;
  color: ${({ $isValid }) => ($isValid ? "#00953F" : "#EC011A")};
  height: 16px;
`;

const Calendar = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: 280px;
  padding: 14px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(32, 41, 76, 0.15);
  border: 1px solid #eef0f3;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const MonthLabel = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #20294c;
  text-transform: capitalize;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #f4f5f7;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  transition: background 0.2s ease;

  &:hover {
    background: ${({ disabled }) => (disabled ? "#f4f5f7" : "#e9ebef")};
  }
`;

const NavIcon = styled.img`
  width: 14px;
  height: 14px;
  transform: rotate(${({ $dir }) => ($dir === "left" ? "90deg" : "-90deg")});
`;

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
`;

const Weekday = styled.span`
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #797f94;
  text-transform: capitalize;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const Day = styled.button`
  height: 34px;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  font-family: "Lato", sans-serif;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  color: ${({ disabled, $selected }) =>
    $selected ? "#fff" : disabled ? "#c6cace" : "#20294c"};
  background: ${({ $selected }) => ($selected ? "#436c4d" : "transparent")};
  font-weight: ${({ $selected, $today }) => ($selected || $today ? 700 : 500)};
  box-shadow: ${({ $today, $selected }) =>
    $today && !$selected ? "inset 0 0 0 1.5px #436c4d" : "none"};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ disabled, $selected }) =>
      disabled ? "transparent" : $selected ? "#436c4d" : "rgba(67, 108, 77, 0.1)"};
  }
`;
