const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function FilterBar({ active, onChange }) {
  return (
    <div className="filter-pills" role="group" aria-label="Filter by status">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`filter-pill${active === filter ? ' active' : ''}`}
          aria-pressed={active === filter}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
