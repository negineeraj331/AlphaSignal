import { useState } from 'react';

const SUGGESTIONS = [
  'Apple',
  'NVIDIA',
  'Tesla',
  'Microsoft',
  'Amazon',
  'Google',
  'Meta',
  'Berkshire Hathaway',
  'JPMorgan Chase',
  'Netflix',
];

/**
 * SearchBar — Company name input with suggestions and submit button.
 * @param {{ onSearch: (company: string) => void, isLoading: boolean }} props
 */
export function SearchBar({ onSearch, isLoading }) {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = value.length > 0
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      setShowSuggestions(false);
      onSearch(value.trim());
    }
  };

  const selectSuggestion = (suggestion) => {
    setValue(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="company-search-input"
            type="text"
            className="search-input"
            placeholder="Enter a company name (e.g. Apple, Tesla, NVIDIA)..."
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setValue('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {showSuggestions && filtered.length > 0 && (
          <ul className="suggestions-list" role="listbox">
            {filtered.map((s) => (
              <li
                key={s}
                className="suggestion-item"
                role="option"
                onMouseDown={() => selectSuggestion(s)}
              >
                <span className="suggestion-icon">🏢</span>
                {s}
              </li>
            ))}
          </ul>
        )}

        <button
          id="research-submit-btn"
          type="submit"
          className={`search-button ${isLoading ? 'loading' : ''}`}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Researching...
            </>
          ) : (
            <>
              <span>Analyze</span>
              <span className="btn-arrow">→</span>
            </>
          )}
        </button>
      </form>

      <p className="search-hint">
        Powered by GPT-4o + Tavily web search · Research takes ~45–90 seconds
      </p>
    </div>
  );
}
