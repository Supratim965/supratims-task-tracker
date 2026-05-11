import { useEffect, useMemo, useState } from "react";

export default function SearchableUserSelect({ listId, users, value, onChange, placeholder }) {
  const selectedName = useMemo(() => {
    const selected = users.find((user) => String(user.id) === String(value || ""));
    return selected ? selected.name : "";
  }, [users, value]);
  const [inputValue, setInputValue] = useState(selectedName);

  useEffect(() => {
    setInputValue(selectedName);
  }, [selectedName]);

  const handleInputChange = (event) => {
    const typed = event.target.value;
    setInputValue(typed);
    if (!typed.trim()) {
      onChange("");
      return;
    }
    const matched = users.find((user) => user.name.toLowerCase() === typed.trim().toLowerCase());
    onChange(matched ? String(matched.id) : "");
  };

  return (
    <>
      <input list={listId} value={inputValue} onChange={handleInputChange} placeholder={placeholder} />
      <datalist id={listId}>
        {users.map((user) => (
          <option key={user.id} value={user.name} />
        ))}
      </datalist>
    </>
  );
}
