// script.js - Retail Price Tracker Tool

const priceForm = document.getElementById('priceForm');
const priceTable = document.getElementById('priceTable').getElementsByTagName('tbody')[0];
const supplierInput = document.getElementById('supplier');
const itemInput = document.getElementById('item');
const priceInput = document.getElementById('price');
const successSound = document.getElementById('successSound');
let priceData = JSON.parse(localStorage.getItem('priceData') || '[]');
let priceHistory = JSON.parse(localStorage.getItem('priceHistory') || '{}');
let editIndex = null;

function playSuccess() {
    successSound.currentTime = 0;
    successSound.play();
}

function saveData() {
    localStorage.setItem('priceData', JSON.stringify(priceData));
    localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
}

function renderTable() {
    priceTable.innerHTML = '';
    priceData.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.supplier}</td>
            <td>${row.item}</td>
            <td>$${row.price.toFixed(2)}</td>
            <td>${new Date(row.updated).toLocaleString()}</td>
            <td class="actions">
                <button class="action-btn" onclick="editRow(${idx})">✏️</button>
                <button class="action-btn" onclick="deleteRow(${idx})">🗑️</button>
            </td>
        `;
        if (row.priceChange === 'up') tr.classList.add('price-up');
        if (row.priceChange === 'down') tr.classList.add('price-down');
        priceTable.appendChild(tr);
    });
}

window.editRow = function(idx) {
    const row = priceData[idx];
    supplierInput.value = row.supplier;
    itemInput.value = row.item;
    priceInput.value = row.price;
    editIndex = idx;
}

window.deleteRow = function(idx) {
    if (confirm('Delete this entry?')) {
        priceData.splice(idx, 1);
        saveData();
        renderTable();
        renderChart();
    }
}

priceForm.onsubmit = function(e) {
    e.preventDefault();
    const supplier = supplierInput.value.trim();
    const item = itemInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!supplier || !item || isNaN(price)) return;
    const now = Date.now();
    let priceChange = null;
    if (editIndex !== null) {
        const prev = priceData[editIndex];
        priceChange = price > prev.price ? 'up' : price < prev.price ? 'down' : null;
        priceData[editIndex] = { supplier, item, price, updated: now, priceChange };
        // Update history
        const key = supplier + '|' + item;
        if (!priceHistory[key]) priceHistory[key] = [];
        priceHistory[key].push({ price, updated: now });
        editIndex = null;
    } else {
        // Check if entry exists
        const idx = priceData.findIndex(r => r.supplier === supplier && r.item === item);
        if (idx !== -1) {
            const prev = priceData[idx];
            priceChange = price > prev.price ? 'up' : price < prev.price ? 'down' : null;
            priceData[idx] = { supplier, item, price, updated: now, priceChange };
            const key = supplier + '|' + item;
            if (!priceHistory[key]) priceHistory[key] = [];
            priceHistory[key].push({ price, updated: now });
        } else {
            priceData.push({ supplier, item, price, updated: now, priceChange: null });
            const key = supplier + '|' + item;
            if (!priceHistory[key]) priceHistory[key] = [];
            priceHistory[key].push({ price, updated: now });
        }
    }
    saveData();
    renderTable();
    renderChart();
    playSuccess();
    priceForm.reset();
}

function renderChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (window.priceChartInstance) window.priceChartInstance.destroy();
    // Show price history for the first item in the table
    if (priceData.length === 0) return ctx.clearRect(0,0,400,200);
    const { supplier, item } = priceData[0];
    const key = supplier + '|' + item;
    const history = priceHistory[key] || [];
    window.priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => new Date(h.updated).toLocaleDateString()),
            datasets: [{
                label: `${supplier} - ${item} Price History`,
                data: history.map(h => h.price),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: { beginAtZero: true }
            },
            animation: {
                duration: 900,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Initial render
renderTable();
renderChart();
