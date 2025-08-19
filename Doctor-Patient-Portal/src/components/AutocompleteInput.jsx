import { useState, useEffect, useRef } from 'react';

const AutocompleteInput = ({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder, 
  name,
  disabled = false,
  loading = false
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [inputValue, setInputValue] = useState(value || '');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync input value with parent value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Effect to hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions) return;
      
      // Arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      }
      // Arrow up
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(prev => (prev > 0 ? prev - 1 : 0));
      }
      // Enter
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSuggestions[activeSuggestion]) {
          selectSuggestion(filteredSuggestions[activeSuggestion]);
        }
      }
      // Escape
      else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, filteredSuggestions, activeSuggestion]);

  const handleChange = (e) => {
    const userInput = e.currentTarget.value;
    setInputValue(userInput);
    
    if (userInput) {
      const filtered = suggestions.filter(
        suggestion => suggestion.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
      setActiveSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
    
    onChange(e);
  };

  const selectSuggestion = (suggestion) => {
    const syntheticEvent = {
      target: {
        name: name,
        value: suggestion
      }
    };
    onChange(syntheticEvent);
    setInputValue(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (inputValue && suggestions.length > 0) {
      const filtered = suggestions.filter(
        suggestion => suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-3 pr-10 border ${disabled ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-900 dark:text-white'
          }`}
          autoComplete="off"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={showSuggestions}
          aria-controls={`${name}-suggestions`}
        />
        
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {showSuggestions && inputValue && (
        <ul 
          id={`${name}-suggestions`}
          className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion, index) => (
              <li
                key={`${suggestion}-${index}`}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setActiveSuggestion(index)}
                className={`p-3 cursor-pointer transition-colors ${
                  index === activeSuggestion 
                    ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={index === activeSuggestion}
              >
                {suggestion}
              </li>
            ))
          ) : (
            <li className="p-3 text-gray-500 dark:text-gray-400 italic">
              No matches found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;