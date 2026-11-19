import { useState } from 'react';
import { GENRES, PLATFORMS, MODES, SORTS } from '../data/options';

export default function Filters({ values, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const active =
    [values.genre, values.platform, values.mode, values.price].filter(Boolean).length +
    (values.sort !== 'default' ? 1 : 0);

  return (
    <div className={open ? 'filters filters--open' : 'filters'}>
      <input
        className="filters__search"
        type="search"
        placeholder="Search by title or studio..."
        aria-label="Search games"
        value={values.q}
        onChange={(e) => onChange('q', e.target.value)}
      />

      <button
        type="button"
        className="btn btn--light filters__toggle"
        aria-expanded={open}
        aria-controls="filter-options"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide filters' : 'Filters'}
        {active > 0 && ` (${active})`}
      </button>

      <div className="filters__options" id="filter-options">
        <select
          aria-label="Genre"
          value={values.genre}
          onChange={(e) => onChange('genre', e.target.value)}
        >
          <option value="">All genres</option>
          {GENRES.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>

        <select
          aria-label="Platform"
          value={values.platform}
          onChange={(e) => onChange('platform', e.target.value)}
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>

        <select
          aria-label="Mode"
          value={values.mode}
          onChange={(e) => onChange('mode', e.target.value)}
        >
          <option value="">Any mode</option>
          {MODES.map((mode) => (
            <option key={mode}>{mode}</option>
          ))}
        </select>

        <select
          aria-label="Price"
          value={values.price}
          onChange={(e) => onChange('price', e.target.value)}
        >
          <option value="">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <select aria-label="Sort" value={values.sort} onChange={(e) => onChange('sort', e.target.value)}>
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button type="button" className="btn btn--light" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
