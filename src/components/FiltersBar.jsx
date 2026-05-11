import { priorities, statuses } from "../constants";
import SearchableUserSelect from "./SearchableUserSelect";

export default function FiltersBar({ filters, setFilters, developers, designers, qas }) {
  return (
    <section className="card full">
      <h2>Task Filters & Search</h2>
      <div className="inline wrap">
        <input placeholder="Search title or ID" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <SearchableUserSelect
          listId="filter-developer-list"
          users={developers}
          value={filters.developer}
          onChange={(id) => setFilters({ ...filters, developer: id })}
          placeholder="All Developers (search)"
        />
        <SearchableUserSelect
          listId="filter-designer-list"
          users={designers}
          value={filters.designer}
          onChange={(id) => setFilters({ ...filters, designer: id })}
          placeholder="All Designers (search)"
        />
        <SearchableUserSelect
          listId="filter-qa-list"
          users={qas}
          value={filters.qa}
          onChange={(id) => setFilters({ ...filters, qa: id })}
          placeholder="All QA (search)"
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priorities</option>{priorities.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
          <option value="updated">Recently Updated</option>
          <option value="due">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </section>
  );
}
