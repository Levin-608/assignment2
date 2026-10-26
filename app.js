
const message = document.getElementById("message");

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const dashboard = document.getElementById("dashboard");

const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");

let expenses = [];

// Send requests to the backend
async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}

// Show a message
function showMessage(text) {
    message.textContent = text;
}

// Switch between login and registration
document.getElementById("showRegister").onclick = () => {
    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");
    showMessage("");
};

document.getElementById("showLogin").onclick = () => {
    registerSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
    showMessage("");
};

// Register user
document.getElementById("registerForm").onsubmit = async (event) => {
    event.preventDefault();

    try {
        const data = await api("/api/register", {
            method: "POST",
            body: JSON.stringify({
                name: document.getElementById("regName").value,
                email: document.getElementById("regEmail").value,
                password: document.getElementById("regPassword").value
            })
        });

        document.getElementById("registerForm").reset();
        registerSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
        showMessage(data.message);
    } catch (error) {
        showMessage(error.message);
    }
};

// Login user
document.getElementById("loginForm").onsubmit = async (event) => {
    event.preventDefault();

    try {
        const data = await api("/api/login", {
            method: "POST",
            body: JSON.stringify({
                email: document.getElementById("loginEmail").value,
                password: document.getElementById("loginPassword").value
            })
        });

        document.getElementById("loginForm").reset();
        await openDashboard(data.name);
    } catch (error) {
        showMessage(error.message);
    }
};

// Show dashboard
async function openDashboard(name) {
    loginSection.classList.add("hidden");
    registerSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    document.getElementById("userName").textContent = name;
    showMessage("");

    await loadExpenses();
}

// Load expenses from MySQL through the API
async function loadExpenses() {
    try {
        expenses = await api("/api/expenses");
        displayExpenses();
    } catch (error) {
        showMessage(error.message);
    }
}

// Display expenses and calculate total
function displayExpenses() {
    expenseList.replaceChildren();

    let total = 0;

    if (expenses.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No expenses yet. Add your first expense!";
        expenseList.appendChild(empty);
    }

    expenses.forEach((expense) => {
        total += Number(expense.amount);

        const item = document.createElement("div");
        item.className = "expenseItem";

        const title = document.createElement("h3");
        title.textContent = expense.title;

        const details = document.createElement("p");
        details.textContent =
            expense.category + " | " + expense.expense_date;

        const amount = document.createElement("p");
        amount.textContent =
            "Amount: ₹" + Number(expense.amount).toFixed(2);

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.className = "editBtn";
        edit.onclick = () => editExpense(expense);

        const remove = document.createElement("button");
        remove.textContent = "Delete";
        remove.className = "deleteBtn";
        remove.onclick = () => deleteExpense(expense.id);

        item.append(title, details, amount, edit, remove);
        expenseList.appendChild(item);
    });

    document.getElementById("total").textContent =
        "₹" + total.toFixed(2);
}

// Add or update an expense
expenseForm.onsubmit = async (event) => {
    event.preventDefault();

    const id = document.getElementById("expenseId").value;

    const expense = {
        title: document.getElementById("title").value,
        amount: document.getElementById("amount").value,
        category: document.getElementById("category").value,
        expense_date: document.getElementById("expenseDate").value
    };

    try {
        const url = id ? "/api/expenses/" + id : "/api/expenses";
        const method = id ? "PUT" : "POST";

        const data = await api(url, {
            method: method,
            body: JSON.stringify(expense)
        });

        resetExpenseForm();
        showMessage(data.message);
        await loadExpenses();
    } catch (error) {
        showMessage(error.message);
    }
};

// Fill form for editing
function editExpense(expense) {
    document.getElementById("expenseId").value = expense.id;
    document.getElementById("title").value = expense.title;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category;

    // Convert database date to YYYY-MM-DD
    document.getElementById("expenseDate").value =
        String(expense.expense_date).slice(0, 10);

    document.getElementById("formTitle").textContent = "Edit Expense";
    document.getElementById("saveBtn").textContent = "Update Expense";
    document.getElementById("cancelEdit").classList.remove("hidden");

    expenseForm.scrollIntoView({ behavior: "smooth" });
}

// Delete an expense
async function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }

    try {
        const data = await api("/api/expenses/" + id, {
            method: "DELETE"
        });

        showMessage(data.message);
        await loadExpenses();
    } catch (error) {
        showMessage(error.message);
    }
}

// Reset form after adding, updating or cancelling
function resetExpenseForm() {
    expenseForm.reset();
    document.getElementById("expenseId").value = "";
    document.getElementById("formTitle").textContent = "Add an Expense";
    document.getElementById("saveBtn").textContent = "Add Expense";
    document.getElementById("cancelEdit").classList.add("hidden");
    document.getElementById("expenseDate").value =
        new Date().toLocaleDateString("en-CA");
}

document.getElementById("cancelEdit").onclick = resetExpenseForm;

// Logout
document.getElementById("logoutBtn").onclick = async () => {
    try {
        await api("/api/logout", { method: "POST" });

        expenses = [];
        dashboard.classList.add("hidden");
        registerSection.classList.add("hidden");
        loginSection.classList.remove("hidden");

        resetExpenseForm();
        showMessage("Logged out successfully");
    } catch (error) {
        showMessage(error.message);
    }
};

// Check if the user already has a session
async function checkSession() {
    resetExpenseForm();

    try {
        const data = await api("/api/me");
        await openDashboard(data.name);
    } catch (error) {
        loginSection.classList.remove("hidden");
    }
}

checkSession();
