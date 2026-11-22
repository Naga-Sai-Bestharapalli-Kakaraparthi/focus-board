import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, CheckCircle, Clock, ListTodo, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, Search, X,
} from "lucide-react";
import "./index.css";

const STORAGE_KEY = "focusboard.tasks.v1";

const SAMPLE_TASKS = [
  { id: "t1", title: "Design dashboard wireframes", description: "Create low-fidelity wireframes for the main dashboard.", category: "Design", status: "completed", priority: "high", dueDate: "2025-06-10" },
  { id: "t2", title: "Set up project repository", description: "Initialize Vite project and configure ESLint.", category: "Engineering", status: "completed", priority: "medium", dueDate: "2025-06-12" },
  { id: "t3", title: "Build sidebar navigation", description: "Implement responsive sidebar with icons and active states.", category: "Engineering", status: "inprogress", priority: "high", dueDate: "2025-06-15" },
  { id: "t4", title: "Implement Focus Notes carousel", description: "Three-slide carousel with prev/next and indicators.", category: "Engineering", status: "inprogress", priority: "medium", dueDate: "2025-06-18" },
  { id: "t5", title: "Write accessibility audit", description: "Check labels, focus states and keyboard navigation.", category: "QA", status: "todo", priority: "low", dueDate: "2025-06-22" },
  { id: "t6", title: "Polish mobile layout", description: "Verify 390px breakpoint, fix overflow issues.", category: "Design", status: "todo", priority: "high", dueDate: "2025-06-25" },
];

const SLIDES = [
  { title: "Focus Notes — Stay on Track", body: "Break large tasks into small, actionable steps and review your board every morning." },
  { title: "Focus Notes — Prioritize Ruthlessly", body: "Mark only the truly urgent items as High priority. Everything else can wait." },
  { title: "Focus Notes — Reflect Daily", body: "At the end of each day, close completed tasks and plan tomorrow's top three." },
];

const STATUS_LABELS = { todo: "To do", inprogress: "In progress", completed: "Completed" };

const emptyForm = { title: "", description: "", category: "General", status: "todo", priority: "medium", dueDate: "" };

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* ignore corrupt storage */ }
  return SAMPLE_TASKS;
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [slide, setSlide] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inprogress = tasks.filter(t => t.status === "inprogress").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { total, inprogress, completed, percent };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  function openCreate() {
    setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true);
  }
  function openEdit(task) {
    setEditing(task.id);
    setForm({ title: task.title, description: task.description, category: task.category, status: task.status, priority: task.priority, dueDate: task.dueDate });
    setErrors({}); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditing(null); setForm(emptyForm); setErrors({}); }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (form.title.trim().length > 100) e.title = "Title must be under 100 characters";
    return e;
  }

  function submitForm(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editing) {
      setTasks(prev => prev.map(t => t.id === editing ? { ...t, ...form, title: form.title.trim() } : t));
    } else {
      const id = "t" + Date.now();
      setTasks(prev => [{ ...form, id, title: form.title.trim() }, ...prev]);
    }
    closeModal();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setTasks(prev => prev.filter(t => t.id !== deleteTarget));
    setDeleteTarget(null);
  }

  function cycleStatus(id) {
    const order = ["todo", "inprogress", "completed"];
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const idx = order.indexOf(t.status);
      return { ...t, status: order[(idx + 1) % order.length] };
    }));
  }

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <span className="brand-dot">F</span> FocusBoard
        </div>
        <button className="nav-item active"><LayoutDashboard size={18} /> Dashboard</button>
        <button className="nav-item"><ListTodo size={18} /> My Tasks</button>
        <button className="nav-item"><Clock size={18} /> In Progress</button>
        <button className="nav-item"><CheckCircle size={18} /> Completed</button>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back — here's your focus for today.</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Create task
          </button>
        </header>

        {/* Stats */}
        <section className="stats" aria-label="Task statistics">
          <div className="stat-card"><div className="label">Total tasks</div><div className="value">{stats.total}</div></div>
          <div className="stat-card"><div className="label">In progress</div><div className="value">{stats.inprogress}</div></div>
          <div className="stat-card"><div className="label">Completed</div><div className="value">{stats.completed}</div></div>
          <div className="stat-card">
            <div className="label">Completion</div>
            <div className="value">{stats.percent}%</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${stats.percent}%` }} /></div>
          </div>
        </section>

        {/* Carousel */}
        <section className="carousel" aria-roledescription="carousel" aria-label="Focus notes">
          <div className="carousel-body">
            <h3>{SLIDES[slide].title}</h3>
            <p>{SLIDES[slide].body}</p>
          </div>
          <div className="carousel-controls">
            <button className="icon-btn" aria-label="Previous slide"
              onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}>
              <ChevronLeft size={18} />
            </button>
            <div className="dots" aria-label={`Slide ${slide + 1} of ${SLIDES.length}`}>
              {SLIDES.map((_, i) => (
                <span key={i} className={"dot" + (i === slide ? " active" : "")} />
              ))}
            </div>
            <button className="icon-btn" aria-label="Next slide"
              onClick={() => setSlide(s => (s + 1) % SLIDES.length)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Toolbar */}
        <div className="toolbar">
          <input className="search" placeholder="Search tasks by title…"
            aria-label="Search tasks" value={search}
            onChange={e => setSearch(e.target.value)} />
          <div className="tabs" role="tablist" aria-label="Filter by status">
            {["all", "todo", "inprogress", "completed"].map(s => (
              <button key={s} role="tab" aria-selected={statusFilter === s}
                className={"tab" + (statusFilter === s ? " active" : "")}
                onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <select className="search" style={{ flex: "0 0 auto" }}
            aria-label="Filter by priority" value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Task list */}
        <section className="task-list" aria-label="Task list">
          {visibleTasks.length === 0 && (
            <div className="empty">No tasks match your search or filters.</div>
          )}
          {visibleTasks.map(task => (
            <div className="task-row" key={task.id}>
              <div className="task-title-wrap">
                <div className="task-title">{task.title}</div>
                <div className="task-desc">{task.description}</div>
              </div>
              <button className={"badge " + task.status}
                onClick={() => cycleStatus(task.id)}
                title="Click to cycle status" aria-label={`Status: ${STATUS_LABELS[task.status]}. Click to change.`}>
                {STATUS_LABELS[task.status]}
              </button>
              <span className={"priority " + task.priority}>{task.priority} priority</span>
              <span className="task-meta due">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
              <div className="row-actions">
                <button className="icon-btn" aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}>
                  <Pencil size={16} />
                </button>
                <button className="icon-btn" aria-label={`Delete ${task.title}`} onClick={() => setDeleteTarget(task.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <h2 id="modal-title">{editing ? "Edit task" : "Create task"}</h2>
            <form onSubmit={submitForm} noValidate>
              <div className="form-field">
                <label htmlFor="title">Title <span aria-hidden="true">*</span></label>
                <input id="title" value={form.title} autoFocus
                  onChange={e => setForm({ ...form, title: e.target.value })} />
                {errors.title && <div className="error">{errors.title}</div>}
              </div>
              <div className="form-field">
                <label htmlFor="desc">Description</label>
                <textarea id="desc" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="cat">Category</label>
                  <input id="cat" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="form-field">
                  <label htmlFor="due">Due date</label>
                  <input id="due" type="date" value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-field">
                  <label htmlFor="status">Status</label>
                  <select id="status" value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">To do</option>
                    <option value="inprogress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="priority">Priority</label>
                  <select id="priority" value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? "Save changes" : "Create task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" role="alertdialog" aria-modal="true" aria-labelledby="del-title">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 id="del-title">Delete task?</h2>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: "var(--red)" }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
