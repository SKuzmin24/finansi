let items = JSON.parse(localStorage.getItem("budget_v2")) || [];
let chart;

// Элементы интерфейса
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("category");
const addBtn = document.getElementById("addBtn");

const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const exportBtn = document.getElementById("exportBtn");

const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");
const listEl = document.getElementById("list");
const chartEl = document.getElementById("chart");

const themeToggle = document.getElementById("themeToggle");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const themeToggleText = document.getElementById("themeToggleText");

// Тема: применить и сохранить
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("budget_theme", theme);

    if (theme === "dark") {
        themeToggleIcon.textContent = "☀️";
        themeToggleText.textContent = "Светлая";
    } else {
        themeToggleIcon.textContent = "🌙";
        themeToggleText.textContent = "Тёмная";
    }

    if (chart) {
        drawChart(Number(incomeEl.innerText) || 0, Number(expenseEl.innerText) || 0);
    }
}

// Тема: инициализация при первом открытии
function initTheme() {
    const saved = localStorage.getItem("budget_theme");
    if (saved === "light" || saved === "dark") {
        applyTheme(saved);
        return;
    }

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
}

function addItem() {
    const parsedAmount = parseFloat(amountInput.value);
    const item = {
        id: Date.now(),
        desc: descInput.value.trim(),
        amount: parsedAmount,
        date: dateInput.value,
        type: typeSelect.value,
        category: categorySelect.value
    };

    if (!item.desc || Number.isNaN(item.amount) || item.amount <= 0) {
        alert("Введите описание и сумму больше нуля");
        return;
    }

    items.push(item);
    descInput.value = "";
    amountInput.value = "";
    dateInput.value = "";
    save();
}

function removeItem(id) {
    items = items.filter((i) => i.id !== id);
    save();
}

function save() {
    localStorage.setItem("budget_v2", JSON.stringify(items));
    render();
}

function getFiltered() {
    const t = filterType.value;
    const c = filterCategory.value;

    return items.filter(
        (i) => (t === "all" || i.type === t) && (c === "all" || i.category === c)
    );
}

function render() {
    listEl.innerHTML = "";

    let income = 0;
    let expense = 0;
    const data = getFiltered();

    data.forEach((i) => {
        if (i.type === "income") {
            income += i.amount;
        } else {
            expense += i.amount;
        }

        const row = document.createElement("div");
        row.className = "item";
        row.innerHTML = `
            <div>${i.desc}</div>
            <div>${i.category}</div>
            <div>${i.date || "-"}</div>
            <div class="${i.type === "income" ? "positive" : "negative"}">
                ${i.type === "income" ? "+" : "-"}${i.amount.toFixed(2)}
            </div>
            <div class="delete" data-id="${i.id}" title="Удалить">✖</div>
        `;
        listEl.appendChild(row);
    });

    const balance = income - expense;
    incomeEl.innerText = income.toFixed(2);
    expenseEl.innerText = expense.toFixed(2);
    balanceEl.innerText = balance.toFixed(2);

    drawChart(income, expense);
}

function drawChart(income, expense) {
    if (chart) chart.destroy();

    const styles = getComputedStyle(document.documentElement);
    const incomeColor = styles.getPropertyValue("--chart-income").trim();
    const expenseColor = styles.getPropertyValue("--chart-expense").trim();
    const textColor = styles.getPropertyValue("--chart-text").trim();

    chart = new Chart(chartEl, {
        type: "doughnut",
        data: {
            labels: ["Доход", "Расход"],
            datasets: [
                {
                    data: [income, expense],
                    backgroundColor: [incomeColor, expenseColor],
                    borderColor: [incomeColor, expenseColor],
                    borderWidth: 1
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    titleColor: textColor,
                    bodyColor: textColor
                }
            }
        }
    });
}

function exportCSV() {
    let csv = "Описание,Категория,Дата,Тип,Сумма\n";
    items.forEach((i) => {
        csv += `${i.desc},${i.category},${i.date},${i.type},${i.amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "budget.csv";
    a.click();
}

// Делегирование кликов по удалению
listEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("delete")) return;

    const id = Number(target.dataset.id);
    if (!Number.isNaN(id)) removeItem(id);
});

// Подписка на действия пользователя
addBtn.addEventListener("click", addItem);
filterType.addEventListener("change", render);
filterCategory.addEventListener("change", render);
exportBtn.addEventListener("click", exportCSV);
themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
});

// Старт приложения
initTheme();
render();
