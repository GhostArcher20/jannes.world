// ==================== XP CONFIGURATION ====================
// Central databank for all XP rewards. Edit these numbers to balance
const XP_REWARDS = {
    visitPage: 1,         // XP for simply loading a page
    firstVisit: 10,       // XP for discovering a page for the first time
    dailyLogin: 50,       // XP for the first login of the day
    perMinute: 1,         // XP awarded every 60 seconds spent on the site
    secretClickMin: 1,    // Minimum XP for clicking a secret item
    secretClickMax: 3,    // Maximum XP for clicking a secret item
    mineOre: 5,           // XP for successfully picking up mined ore
    smeltIngot: 15,       // XP for successfully forging an ingot
    findItem: 25          // XP for finding a unique item/tool (e.g., pickaxe)
};

// ==================== CORE XP FUNCTIONS ====================
function getExpPoint() {
    const xp = localStorage.getItem('expPoint');
    return xp ? parseInt(xp) : 0;
}

function saveExpPoint(xp) {
    localStorage.setItem('expPoint', xp);
    displayExpPoint();                     // update UI after saving
}

function addExpPoint(amount) {
    const newXP = getExpPoint() + amount;
    saveExpPoint(newXP);
    showXpNotification(amount);            // show +X popup
    return newXP;
}

// ==================== XP DISPLAY (with scaling) ====================
function displayExpPoint() {
    const xp = getExpPoint();
    const counter = document.getElementById('expPointCounter');
    if (counter) counter.textContent = xp;

    const level = getLevel(xp);
    const xpInLevel = xp - totalXpForLevel(level);  
    const xpNeeded = xpForLevel(level);
    const percent = Math.floor((xpInLevel / xpNeeded) * 100);

    const xpBar = document.getElementById('xpBar');
    if (xpBar) xpBar.style.width = percent + '%';

    const levelDisplay = document.getElementById('levelDisplay');
    if (levelDisplay) levelDisplay.textContent = level;
}

// Helper to calculate total XP needed to reach a given level
function totalXpForLevel(level) {
    let total = 0;
    for (let i = 0; i < level; i++) total += xpForLevel(i);
    return total;
}

// ==================== LEVEL SCALING ====================
function xpForLevel(level) {
    return 100 * (level + 1);              // quadratic: 100, 200, 300…
}

function getLevel(xp) {
    let level = 0;
    let totalNeeded = 0;
    while (xp >= totalNeeded + xpForLevel(level)) {
        totalNeeded += xpForLevel(level);
        level++;
    }
    return level;
}

// ==================== NOTIFICATION ====================
function showXpNotification(amount) {
    const note = document.getElementById('xpNotification');
    if (!note) return;

    note.textContent = '+' + amount;
    note.style.opacity = '1';
    setTimeout(() => note.style.opacity = '0', 1500);
}

// ==================== XP EARNING TRIGGERS ====================
function addXPForVisit() {
    addExpPoint(XP_REWARDS.visitPage);     // Pull from databank

    const pageId = window.location.pathname;
    const visited = JSON.parse(localStorage.getItem('visitedPages') || '[]');
    if (!visited.includes(pageId)) {
        visited.push(pageId);
        localStorage.setItem('visitedPages', JSON.stringify(visited));
        addExpPoint(XP_REWARDS.firstVisit);// Pull from databank
    }
}

function checkDailyLogin() {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('lastLogin');
    if (lastLogin !== today) {
        localStorage.setItem('lastLogin', today);
        addExpPoint(XP_REWARDS.dailyLogin);// Pull from databank
    }
}

let timeInterval;
function startTimeOnPageTimer() {
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(() => addExpPoint(XP_REWARDS.perMinute), 60000); // Pull from databank
}

function initXPClickables() {
    document.querySelectorAll('.xp-click:not([data-xp-initialized])').forEach(el => {
        el.setAttribute('data-xp-initialized', 'true');
        el.addEventListener('click', () => {
            // Calculate random range using databank minimums and maximums
            const min = XP_REWARDS.secretClickMin;
            const max = XP_REWARDS.secretClickMax;
            const xp = Math.floor(Math.random() * (max - min + 1)) + min; 
            addExpPoint(xp);
        });
    });
}

// ==================== STARTUP ====================
document.addEventListener('DOMContentLoaded', () => {
    addXPForVisit();                       // visit + first‑visit
    checkDailyLogin();                     // daily login
    startTimeOnPageTimer();                // time‑on‑page
    displayExpPoint();                     // initial UI update
    initXPClickables();                    // surprise clicks
});