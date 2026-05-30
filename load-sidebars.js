// ======== UNIVERSAL MEMORY MANAGERS ========
function loadData(key, defaultTemplate) {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultTemplate;
    
    try {
        // Try to translate it as a complex object/array
        const parsed = JSON.parse(stored);
        
        // Merge objects to protect against future updates
        if (typeof defaultTemplate === 'object' && !Array.isArray(defaultTemplate)) {
            return { ...defaultTemplate, ...parsed };
        }
        return parsed;
        
    } catch (error) {
        // SAFETY NET: If it crashes (because it's a plain word like "index.html"),
        // just return the raw text!
        return stored;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ==================== Left Sidebar functions ====================
// ======== blinkies strip ========
function initBlinkieStrip() {
    const stripContent = document.getElementById('blinkieStripContent');
    const toggleBtn = document.querySelector('.strip-toggle');
    if (!stripContent || !toggleBtn) return;

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stripContent.classList.toggle('open');
        toggleBtn.textContent = stripContent.classList.contains('open') ? '< Close blinkie strip' : '> Open blinkie strip';
    });
}

// ==================== Right sidebar functions ====================
// ======== ITEM DATABASE ========
const itemDatabase = {
    key:      { name:'Key',      desc:'Opens mysterious doors',      img:'../assets/key.png' },
    compass:  { name:'Compass',  desc:'Points to hidden treasures',  img:'../assets/compass.png', slot: 'offHand' },
    map:      { name:'Map',      desc:'Unlocks the minimap',         img:'../assets/map-item.png' },
    backpack: { name:'Backpack', desc:'Allows you to carry items',   img:'../assets/backpack.png' },
    pickaxe:  { name:'Pickaxe',  desc:'Used to mine ores',           img:'../assets/pickaxe.png', slot: 'mainHand' },
    satchel:  { name:'Satchel',  desc:'Holds heavy ores and ingots', img:'../assets/satchel.png' }
};

// ======== DEFAULT STARTING DATA ========
const DEFAULT_SATCHEL = {
    ores: { iron: 0, copper: 0, tin: 0 },
    ingots: { iron: [], copper: [], tin: [] }
};

const DEFAULT_EQUIPMENT = {
    head: null, chest: null, legs: null, boots: null,
    hands: null, mainHand: null, offHand: null, 
    necklace: null, ring: null, potion: null
};

// ======== INVENTORY VISIBILITY & INTERACTION ========
function updateInventoryVisibility() {
    const items = loadData('collectedItems', []); // Check the main array
    
    const backpackSection = document.getElementById('backpackSection'); // Find the Backpack UI wrapper
    const satchelSection = document.getElementById('satchelSection');   // Find the Satchel UI wrapper
    
    // Toggle the 'locked' class based on whether the array DOES NOT include the item
    if (backpackSection) backpackSection.classList.toggle('locked', !items.includes('backpack'));
    if (satchelSection) satchelSection.classList.toggle('locked', !items.includes('satchel'));
}

// Make the Satchel slot clickable to reveal a pop-up window
function initSatchelInteraction() {
    const satchelSlot = document.getElementById('satchelSlot'); 		// The small clickable icon
    const satchelPopup = document.getElementById('satchelPopup');		// The hidden popup menu

    if (satchelSlot && satchelPopup) {
        
        // 1. Toggle the pop-up when clicking the satchel icon
        satchelSlot.addEventListener('click', (e) => {
            e.stopPropagation();                            // CRITICAL: Stops this click from triggering the document listener below
            const items = loadData('collectedItems', []);
            if (items.includes('satchel')) {
                satchelPopup.classList.toggle('hidden');         // Open menu if closed, close if open
            } else {
                showTemporaryMessage("You haven't found the Satchel yet."); // Warn the player if they don't own it
            }
        });

        // 2. Prevent clicks INSIDE the pop-up from accidentally closing it
        satchelPopup.addEventListener('click', (e) => {
            e.stopPropagation();                                 // Keeps clicks on items from bubbling up and closing the menu
        });

        // 3. Listen to the entire document: Close the pop-up if clicking outside
        document.addEventListener('click', (e) => {              // Listen for ANY click anywhere on the webpage
            if (!satchelPopup.classList.contains('hidden')) {    // Is the popup currently open?
                if (e.target !== satchelSlot) {                  // Did the player click somewhere OTHER than the satchel icon?
                    satchelPopup.classList.add('hidden');        // If yes, hide the menu
                }
            }
        });
    }
}

// ======== MINIMAP VISIBILITY ========
function updateMinimapVisibility() {
    const minimapContainer = document.getElementById('minimapContainer'); // Find the minimap wrapper in the HTML
    if (minimapContainer) {                                               // Safety check: only run if the container exists
        const items = loadData('collectedItems', []);                               // Grab the player's inventory array
        // Ternary operator: If inventory has 'map', set display to 'block' (visible). Otherwise, set to 'none' (hidden).
        minimapContainer.style.display = items.includes('map') ? 'block' : 'none';
    }
}

// ======== TEMPORARY POP-UP MESSAGE ========
function showTemporaryMessage(text, duration = 5000) {					  // duration defaults to 5000ms (5 seconds) if not specified.
    const existing = document.getElementById('tempMessage');              // Look for an already active message on the screen
    if (existing) existing.remove();                                      // Delete the old one so messages don't stack up 

    const msg = document.createElement('div');                            // Create a new empty <div>
    msg.id = 'tempMessage';                                               // Give it an ID so we can find it later (line 15)
    msg.className = 'temp-message';                                       // Apply your CSS styles (the glowing gold border!)
    msg.textContent = text;                                               // Insert the custom text passed into the function
    
    document.body.appendChild(msg);                                       // Physically attach the message to the webpage
    
    setTimeout(() => msg.remove(), duration);                        // Wait for the duration to end, then delete the HTML element
}

// ======== RENDER INVENTORY ========
function renderInventory() {
    const container = document.getElementById('inventoryContainer');
    if (!container) return;
    container.innerHTML = ''; 

    // 1. Draw Base Items (Map, Compass, Pickaxe)
    const items = loadData('collectedItems', []);
    items.forEach(id => {
        if (id === 'backpack' || id === 'satchel') return;
        const item = itemDatabase[id];
        if (!item) return;

        const div = document.createElement('div');
        div.className = 'inventory-slot';
        div.style.cursor = 'pointer';
        div.innerHTML = `<img src="${item.img}" alt="${item.name}" style="pointer-events: none;">`;

        // Click to open menu!
        div.onclick = (e) => {
            // Reformat base item to look like gear for the engine
            const itemData = { id: id, name: item.name, icon: item.img, slot: item.slot, desc: item.desc };
            openContextMenu(e, 'base_item', id, itemData);
        };
        container.appendChild(div);
    });

    // 2. Draw Crafted Gear (Swords, Helmets) stored in the new 'unequippedGear' array
    const gearArray = loadData('unequippedGear', []);
    gearArray.forEach((gear, index) => {
        const div = document.createElement('div');
        div.className = 'inventory-slot';
        div.style.cursor = 'pointer';
        div.innerHTML = `<img src="../assets/${gear.icon}" alt="${gear.name}" style="pointer-events: none;">`;

        div.onclick = (e) => {
            openContextMenu(e, 'crafted_gear', index, gear);
        };
        container.appendChild(div);
    });
}

// ======== RENDER EQUIPMENT ========
function renderEquipment() {
    const equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT); 
    for (const [slot, gear] of Object.entries(equipment)) { 
        const slotElement = document.querySelector(`.equipment-part[data-slot="${slot}"]`); 
        if (!slotElement) continue; 
        
        if (gear) { 
            slotElement.innerHTML = `
                <img src="${gear.icon.includes('/') ? gear.icon : '../assets/' + gear.icon}" style="width:32px; height:auto; pointer-events:none;">
                <span style="font-size:10px; pointer-events:none;">${gear.name}</span>
            `; 
            slotElement.classList.remove('plain-slot'); 
            slotElement.classList.add('equipped-slot');
            slotElement.style.cursor = 'pointer';

            // Click an equipped item to open the menu!
            slotElement.onclick = (e) => openContextMenu(e, 'equipped', slot, gear);
        } else {
            slotElement.innerHTML = slot.charAt(0).toUpperCase() + slot.slice(1); 
            slotElement.classList.add('plain-slot'); 
            slotElement.classList.remove('equipped-slot'); 
            slotElement.style.cursor = 'default';
            slotElement.onclick = null; // Remove click event if empty
        }
    }
}

// ==================== INVENTORY CONTEXT MENU ====================
let currentContext = null; // Memory for what item we are currently interacting with

function openContextMenu(event, itemType, locator, itemData) {
    event.stopPropagation();
    currentContext = { type: itemType, locator: locator, data: itemData };

    let menu = document.getElementById('itemContextMenu');
    if (!menu) {
        // Automatically build the HTML if it doesn't exist yet
        menu = document.createElement('div');
        menu.id = 'itemContextMenu';
        menu.className = 'context-menu hidden';
        document.body.appendChild(menu);
    }

    // Determine what Button 1 should do based on where the item currently is
    let btn1HTML = '';
    if (itemType === 'equipped') {
        btn1HTML = `<button class="ui-button" onclick="actionUnequip()">Put in Inventory</button>`;
    } else {
        // If it's in the inventory, check if it is actually equippable!
        if (itemData.slot) {
            btn1HTML = `<button class="ui-button success" onclick="actionEquip()">Equip Item</button>`;
        } else {
            btn1HTML = `<button class="ui-button" disabled>Cannot Equip</button>`;
        }
    }

    // Inject the buttons
    menu.innerHTML = `
        <div style="font-weight: bold; border-bottom: 1px solid gray; margin-bottom: 5px; padding-bottom: 5px; color: gold;">${itemData.name}</div>
        ${btn1HTML}
        <button class="ui-button" onclick="actionInfo()">More Information</button>
        <button class="ui-button danger" onclick="actionDiscard()">Discard Item</button>
    `;

    // Position the menu exactly at the mouse cursor
    menu.style.left = `${event.pageX + 10}px`;
    menu.style.top = `${event.pageY + 10}px`;
    menu.classList.remove('hidden');
}

// Hide the menu if the player clicks anywhere else on the screen
document.addEventListener('click', () => {
    const menu = document.getElementById('itemContextMenu');
    if (menu) menu.classList.add('hidden');
});

// --- MENU ACTIONS ---
function actionUnequip() {
    const slot = currentContext.locator;
    const gear = currentContext.data;

    // 1. Remove from body
    let equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT);
    equipment[slot] = null;
    saveData('playerEquipment', equipment);

    // 2. Put back in inventory
    if (currentContext.data.quality) {
        let gearInv = loadData('unequippedGear', []);
        gearInv.push(gear);
        saveData('unequippedGear', gearInv);
    } else {
        let baseInv = loadData('collectedItems', []);
        if (!baseInv.includes(gear.id)) baseInv.push(gear.id);
        saveData('collectedItems', baseInv);
    }

    renderEquipment();
    renderInventory();
    showTemporaryMessage(`Unequipped the ${gear.name}.`);
}

function actionEquip() {
    const targetSlot = currentContext.data.slot;
    const newGear = currentContext.data;
    
    let equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT);
    const oldGear = equipment[targetSlot]; // Check if they are already wearing something

    // 1. Remove the NEW gear from the inventory
    if (currentContext.type === 'crafted_gear') {
        let gearInv = loadData('unequippedGear', []);
        gearInv.splice(currentContext.locator, 1);
        saveData('unequippedGear', gearInv);
    } else if (currentContext.type === 'base_item') {
        let baseInv = loadData('collectedItems', []);
        baseInv = baseInv.filter(id => id !== currentContext.locator);
        saveData('collectedItems', baseInv);
    }

    // 2. Put the OLD gear into the inventory (The Swap!)
    if (oldGear) {
        if (oldGear.quality) { 
            // It's a crafted item, send it to the gear array
            let gearInv = loadData('unequippedGear', []);
            gearInv.push(oldGear);
            saveData('unequippedGear', gearInv);
        } else { 
            // It's a base item (like the compass), send it to the standard array
            let baseInv = loadData('collectedItems', []);
            if (!baseInv.includes(oldGear.id)) baseInv.push(oldGear.id);
            saveData('collectedItems', baseInv);
        }
        showTemporaryMessage(`Swapped ${oldGear.name} for ${newGear.name}!`);
    } else {
        showTemporaryMessage(`Equipped the ${newGear.name}!`);
    }

    // 3. Equip the new gear to the body
    equipment[targetSlot] = newGear;
    saveData('playerEquipment', equipment);

    renderEquipment();
    renderInventory();
}

function actionDiscard() {
    const name = currentContext.data.name;

    if (currentContext.type === 'equipped') {
        let equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT);
        equipment[currentContext.locator] = null;
        saveData('playerEquipment', equipment);
        renderEquipment();
    } else if (currentContext.type === 'crafted_gear') {
        let gearInv = loadData('unequippedGear', []);
        gearInv.splice(currentContext.locator, 1);
        saveData('unequippedGear', gearInv);
        renderInventory();
    } else if (currentContext.type === 'base_item') {
        let baseInv = loadData('collectedItems', []);
        baseInv = baseInv.filter(id => id !== currentContext.locator);
        saveData('collectedItems', baseInv);
        renderInventory();
    }
    showTemporaryMessage(`Threw away the ${name}.`);
}

function actionInfo() {
    if (currentContext.data.desc) {
        showTemporaryMessage(currentContext.data.desc);
    } else if (currentContext.data.quality) {
        showTemporaryMessage(`Quality: ${currentContext.data.quality}%. Forged at the Smithy.`);
    } else {
        showTemporaryMessage("A piece of equipment.");
    }
}

// ======== RENDER SATCHEL CONTENTS ========
function renderSatchel() {
    const container = document.getElementById('satchelContents');
    if (!container) return;

    const data = loadData('satchelData', DEFAULT_SATCHEL);
    container.innerHTML = '';       // Wipe old contents off the screen

    // 1. Draw Ores
    Object.entries(data.ores).forEach(([type, count]) => {
        if (count > 0) {
            const displayName = type.charAt(0).toUpperCase() + type.slice(1);
            
            // Inject the HTML directly!
            container.innerHTML += `
                <div class="inventory-slot">
                    <img src="../assets/${type}_ore.png" alt="${type} ore">
                    <div class="quantity-badge">${count}</div>
                    <div class="tooltip">${count} ${displayName} Ore</div>
                </div>
            `;
        }
    });

    // 2. Draw Ingots (Stacked with custom quality tooltips)
    Object.entries(data.ingots).forEach(([type, ingotArray]) => {
        if (ingotArray.length > 0) {
            const displayName = type.charAt(0).toUpperCase() + type.slice(1);
            
            // First, calculate the colorful quality percentages for the tooltip
            let qualitySpans = '';
            ingotArray.forEach(ingot => {
                let q = ingot.quality;
                // A quick "ternary operator" to decide the color in one line!
                let color = q >= 101 ? '#d000ff' : `hsl(${Math.floor((q / 100) * 120)}, 100%, 50%)`;
                qualitySpans += `<span style="color: ${color}; font-weight:bold; margin: 0 2px;">${q}%</span>`;
            });

            // Now, inject the entire ingot slot!
            container.innerHTML += `
                <div class="inventory-slot">
                    <img src="../assets/${type}_ingot.png" alt="${type} ingot">
                    <div class="quantity-badge">${ingotArray.length}</div>
                    <div class="tooltip">
                        <div style="margin-bottom:3px; border-bottom:1px solid #777;">${displayName} Ingot(s)</div>
                        ${qualitySpans}
                    </div>
                </div>
            `;
        }
    });
}


// ======== CRAFTING API HELPERS ========
function addOre(type, amount) {
    let data = loadData('satchelData', DEFAULT_SATCHEL);
    if (data.ores[type] !== undefined) {
        data.ores[type] += amount;
        saveData('satchelData', data);
        renderSatchel(); // Visually update the sidebar!
    }
}

function removeOre(type, amount) {
    let data = loadData('satchelData', DEFAULT_SATCHEL);
    if (data.ores[type] >= amount) {
        data.ores[type] -= amount;
        saveData('satchelData', data);
        renderSatchel();
        return true;
    }
    return false; // Not enough ore
}

function addIngot(type, quality) {
    let data = loadData('satchelData', DEFAULT_SATCHEL);
    if (data.ingots[type]) {
        data.ingots[type].push({ quality: quality });
        saveData('satchelData', data);
        renderSatchel();
    }
}

function equipItem(slot, gearItem) {
    let data = loadData('playerEquipment', DEFAULT_EQUIPMENT);
    if (data.hasOwnProperty(slot)) {
        data[slot] = gearItem;
        saveData('playerEquipment', data);
        renderEquipment();
    }
}

// ======== SAFE EQUIPMENT HANDLER ========
let pendingEquip = null; // Memory variable to hold the item while the player decides

function promptEquipItem(slot, newGear) {
    let data = loadData('playerEquipment', DEFAULT_EQUIPMENT);
    // 1. If the slot is empty, equip it immediately!
    if (!data[slot]) {
        equipItem(slot, newGear);
        showTemporaryMessage(`Equipped the ${newGear.name}!`);
        return;
    }

    // 2. If the slot is occupied, remember the new gear and show the HTML modal
    pendingEquip = { slot: slot, newGear: newGear };
    const existingItem = data[slot];
    // Inject the names into the HTML
    document.getElementById('existingGearText').textContent = `[ ${existingItem.name} ]`;
    document.getElementById('newGearText').textContent = `[ ${newGear.name} ]?`;

    // Unhide the modal
    document.getElementById('equipWarningModal').classList.remove('hidden');
}

// 3. Button Click Listeners (Attach these once when the sidebar loads)
function initEquipModalListeners() {
    const cancelBtn = document.getElementById('cancelEquipBtn');
    const confirmBtn = document.getElementById('confirmEquipBtn');
    const modal = document.getElementById('equipWarningModal');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            pendingEquip = null; // Wipe memory
            showTemporaryMessage("You kept your original equipment.");
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (pendingEquip) {
                equipItem(pendingEquip.slot, pendingEquip.newGear);
                showTemporaryMessage(`Replaced old gear with ${pendingEquip.newGear.name}!`);
                pendingEquip = null; // Wipe memory
            }
            modal.classList.add('hidden');
        });
    }
}


// ======== HIDE ALREADY COLLECTED ITEMS ========
function hideCollectedItems() {
    const collected = loadData('collectedItems', []);
    
    document.querySelectorAll('.collectible').forEach(el => {
        // If the item's ID is in the player's inventory, hide it!
        if (collected.includes(el.dataset.id)) {
            el.style.display = 'none';
        }
    });
}

// ======== CLICK HANDLERS FOR COLLECTIBLES ========
function initCollectibles() {
    document.querySelectorAll('.collectible').forEach(el => {
        el.addEventListener('click', e => {
            e.stopPropagation();
            const { id, name, desc } = el.dataset;
            if (addItemToInventory(id, name, desc)) {
                el.style.display = 'none';
            }
        });
    });
}

// ======== ADD ITEM TO INVENTORY ========
function addItemToInventory(itemId) {
    const items = loadData('collectedItems', []); 
    const equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT);
    const itemData = itemDatabase[itemId];

    if (itemId !== 'backpack' && !items.includes('backpack')) {
        showTemporaryMessage("You found this item but you do not have the means to carry it yet.");
        return false;
    }

    // --- SMART AUTO-EQUIP LOGIC ---
    // If the item has a designated body slot, and the player's slot is empty...
    if (itemData && itemData.slot && !equipment[itemData.slot]) {
        // Reformat it into a "gear" object and equip it immediately!
        const gearObj = { id: itemId, name: itemData.name, icon: itemData.img, slot: itemData.slot, desc: itemData.desc };
        equipItem(itemData.slot, gearObj);
        
        showTemporaryMessage(`Auto-equipped the ${itemData.name}!`);
        addExpPoint(25);
        return true; 
    }

    // --- STANDARD INVENTORY LOGIC ---
    if (!items.includes(itemId)) {
        items.push(itemId);
        saveData('collectedItems', items);
        
        renderInventory();
        updateInventoryVisibility();
        addExpPoint(25);
        if (itemId === 'map') updateMinimapVisibility();
        
        return true;
    }
    return false; 
}

// ======== DAILY TIP ========
function getSpecialTip() {
    const startDate = new Date(2025, 1, 25);
    const birthday = new Date(1999, 11, 27);
    const today = new Date();

    if (today.getDate() === startDate.getDate()) {
        let monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 +
                         (today.getMonth() - startDate.getMonth());
        if (monthsDiff > 0) {
            return `This website is ${monthsDiff} month${monthsDiff !== 1 ? 's' : ''} old today!`;
        }
    }
    if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
        return `Today is Jannes's birthday!`;
    }
    return null;
}

function updateDailyTip() {
    const tipElement = document.getElementById('dailyTipText');
    if (!tipElement) return;

    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('dailyTipDate');
    let tipText = localStorage.getItem('dailyTipText');
    
    if (storedDate !== today) {
        const special = getSpecialTip();
        if (special) {
            tipText = special;
        } else {
            const tips = [
                // exp related tips
                "Daily login gives bonus EXP!",
                "Visit new places to get more EXP points!",
                "Discover secrets for extra points!",
                "Interacting with the website give EXP!",
                // navigation related tips
                "Check the map to navigate!",
                "Use the arrows for easy navigation!",
                "Use the left sidebar menu for navigation!",
                "Use the arrow keys on your keyboard to navigate!",
                // item and collectibles related tips
                "Find the backpack to carry items!",
                "Pick up the map item to unlock the minimap!",
                "Collect items to unlock new areas!",
                "Equip the satchel to carry ores and ingots!",
                "Picking up the pickaxe allows you to mine ores!",
                "Equipment is stored in the equipment slots!",
                // funcionality related tips
                "You can leave a message in my guestbook or chatbox!",
                "Take a look at the blinkies!",
                "Look at the notice board for changes and future updates!",
                "Read my goals with this website!",
                "This Message changes every day!",
                "Reset all EXP and collectibles by pressing the red button!",
                "Click the satchel to see what you collected!",
                "Play a mining minigame in the mine!",
                "Play a smelting minigame in the smeltery!",
                // pages related tips
                "Visit the tavern to get a drink!",
                "Visit the gardens!",
                "Visit the market!",
                "See all the rooms in the castle from the hallway!",
                "Enter the old computer from the office!",
                "Open the old computer to read blogs and reviews!",
                "Go take a look behind the scenes!",
                "Find all my socials in the old computer",
                "Read my blogs in the old computer!",
                "Read my reviews in the old computer!",
                "Read about my projects in the old computer!",
                "Visit the campfire to chat with other travellers!",
                "Visit the mine to find ores!",
                "Visit the smithy to make ingots from your ores!",
                "Visit the blacksmith to make equipment!"
            ];
            const randomIndex = Math.floor(Math.random() * tips.length);
            tipText = tips[randomIndex];
        }
        localStorage.setItem('dailyTipDate', today);
        localStorage.setItem('dailyTipText', tipText);
    }
    tipElement.textContent = tipText;
}

// ==================== INIT AFTER SIDEBAR LOADS ====================
function initInventoryAfterSidebar() {
    renderInventory();
    renderSatchel();
    renderEquipment();
    hideCollectedItems();
    initCollectibles();
    updateInventoryVisibility();
    updateMinimapVisibility();
    initSatchelInteraction();
}

// ==================== RESET ALL PROGRESS ====================
function resetAllItems() {
    localStorage.clear();
    location.reload();
}

// ==================== MUSIC PLAYER ====================
function initMusicPlayer() {
    const audio = document.getElementById('bgMusic');
    const toggleBtn = document.getElementById('muteToggle');
    if (!audio || !toggleBtn) return;

    toggleBtn.textContent = audio.muted ? '🔇 Unmute Music' : '🔊 Mute Music';
    toggleBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        toggleBtn.textContent = audio.muted ? '🔇 Unmute Music' : '🔊 Mute Music';
    });
}

// ==================== SIDEBAR LOADER ====================
function loadSidebar(elementId, filePath) {
    return fetch(filePath)
        .then(response => response.text())
        .then(data => document.getElementById(elementId).innerHTML = data);
}

// ==================== NAVIGATION (CLICK & KEYBOARD) ====================
const activeKeys = new Set();   // Global memory of keys currently held down
let moveTimeout = null;         // Timer for the 75ms input grace period

function initArrowNavigation() {
    const arrowsData = document.body.getAttribute('data-arrows');
    if (!arrowsData) return;    // Abort if this page doesn't have navigation set up
    const mappings = JSON.parse(arrowsData); // Convert the HTML string into a usable JS object

    // 1. Setup the visual on-screen arrows
    Object.entries(mappings).forEach(([arrowId, config]) => {
        const link = document.getElementById(arrowId);
        if (link) {
            link.href = config.href; // Apply the destination URL
            const tooltipSpan = link.querySelector('.tooltip');
            if (tooltipSpan) tooltipSpan.textContent = config.tooltip; // Apply the hover text
        }
    });

    // 2. Listen for keys being PRESSED
    document.addEventListener('keydown', (event) => {
        if (activeKeys.has(event.key)) return;	// Ignore if key is already held (prevents timer reset)
        activeKeys.add(event.key);				// Put the new key in the activeKeys memory
        if (moveTimeout) clearTimeout(moveTimeout); // To prevent more than two keys being pressed within 75ms window
        // Wait 75 milliseconds before actually moving to see if a second key drops in
        moveTimeout = setTimeout(() => {
            let x = 0; // -1 is Left, 1 is Right
            let y = 0; // -1 is Up, 1 is Down

            // Calculate the movement vector based on what is currently in the backpack
            if (activeKeys.has('ArrowUp')) y -= 1;
            if (activeKeys.has('ArrowDown')) y += 1;
            if (activeKeys.has('ArrowLeft')) x -= 1;
            if (activeKeys.has('ArrowRight')) x += 1;

            // Dictionary mapping the final X/Y coordinates to our HTML IDs
            const vectorMap = {
                '0,-1': 'arrow-up-link',
                '0,1':  'arrow-down-link',
                '-1,0': 'arrow-left-link',
                '1,0':  'arrow-right-link',
                '1,-1': 'arrow-upright-link',
                '-1,-1':'arrow-upleft-link',
                '1,1':  'arrow-downright-link',
                '-1,1': 'arrow-downleft-link'
            };
            
            const targetId = vectorMap[`${x},${y}`];	// Combine X and Y into a string (e.g., "1,-1") and look up the ID
            
            // If the ID matches a direction defined in our <body> data...
            if (targetId && mappings[targetId]) {
                const targetHref = mappings[targetId].href;
                
                // ...and that direction is a real destination (not a '#' placeholder)
                if (targetHref && targetHref !== '#') {
                    activeKeys.clear(); // Wipe inputs so they don't get stuck during page load
                    window.location.href = targetHref; // Teleport the player!
                }
            }
        }, 75); // Grace period for rolling key presses
    });

    // 3. Listen for keys being RELEASED
    document.addEventListener('keyup', (event) => {
        activeKeys.delete(event.key); // Remove the key from memory when the player lets go
    });
}

// ==================== STARTUP ====================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Grab the raw path (e.g., "/", "/market", or "/market/")
    let path = window.location.pathname;
    
    // 2. Chop off the trailing slash if Cloudflare added one
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    
    // 3. Extract the clean word, strip .html, and default to 'index'
    let currentId = path.split('/').pop().replace('.html', '') || 'index';
    
    // ONLY save the location if we are NOT looking at the map
    if (currentId !== 'map') {
        
        saveData('currentLocation', currentId);
        
        let visitedPages = loadData('visitedPages', []);
        if (!Array.isArray(visitedPages)) visitedPages = []; // Safety net
        
        if (!visitedPages.includes(currentId)) {
            visitedPages.push(currentId);
            saveData('visitedPages', visitedPages);
        }
    }

    loadSidebar('left-sidebar', 'sidebar_left.html')
      .then(() => { initBlinkieStrip(); });
      
    loadSidebar('right-sidebar', 'sidebar_right.html')
      .then(() => {
        initInventoryAfterSidebar();
        if (typeof displayExpPoint === 'function') displayExpPoint();
        if (typeof initXPClickables === 'function') initXPClickables();
        updateDailyTip();
        initMusicPlayer();
        initArrowNavigation();
      });
});