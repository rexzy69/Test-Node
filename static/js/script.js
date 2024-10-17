// DOM Elements
const urlInput = document.getElementById('urlInput');
const addButton = document.getElementById('addButton');
const blockedList = document.getElementById('blockedList');
const messageDiv = document.getElementById('message');

let blockedUrls = [];

// Load blocked URLs from server
async function loadBlockedUrls() {
    try {
        const response = await fetch('/get_blocked_urls');
        blockedUrls = await response.json();
        updateBlockedList();
    } catch (error) {
        console.error('Error loading blocked URLs:', error);
        showMessage('Error loading blocked URLs.', 'error');
    }
}

// Update blocked list in the UI
function updateBlockedList() {
    blockedList.innerHTML = '';
    blockedUrls.forEach((url) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center animate__animated animate__fadeIn';
        li.innerHTML = `
            ${url}
            <button class="btn btn-danger btn-sm remove-btn" data-url="${url}">Remove</button>
        `;
        blockedList.appendChild(li);
    });
}

// Add URL to blocked list
async function addUrl() {
    const url = urlInput.value.trim();
    if (url) {
        try {
            const response = await fetch('/add_url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            const data = await response.json();
            if (response.ok) {
                blockedUrls.push(url);
                updateBlockedList();
                urlInput.value = '';
                showMessage(data.message, 'success');
            } else {
                showMessage(data.error, 'warning');
            }
        } catch (error) {
            console.error('Error adding URL:', error);
            showMessage('Error adding URL.', 'error');
        }
    } else {
        showMessage('Please enter a valid URL.', 'error');
    }
}

// Remove URL from blocked list
async function removeUrl(url) {
    try {
        const response = await fetch('/remove_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (response.ok) {
            blockedUrls = blockedUrls.filter(u => u !== url);
            updateBlockedList();
            showMessage(data.message, 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error removing URL:', error);
        showMessage('Error removing URL.', 'error');
    }
}

// Show message
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `alert alert-${type} animate__animated animate__fadeIn`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.className = `alert alert-${type} animate__animated animate__fadeOut`;
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 500);
    }, 3000);
}

// Event Listeners
addButton.addEventListener('click', addUrl);

blockedList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const url = e.target.getAttribute('data-url');
        removeUrl(url);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadBlockedUrls);
