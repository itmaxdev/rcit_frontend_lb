// src/sharedComponents/AutocompleteField.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import chevron from "../assets/chevron-down.svg";

const DEBOUNCE_MS = 250;

const AutocompleteField = ({
  fieldName,
  value = "",
  fetchSuggestions = async () => [],
  onSelect = () => {},
  changeValue = () => {},
  disabled = false,
  minChars = 1,
  noResultsText = "Autocomplete_NoResults",
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const requestId = useRef(0);

  // Keep the visible text in sync when the parent resets/overrides the value.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close the dropdown when clicking outside the field.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runFetch = useCallback(
    (text) => {
      const currentRequest = ++requestId.current;
      setLoading(true);
      fetchSuggestions(text)
        .then((results) => {
          // Ignore responses from stale (superseded) requests.
          if (currentRequest !== requestId.current) return;
          setSuggestions(Array.isArray(results) ? results : []);
          setHighlight(-1);
          setLoading(false);
        })
        .catch(() => {
          if (currentRequest !== requestId.current) return;
          setSuggestions([]);
          setLoading(false);
        });
    },
    [fetchSuggestions]
  );

  const scheduleFetch = useCallback(
    (text) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (text.trim().length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      debounceRef.current = setTimeout(() => runFetch(text), DEBOUNCE_MS);
    },
    [minChars, runFetch]
  );

  const handleChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    changeValue(text.trim());
    setOpen(true);
    scheduleFetch(text);
  };

  const handleFocus = () => {
    setOpen(true);
    if (query.trim().length >= minChars && suggestions.length === 0) {
      scheduleFetch(query);
    }
  };

  const pick = (item) => {
    setQuery(item.name);
    changeValue(item.name);
    onSelect(item);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      pick(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown =
    open && !disabled && query.trim().length >= minChars;

  return (
    <FieldContainer ref={containerRef}>
      <FieldName>{t(fieldName)}</FieldName>
      <InputWrapper $disabled={disabled}>
        <Input
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={t(fieldName)}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        <Chevron src={chevron} alt="" $open={showDropdown} />
      </InputWrapper>

      {showDropdown && (
        <Dropdown>
          {loading ? (
            <Status>{t("Loading")}</Status>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <Option
                key={item.id ?? item.name}
                $active={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                // onMouseDown (not onClick) so the pick fires before blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
              >
                {item.name}
              </Option>
            ))
          ) : (
            <Status>{t(noResultsText)}</Status>
          )}
        </Dropdown>
      )}
    </FieldContainer>
  );
};

export default AutocompleteField;

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
  border-bottom: 1.5px solid #20294c;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

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

const Chevron = styled.img`
  width: 16px;
  height: 16px;
  opacity: 0.5;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  pointer-events: none;
`;

const Dropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  padding: 6px;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(32, 41, 76, 0.12);
  border: 1px solid #eef0f3;
`;

const Option = styled.li`
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 15px;
  color: #20294c;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "rgba(67, 108, 77, 0.08)" : "transparent")};
`;

const Status = styled.div`
  padding: 10px 12px;
  font-size: 14px;
  color: #797f94;
`;
