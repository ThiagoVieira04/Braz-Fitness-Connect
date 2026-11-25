const loginView = document.getElementById('loginView');
const editorView = document.getElementById('editorView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const plansForm = document.getElementById('plansForm');
const plansEditor = document.getElementById('plansEditor');
const addPlanBtn = document.getElementById('addPlanBtn');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');

function setMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
    element.hidden = false;
}

function clearMessage(element) {
    if (!element) return;
    element.textContent = '';
    element.hidden = true;
}

function showLogin() {
    editorView.hidden = true;
    loginView.hidden = false;
    const username = document.getElementById('username');
    if (username) username.focus();
}

function showEditor() {
    loginView.hidden = true;
    editorView.hidden = false;
}

function createField(labelText, fieldName, value, required = false) {
    const label = document.createElement('label');
    label.className = 'field';

    const span = document.createElement('span');
    span.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.field = fieldName;
    input.value = value == null ? '' : String(value);
    input.required = required;

    label.appendChild(span);
    label.appendChild(input);
    return label;
}

function renumberPlans() {
    const rows = plansEditor.querySelectorAll('.plan-row');
    rows.forEach((row, index) => {
        const title = row.querySelector('.plan-row-title');
        if (title) title.textContent = `Plano ${index + 1}`;
        const removeBtn = row.querySelector('.btn-remove');
        if (removeBtn) removeBtn.setAttribute('aria-label', `Excluir plano ${index + 1}`);
    });
}

function updateAddButton() {
    if (!addPlanBtn) return;
    const count = plansEditor.querySelectorAll('.plan-row').length;
    addPlanBtn.disabled = count >= 50;
}

function createPlanRow(plan) {
    const data = plan || {};
    const row = document.createElement('div');
    row.className = 'plan-row';
    row.dataset.isWarning = data.isWarning ? 'true' : 'false';

    const head = document.createElement('div');
    head.className = 'plan-row-head';

    const title = document.createElement('span');
    title.className = 'plan-row-title';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Excluir';
    removeBtn.addEventListener('click', () => {
        if (window.confirm('Excluir este plano?')) {
            row.remove();
            renumberPlans();
            updateAddButton();
        }
    });

    head.appendChild(title);
    head.appendChild(removeBtn);
    row.appendChild(head);

    row.appendChild(createField('Nome', 'name', data.name, true));
    row.appendChild(createField('Preço', 'price', data.price));
    row.appendChild(createField('Detalhes (horários, observações)', 'details', data.details));

    return row;
}

function renderEditor(plans) {
    plansEditor.innerHTML = '';
    plans.forEach(plan => plansEditor.appendChild(createPlanRow(plan)));
    renumberPlans();
    updateAddButton();
}

function collectPlans() {
    return Array.from(plansEditor.querySelectorAll('.plan-row')).map(row => ({
        name: row.querySelector('[data-field="name"]').value,
        price: row.querySelector('[data-field="price"]').value,
        details: row.querySelector('[data-field="details"]').value,
        isWarning: row.dataset.isWarning === 'true'
    }));
}

if (addPlanBtn) {
    addPlanBtn.addEventListener('click', () => {
        const row = createPlanRow({ name: '', price: '', details: '', isWarning: false });
        plansEditor.appendChild(row);
        renumberPlans();
        updateAddButton();
        const nameInput = row.querySelector('[data-field="name"]');
        if (nameInput) nameInput.focus();
    });
}

async function loadPlans() {
    const response = await fetch('/api/plans', { credentials: 'same-origin' });

    if (response.status === 401) {
        showLogin();
        return;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar os planos.');
    }

    renderEditor(Array.isArray(data.plans) ? data.plans : []);
    showEditor();
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage(loginError);
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao entrar.');
        }

        document.getElementById('password').value = '';
        await loadPlans();
    } catch (error) {
        setMessage(loginError, error.message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
});

plansForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage(statusEl);
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    try {
        const response = await fetch('/api/plans', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ plans: collectPlans() })
        });

        if (response.status === 401) {
            showLogin();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar os planos.');
        }

        setMessage(statusEl, 'Salvo! O site será atualizado em cerca de 10 segundos.', 'success');
    } catch (error) {
        setMessage(statusEl, error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar alterações';
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
        // ignora falha de rede ao sair
    }
    window.location.href = '/';
});

loadPlans().catch(() => showLogin());
