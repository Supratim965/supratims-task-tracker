import { useMemo, useState } from "react";

const initialForm = { role: "Developer", name: "" };

export default function TeamMemberManager({ developers, designers, addUser, updateUser, deleteUser }) {
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const teamMembers = useMemo(() => [...developers, ...designers], [developers, designers]);

  const submitForm = async (event) => {
    event.preventDefault();
    await addUser(form);
    setForm(initialForm);
  };

  return (
    <section className="card full">
      <h2>Team Member Management</h2>
      <form className="inline team-form" onSubmit={submitForm}>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="Developer">Developer</option>
          <option value="Designer">Designer</option>
        </select>
        <input
          placeholder="Enter team member name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <button type="submit">Add Profile</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id}>
                <td>{member.role}</td>
                <td>
                  {editId === member.id ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    member.name
                  )}
                </td>
                <td>
                  {editId === member.id ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateUser(member.id, editName);
                          setEditId(null);
                          setEditName("");
                        }}
                      >
                        Save
                      </button>
                      <button type="button" onClick={() => setEditId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(member.id);
                          setEditName(member.name);
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => deleteUser(member.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
