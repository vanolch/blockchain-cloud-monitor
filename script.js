
const STORAGE_KEY = "blockchain_cloud_data";

let blockchain = [];

const initialTransactions = [
    {
        id: "TX-1001",
        sender: "0xA12F...91BC",
        receiver: "0xB82C...11DA",
        amount: 1.5,
        status: "Confirmed"
    },
    {
        id: "TX-1002",
        sender: "0xC31A...72EF",
        receiver: "0xD92B...31AC",
        amount: 0.75,
        status: "Confirmed"
    },
    {
        id: "TX-1003",
        sender: "0xE41D...82AB",
        receiver: "0xF72C...51DE",
        amount: 2.25,
        status: "Pending"
    },
    {
        id: "TX-1004",
        sender: "0xG52A...12CD",
        receiver: "0xH82B...92EF",
        amount: 0.3,
        status: "Confirmed"
    },
    {
        id: "TX-1005",
        sender: "0xJ12C...32AB",
        receiver: "0xK72D...82FE",
        amount: 4.1,
        status: "Rejected"
    }
];

async function calculateHash(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function createBlock(transaction, previousHash) {
    const block = {
        index: blockchain.length,
        timestamp: new Date().toISOString(),
        previousHash: previousHash,
        transaction: transaction
    };

    block.hash = await calculateHash(block);

    return block;
}

async function initializeBlockchain() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        blockchain = JSON.parse(savedData);
    } else {
        blockchain = [];

        let previousHash = "0";

        for (const transaction of initialTransactions) {
            const block = await createBlock(transaction, previousHash);
            blockchain.push(block);
            previousHash = block.hash;
        }

        saveBlockchain();
    }

    renderAll();
}

function saveBlockchain() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blockchain));
}

function shortenHash(hash) {
    return hash ? hash.substring(0, 14) + "..." : "—";
}

function renderTransactions() {
    const tableBody = document.querySelector("#transactionTable");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    blockchain.slice().reverse().forEach(block => {
        const transaction = block.transaction;

        const row = document.createElement("tr");

        const statusClass = {
            Confirmed: "status-confirmed",
            Pending: "status-pending",
            Rejected: "status-rejected"
        }[transaction.status] || "status-pending";

        row.innerHTML = `
            <td>#${block.index + 1}</td>
            <td class="address-cell"></td>
            <td class="address-cell"></td>
            <td>${Number(transaction.amount).toFixed(4)}</td>
            <td class="hash-cell">${shortenHash(block.hash)}</td>
            <td><span class="status ${statusClass}">${transaction.status}</span></td>
        `;

        row.children[1].textContent = transaction.sender;
        row.children[2].textContent = transaction.receiver;

        tableBody.appendChild(row);
    });
}

function renderChain() {
    const chainTrack = document.querySelector("#chainTrack");

    if (!chainTrack) return;

    chainTrack.innerHTML = "";

    blockchain.forEach((block, index) => {
        const card = document.createElement("div");
        card.className = "block-card";

        card.innerHTML = `
            <h4>Block #${block.index + 1}</h4>
            <p>Transaction: ${block.transaction.id}</p>
            <p>Amount: ${Number(block.transaction.amount).toFixed(4)}</p>
            <p class="block-hash">Hash: ${shortenHash(block.hash)}</p>
            <p>Previous: ${shortenHash(block.previousHash)}</p>
        `;

        chainTrack.appendChild(card);

        if (index < blockchain.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "chain-arrow";
            arrow.textContent = "→";
            chainTrack.appendChild(arrow);
        }
    });
}

function renderStatistics() {
    const total = blockchain.length;

    const confirmed = blockchain.filter(
        block => block.transaction.status === "Confirmed"
    ).length;

    document.querySelector("#blockCount").textContent = total;
    document.querySelector("#transactionCount").textContent = total;
    document.querySelector("#confirmedCount").textContent = confirmed;
}

function renderAll() {
    renderTransactions();
    renderChain();
    renderStatistics();
}

async function addTransaction(sender, receiver, amount) {
    const transaction = {
        id: "TX-" + Date.now(),
        sender: sender,
        receiver: receiver,
        amount: Number(amount),
        status: "Pending"
    };

    const previousHash = blockchain.length
        ? blockchain[blockchain.length - 1].hash
        : "0";

    const block = await createBlock(transaction, previousHash);

    blockchain.push(block);

    saveBlockchain();
    renderAll();
}

async function verifyBlockchain() {
    for (let i = 0; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];

        const blockData = {
            index: currentBlock.index,
            timestamp: currentBlock.timestamp,
            previousHash: currentBlock.previousHash,
            transaction: currentBlock.transaction
        };

        const recalculatedHash = await calculateHash(blockData);

        if (recalculatedHash !== currentBlock.hash) {
            return {
                valid: false,
                message: `Обнаружено изменение данных в блоке #${i + 1}.`
            };
        }

        if (i > 0 && currentBlock.previousHash !== blockchain[i - 1].hash) {
            return {
                valid: false,
                message: `Нарушена связь с предыдущим блоком #${i}.`
            };
        }
    }

    return {
        valid: true,
        message: "Целостность блокчейна подтверждена. Изменений не обнаружено."
    };
}

async function runSecurityCheck() {
    const resultElement = document.querySelector("#securityResult");

    resultElement.className = "security-result security-neutral";
    resultElement.textContent = "Выполняется проверка...";

    const result = await verifyBlockchain();

    resultElement.className = result.valid
        ? "security-result security-success"
        : "security-result security-error";

    resultElement.textContent = result.message;

    const integrityValue = document.querySelector("#integrityValue");

    if (integrityValue) {
        integrityValue.textContent = result.valid ? "Valid" : "Tampered";
    }
}

function showToast(message) {
    const toast = document.querySelector("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function openModal() {
    document.querySelector("#modal").classList.add("open");
}

function closeModal() {
    document.querySelector("#modal").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", async () => {
    await initializeBlockchain();

    document.querySelector("#openFormButton")
        ?.addEventListener("click", openModal);

    document.querySelector("#closeModal")
        ?.addEventListener("click", closeModal);

    document.querySelector("#cancelButton")
        ?.addEventListener("click", closeModal);

    document.querySelector("#verifyButton")
        ?.addEventListener("click", runSecurityCheck);

    document.querySelector("#verifyTopButton")
        ?.addEventListener("click", runSecurityCheck);

    document.querySelector("#transactionForm")
        ?.addEventListener("submit", async event => {
            event.preventDefault();

            const sender = document.querySelector("#senderInput").value.trim();
            const receiver = document.querySelector("#receiverInput").value.trim();
            const amount = Number(document.querySelector("#amountInput").value);

            if (!sender || !receiver || !Number.isFinite(amount) || amount <= 0) {
                showToast("Проверьте введённые данные.");
                return;
            }

            await addTransaction(sender, receiver, amount);

            event.target.reset();
            closeModal();

            showToast("Транзакция успешно добавлена.");
        });

    document.querySelector("#modal")
        ?.addEventListener("click", event => {
            if (event.target.id === "modal") {
                closeModal();
            }
        });
});
