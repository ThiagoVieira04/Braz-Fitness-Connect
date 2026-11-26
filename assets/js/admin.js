import { upload } from './vendor/vercel-blob-client.mjs';

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
const mediaForm = document.getElementById('mediaForm');
const mediaEditor = document.getElementById('mediaEditor');
const addMediaBtn = document.getElementById('addMediaBtn');
const saveMediaBtn = document.getElementById('saveMediaBtn');
const mediaStatusEl = document.getElementById('mediaStatus');
const accountForm = document.getElementById('accountForm');
const accountName = document.getElementById('accountName');
const accountUsername = document.getElementById('accountUsername');
const accountCurrentPassword = document.getElementById('accountCurrentPassword');
const saveAccountBtn = document.getElementById('saveAccountBtn');
const accountStatusEl = document.getElementById('accountStatus');

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_MEDIA_ITEMS = 100;

const MEDIA_TYPES = [
    { value: 'video', label: 'Vídeo' },
    { value: 'image', label: 'Imagem' }
];

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

function activateTab(name) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        const active = tab.dataset.tab === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });
    const plansPanel = document.getElementById('plansPanel');
    const mediaPanel = document.getElementById('mediaPanel');
    const accountPanel = document.getElementById('accountPanel');
    if (plansPanel) plansPanel.hidden = name !== 'plans';
    if (mediaPanel) mediaPanel.hidden = name !== 'media';
    if (accountPanel) accountPanel.hidden = name !== 'account';
}

async function loadAdminProfile() {
    const response = await fetch('/api/admin-profile', { credentials: 'same-origin' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar a conta do administrador.');
    }

    accountName.value = data.profile.name;
    accountUsername.value = data.profile.username;
    document.getElementById('adminGreeting').textContent = `Olá, ${data.profile.name}`;
}

/* --------------------------------------------------------------------------
   PLANOS
   -------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------
   POR DENTRO DA BRAZ (MÍDIAS)
   -------------------------------------------------------------------------- */

function createSelect(labelText, fieldName, options, value) {
    const label = document.createElement('label');
    label.className = 'field';

    const span = document.createElement('span');
    span.textContent = labelText;

    const select = document.createElement('select');
    select.dataset.field = fieldName;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        select.appendChild(opt);
    });
    select.value = value || options[0].value;

    label.appendChild(span);
    label.appendChild(select);
    return label;
}

function renumberMedia() {
    const rows = mediaEditor.querySelectorAll('.media-row');
    rows.forEach((row, index) => {
        const title = row.querySelector('.media-row-title');
        if (title) title.textContent = `Mídia ${index + 1}`;
        const removeBtn = row.querySelector('.btn-remove');
        if (removeBtn) removeBtn.setAttribute('aria-label', `Excluir mídia ${index + 1}`);
        const upBtn = row.querySelector('[data-move="up"]');
        const downBtn = row.querySelector('[data-move="down"]');
        if (upBtn) upBtn.disabled = index === 0;
        if (downBtn) downBtn.disabled = index === rows.length - 1;
    });
    if (addMediaBtn) addMediaBtn.disabled = rows.length >= MAX_MEDIA_ITEMS;
}

function moveMediaRow(row, direction) {
    const rows = Array.from(mediaEditor.querySelectorAll('.media-row'));
    const currentIndex = rows.indexOf(row);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= rows.length) return;

    const viewportTop = row.getBoundingClientRect().top;

    if (direction < 0) {
        mediaEditor.insertBefore(row, rows[targetIndex]);
    } else {
        const next = rows[targetIndex].nextElementSibling;
        if (next) {
            mediaEditor.insertBefore(row, next);
        } else {
            mediaEditor.appendChild(row);
        }
    }

    renumberMedia();

    const viewportTopAfterMove = row.getBoundingClientRect().top;
    window.scrollBy({
        top: viewportTopAfterMove - viewportTop
    });
}

function updateMediaRow(row) {
    const type = row.querySelector('[data-field="type"]').value;
    row.dataset.type = type;

    const srcInput = row.querySelector('[data-field="src"]');
    const fileLabel = row.querySelector('[data-role="file-label"]');
    if (fileLabel) {
        const src = srcInput ? srcInput.value.trim() : '';
        if (src) {
            const name = src.split('/').pop().split('?')[0];
            fileLabel.textContent = `Arquivo atual: ${name}`;
        } else {
            fileLabel.textContent = 'Nenhum arquivo enviado';
        }
    }
}

function createMediaRow(item) {
    const data = item || { type: 'video', src: '' };
    const row = document.createElement('div');
    row.className = 'media-row';

    const head = document.createElement('div');
    head.className = 'media-row-head';

    const title = document.createElement('span');
    title.className = 'media-row-title';

    const actions = document.createElement('div');
    actions.className = 'media-row-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'btn-move';
    upBtn.dataset.move = 'up';
    upBtn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    upBtn.addEventListener('click', () => {
        moveMediaRow(row, -1);
    });

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'btn-move';
    downBtn.dataset.move = 'down';
    downBtn.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    downBtn.addEventListener('click', () => {
        moveMediaRow(row, 1);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Excluir';
    removeBtn.addEventListener('click', () => {
        if (window.confirm('Excluir esta mídia?')) {
            row.remove();
            renumberMedia();
        }
    });

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(removeBtn);
    head.appendChild(title);
    head.appendChild(actions);
    row.appendChild(head);

    const safeType = data.type === 'image' ? 'image' : 'video';
    const typeSelect = createSelect('Tipo', 'type', MEDIA_TYPES, safeType);
    typeSelect.querySelector('select').addEventListener('change', () => updateMediaRow(row));
    row.appendChild(typeSelect);

    const srcInput = document.createElement('input');
    srcInput.type = 'hidden';
    srcInput.dataset.field = 'src';
    srcInput.value = data.src || '';
    row.appendChild(srcInput);

    const uploadField = document.createElement('div');
    uploadField.className = 'field';
    uploadField.dataset.role = 'upload-field';
    const uploadSpan = document.createElement('span');
    uploadSpan.textContent = 'Arquivo de mídia';
    const fileLabel = document.createElement('small');
    fileLabel.className = 'media-upload-status';
    fileLabel.dataset.role = 'file-label';
    const uploadRow = document.createElement('div');
    uploadRow.className = 'media-upload-row';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp';
    fileInput.dataset.field = 'file';
    const uploadStatus = document.createElement('span');
    uploadStatus.className = 'media-upload-status';
    uploadStatus.dataset.role = 'upload-status';
    uploadRow.appendChild(fileInput);
    uploadRow.appendChild(uploadStatus);
    uploadField.appendChild(uploadSpan);
    uploadField.appendChild(fileLabel);
    uploadField.appendChild(uploadRow);
    row.appendChild(uploadField);

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (file) handleFileUpload(row, file);
    });

    updateMediaRow(row);
    return row;
}

async function handleFileUpload(row, file) {
    const status = row.querySelector('[data-role="upload-status"]');
    const srcInput = row.querySelector('[data-field="src"]');
    const typeSelect = row.querySelector('[data-field="type"]');

    if (file.size > MAX_UPLOAD_BYTES) {
        if (status) status.textContent = 'Arquivo muito grande (máximo 100 MB).';
        return;
    }

    if (status) status.textContent = 'Enviando... 0%';

    try {
        const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            onUploadProgress: ({ percentage }) => {
                if (status) status.textContent = `Enviando... ${Math.round(percentage)}%`;
            }
        });

        if (srcInput) srcInput.value = blob.url;
        if (typeSelect && file.type.startsWith('image/')) {
            typeSelect.value = 'image';
        } else if (typeSelect) {
            typeSelect.value = 'video';
        }
        updateMediaRow(row);
        if (status) status.textContent = 'Enviado! Clique em Salvar mídias.';
    } catch (error) {
        if (status) status.textContent = error.message || 'Falha ao enviar o arquivo.';
    }
}

function renderMediaEditor(items) {
    mediaEditor.innerHTML = '';
    items.forEach(item => mediaEditor.appendChild(createMediaRow(item)));
    renumberMedia();
}

function collectMedia() {
    return Array.from(mediaEditor.querySelectorAll('.media-row')).map(row => ({
        type: row.querySelector('[data-field="type"]').value,
        src: row.querySelector('[data-field="src"]').value.trim()
    }));
}

/* --------------------------------------------------------------------------
   CARREGAMENTO
   -------------------------------------------------------------------------- */

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

async function loadCatalog() {
    try {
        const response = await fetch('/api/catalog', { credentials: 'same-origin' });

        if (response.status === 401) {
            showLogin();
            return;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar as mídias.');
        }

        renderMediaEditor(Array.isArray(data.items) ? data.items : []);
        clearMessage(mediaStatusEl);
    } catch (error) {
        renderMediaEditor([]);
        setMessage(mediaStatusEl, error.message, 'error');
    }
}

async function loadAll() {
    await loadPlans();
    if (!editorView.hidden) {
        await loadCatalog();
        try {
            await loadAdminProfile();
            clearMessage(accountStatusEl);
        } catch (error) {
            setMessage(accountStatusEl, error.message, 'error');
        }
    }
}

/* --------------------------------------------------------------------------
   EVENTOS
   -------------------------------------------------------------------------- */

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

if (addMediaBtn) {
    addMediaBtn.addEventListener('click', () => {
        const row = createMediaRow({ type: 'video', src: '' });
        mediaEditor.appendChild(row);
        renumberMedia();
        const srcInput = row.querySelector('[data-field="src"]');
        if (srcInput) srcInput.focus();
    });
}

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

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
        await loadAll();
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

mediaForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage(mediaStatusEl);

    const items = collectMedia();
    if (items.some(item => !item.src)) {
        setMessage(mediaStatusEl, 'Envie um arquivo para todas as mídias ou remova as que estão vazias.', 'error');
        return;
    }

    saveMediaBtn.disabled = true;
    saveMediaBtn.textContent = 'Salvando...';

    try {
        const response = await fetch('/api/catalog', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ items })
        });

        if (response.status === 401) {
            showLogin();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar as mídias.');
        }

        setMessage(mediaStatusEl, 'Salvo! O site será atualizado em cerca de 10 segundos.', 'success');
    } catch (error) {
        setMessage(mediaStatusEl, error.message, 'error');
    } finally {
        saveMediaBtn.disabled = false;
        saveMediaBtn.textContent = 'Salvar mídias';
    }
});

accountForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage(accountStatusEl);
    saveAccountBtn.disabled = true;
    saveAccountBtn.textContent = 'Salvando...';

    try {
        const response = await fetch('/api/admin-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                name: accountName.value,
                username: accountUsername.value,
                currentPassword: accountCurrentPassword.value
            })
        });

        if (response.status === 401) {
            const data = await response.json().catch(() => ({}));
            if (data.error === 'Não autorizado.') {
                showLogin();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            throw new Error(data.error || 'Senha atual incorreta.');
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar a conta.');
        }

        accountCurrentPassword.value = '';
        accountName.value = data.profile.name;
        accountUsername.value = data.profile.username;
        document.getElementById('adminGreeting').textContent = `Olá, ${data.profile.name}`;
        setMessage(accountStatusEl, 'Conta atualizada. Use o novo usuário no próximo login.', 'success');
    } catch (error) {
        setMessage(accountStatusEl, error.message, 'error');
    } finally {
        saveAccountBtn.disabled = false;
        saveAccountBtn.textContent = 'Salvar conta';
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

loadAll().catch(() => showLogin());
