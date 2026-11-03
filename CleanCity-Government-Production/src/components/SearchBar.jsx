export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Search by report ID, category or location'}
      aria-label="Search reports"
    />
  );
}
