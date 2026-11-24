"use strict";

const STORAGE_KEY = "ods17-usuarios";
const form = document.querySelector("#user-form");
const nameInput = document.querySelector("#user-name");
const emailInput = document.querySelector("#user-email");
const userList = document.querySelector("#user-list");
const searchField = document.querySelector("#search-field");
const searchQuery = document.querySelector("#search-query");
const clearUsersButton = document.querySelector("#clear-users");
const statusMessage = document.querySelector("#admin-status");

function readUsers() {
    const storedUsers = localStorage.getItem(STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : {};

    if (!users || typeof users !== "object" || Array.isArray(users)) {
        throw new Error("Os dados salvos dos usuários estão em um formato inválido.");
    }

    return users;
}

function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.setAttribute("role", isError ? "alert" : "status");
}

function renderUsers() {
    userList.replaceChildren();

    let users;
    try {
        users = readUsers();
    } catch (error) {
        clearUsersButton.disabled = true;
        showStatus(`Não foi possível carregar os usuários: ${error.message}`, true);
        return;
    }

    const entries = Object.entries(users);
    clearUsersButton.disabled = entries.length === 0;
    const query = searchQuery.value.trim().toLocaleLowerCase("pt-BR");
    const visibleEntries = entries.filter(([, user]) => {
        if (!user || typeof user.nome !== "string" || typeof user.email !== "string") {
            return false;
        }
        return user[searchField.value].toLocaleLowerCase("pt-BR").includes(query);
    });

    if (visibleEntries.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = entries.length ? "Nenhum usuário corresponde à pesquisa." : "Nenhum usuário cadastrado.";
        userList.append(emptyItem);
        return;
    }

    visibleEntries.forEach(([id, user]) => {
        const item = document.createElement("li");
        item.className = "user-item";

        const details = document.createElement("div");
        const name = document.createElement("p");
        name.textContent = user.nome;
        const email = document.createElement("p");
        email.textContent = user.email;
        const date = document.createElement("time");
        date.dateTime = user.dataCadastro;
        const timestamp = new Date(user.dataCadastro);
        date.textContent = Number.isNaN(timestamp.getTime())
            ? "Data de cadastro indisponível"
            : timestamp.toLocaleString("pt-BR");
        details.append(name, email, date);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Excluir";
        deleteButton.setAttribute("aria-label", `Excluir ${user.nome}`);
        deleteButton.addEventListener("click", () => deleteUser(id, user.nome));

        item.append(details, deleteButton);
        userList.append(item);
    });
}

function deleteUser(id, name) {
    if (!window.confirm(`Deseja excluir o usuário "${name}"?`)) {
        return;
    }

    try {
        const users = readUsers();
        delete users[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        showStatus("Usuário excluído.");
        renderUsers();
    } catch (error) {
        showStatus(`Não foi possível excluir o usuário: ${error.message}`, true);
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nome = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!nome || !email) {
        showStatus("Informe o nome e um e-mail válido.", true);
        return;
    }

    try {
        const users = readUsers();
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        users[id] = {
            nome,
            email,
            dataCadastro: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        form.reset();
        showStatus("Usuário cadastrado com sucesso.");
        renderUsers();
    } catch (error) {
        showStatus(`Não foi possível cadastrar o usuário: ${error.message}`, true);
    }
});

clearUsersButton.addEventListener("click", () => {
    let users;
    try {
        users = readUsers();
    } catch (error) {
        showStatus(`Não foi possível excluir os usuários: ${error.message}`, true);
        return;
    }

    const count = Object.keys(users).length;
    if (count === 0 || !window.confirm(`Deseja excluir todos os ${count} usuários?`)) {
        return;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);
        showStatus("Todos os usuários foram excluídos.");
        renderUsers();
    } catch (error) {
        showStatus(`Não foi possível excluir os usuários: ${error.message}`, true);
    }
});

searchQuery.addEventListener("input", renderUsers);
searchField.addEventListener("change", renderUsers);
renderUsers();
