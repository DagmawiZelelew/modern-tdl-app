let tasks = [];      
let filter = 'all';   
const STORAGE_KEY = 'ledger.tasks.v1';

const taskInput    = document.getElementById('taskInput');
const addBtn       = document.getElementById('addBtn');
const taskList     = document.getElementById('taskList');
const counter      = document.getElementById('counter');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const emptyState   = document.getElementById('emptyState');
const emptyStateText = document.getElementById('emptyStateText');

const filterBtns = {
    all:    document.getElementById('showAllBtn'),
    active: document.getElementById('showActiveBtn'),
    done:   document.getElementById('showDoneBtn'),
};

function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
        try {
            tasks = JSON.parse(raw);
            return;
        } catch (err) {
            console.error('Could not parse saved tasks, starting fresh.', err);
        }
    }
    tasks = [
        { id: crypto.randomUUID(), text: 'Add your first task above', done: false },
        { id: crypto.randomUUID(), text: 'Click a circle to mark it done', done: true },
    ];
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getFilteredTasks() {
    if (filter === 'active') return tasks.filter(t => !t.done);
    if (filter === 'done')   return tasks.filter(t => t.done);
    return tasks;
}
function render() {
    const visible = getFilteredTasks();

    if (visible.length === 0) {
        emptyState.hidden = false;
        taskList.hidden = true;
        emptyStateText.textContent =
            tasks.length === 0
                ? 'Nothing here yet. Add your first task above.'
                : `No ${filter} tasks.`;
    } else {
        emptyState.hidden = true;
        taskList.hidden = false;
    }

    // Build list HTML with map()
    taskList.innerHTML = visible.map(task => `
        <li class="task-item ${task.done ? 'is-done' : ''}" data-id="${task.id}">
            <button class="task-check" aria-label="Toggle done" title="Mark ${task.done ? 'active' : 'done'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
            <span class="task-text" title="Double-click to edit">${escapeHtml(task.text)}</span>
            <button class="task-delete" aria-label="Delete task" title="Delete">&times;</button>
        </li>
    `).join('');
    const activeCount = tasks.filter(t => !t.done).length;
    counter.textContent = `${activeCount} active / ${tasks.length} total`;

    // Filter button state
    Object.entries(filterBtns).forEach(([key, btn]) => {
        btn.classList.toggle('is-active', key === filter);
    });

    saveTasks();
}

// ---------- Task operations ----------
function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.push({
        id: crypto.randomUUID(),
        text: trimmed,
        done: false,
    });

    render();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    render();
}

function toggleTask(id) {
    tasks = tasks.map(t =>
        t.id === id ? { ...t, done: !t.done } : t
    );
    render();
}

function editTask(id, newText) {
    const trimmed = newText.trim();

    if (!trimmed) {
        deleteTask(id);
        return;
    }

    tasks = tasks.map(t =>
        t.id === id ? { ...t, text: trimmed } : t
    );
    render();
}

function clearDone() {
    const doneCount = tasks.filter(t => t.done).length;
    if (doneCount === 0) return;

    const confirmed = confirm(`Remove ${doneCount} completed task${doneCount === 1 ? '' : 's'}?`);
    if (!confirmed) return;

    tasks = tasks.filter(t => !t.done);
    render();
}

// ---------- Inline editing (double-click) ----------
function startEditing(li, task) {
    const span = li.querySelector('.task-text');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;

    span.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    let finished = false;
    function finish(commit) {
        if (finished) return;
        finished = true;
        if (commit) editTask(task.id, input.value);
        else render();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
}

// ---------- Event listeners ----------
addBtn.addEventListener('click', () => {
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
});

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addTask(taskInput.value);
        taskInput.value = '';
    }
});

taskList.addEventListener('click', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest('.task-check')) {
        toggleTask(id);
    } else if (e.target.closest('.task-delete')) {
        deleteTask(id);
    }
});

taskList.addEventListener('dblclick', (e) => {
    const span = e.target.closest('.task-text');
    if (!span) return;
    const li = e.target.closest('.task-item');
    const id = li.dataset.id;
    const task = tasks.find(t => t.id === id);
    if (task) startEditing(li, task);
});

Object.entries(filterBtns).forEach(([key, btn]) => {
    btn.addEventListener('click', () => {
        filter = key;
        render();
    });
});

clearDoneBtn.addEventListener('click', clearDone);

// ---------- Init ----------
loadTasks();
render();
