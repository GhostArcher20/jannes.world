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
    key:      { name:'Key',      desc:'Opens mysterious doors',        img:'../assets/key.png' },
    compass:  { name:'Compass',  desc:'Points to hidden treasures',    img:'../assets/compass.png' },
    map:      { name:'Map',      desc:'Unlocks the minimap',           img:'../assets/map-item.png' },
    backpack: { name:'Backpack', desc:'Allows you to carry items',     img:'../assets/backpack.png' },
    pickaxe:  { name:'Pickaxe',  desc:'Used to mine ores',			   img:'../assets/pickaxe.png' },
    satchel:  { name:'Satchel',  desc:'Holds heavy ores and ingots',   img:'../assets/satchel.png' }
};

// ======== COLLECTED ITEMS ========
const STORAGE_KEY = 'collectedItems';
function loadCollectedItems() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}
function saveCollectedItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ======== CONTAINER FLAGS ========
const BACKPACK_KEY = 'hasBackpack';
const SATCHEL_KEY = 'hasSatchel';

function hasBackpack() { return localStorage.getItem(BACKPACK_KEY) === 'true'; }
function setBackpack(value) { localStorage.setItem(BACKPACK_KEY, value); }

function hasSatchel() { return localStorage.getItem(SATCHEL_KEY) === 'true'; }
function setSatchel(value) { localStorage.setItem(SATCHEL_KEY, value); }


// ======== JSON DATA MANAGERS ========
// --- Satchel Data ---
const SATCHEL_DATA_KEY = 'satchelData';                          // The exact name used to save/load from browser memory

function loadSatchelData() {
    const stored = localStorage.getItem(SATCHEL_DATA_KEY);       // Look for existing save data
    if (stored) return JSON.parse(stored);                       // If found, convert the string back into a usable JS object
    
    return {                                                     // If no save exists (new game), create a fresh empty slate
        ores: { iron: 0, copper: 0, tin: 0 },                    // Start with 0 of each ore
        ingots: { iron: [], copper: [], tin: [] }                // Start with empty arrays (because ingots have quality stats!)
    };
}

function saveSatchelData(data) {
    localStorage.setItem(SATCHEL_DATA_KEY, JSON.stringify(data));// Convert the object into a text string and save it to memory
}

// --- Equipment Data ---
const EQUIPMENT_KEY = 'playerEquipment';                         // The exact name used to save/load equipment

function loadEquipment() {
    const stored = localStorage.getItem(EQUIPMENT_KEY);          // Look for existing equipment save
    if (stored) return JSON.parse(stored);                       // Parse it if it exists
    
    return {                                                     // If new game, return an empty template
        head: null, chest: null, legs: null, boots: null,        // 'null' means the slot is empty
        hands: null, mainHand: null, offHand: null, 
        necklace: null, ring: null, potion: null
    };
}

function saveEquipment(data) {
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(data));   // Convert and save the equipment state
}


// ======== INVENTORY VISIBILITY & INTERACTION ========
function updateInventoryVisibility() {
    const backpackSection = document.getElementById('backpackSection'); // Find the Backpack UI wrapper
    if (backpackSection) {
        if (hasBackpack()) backpackSection.classList.remove('locked');  // Remove grayscale/CSS lock if owned
        else backpackSection.classList.add('locked');                   // Apply grayscale/CSS lock if missing
    }

    const satchelSection = document.getElementById('satchelSection');   // Find the Satchel UI wrapper
    if (satchelSection) {
        if (hasSatchel()) satchelSection.classList.remove('locked');    // Remove grayscale if owned
        else satchelSection.classList.add('locked');                    // Apply grayscale if missing
    }
}

// Make the Satchel slot clickable to reveal a pop-up window
function initSatchelInteraction() {
    const satchelSlot = document.getElementById('satchelSlot'); 		// The small clickable icon
    const satchelPopup = document.getElementById('satchelPopup');		// The hidden popup menu

    if (satchelSlot && satchelPopup) {
        
        // 1. Toggle the pop-up when clicking the satchel icon
        satchelSlot.addEventListener('click', (e) => {
            e.stopPropagation();                            // CRITICAL: Stops this click from triggering the document listener below
            if (hasSatchel()) {
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
        const items = loadCollectedItems();                               // Grab the player's inventory array
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
function renderInventory() {                                 // Function to build standard backpack items
    const container = document.getElementById('inventoryContainer'); // Find the HTML UI box
    if (!container) return;                                  // Abort if the box doesn't exist

    const items = loadCollectedItems();                      // Fetch the array of saved item IDs
    container.innerHTML = '';                                // Wipe old items off the screen

    items.forEach(id => {                                    // Loop through each item ID
        if (id === 'backpack') return;                       // Don't draw the backpack inside itself!
        const item = itemDatabase[id];                       // Look up the item's data in your database
        if (!item) return;                                   // Skip if data is missing

        const slot = document.createElement('div');          // Create the wrapper box
        slot.className = 'inventory-slot';                   // Apply CSS styling
        
        const img = document.createElement('img');           // Create the image element
        img.src = item.img;                                  // Apply the image path
        img.alt = item.name;                                 // Add alt text for accessibility
        slot.appendChild(img);                               // Put the image inside the wrapper

        const tt = document.createElement('div');            // Create the tooltip box
        tt.className = 'tooltip';                            // Apply tooltip CSS
        tt.textContent = `${item.name}: ${item.desc}`;       // tooltip is filled
        slot.appendChild(tt);                                // Put the tooltip inside the wrapper
        container.appendChild(slot);                         // Put the whole slot into the UI container
    });
}

// ======== RENDER SATCHEL CONTENTS ========
function renderSatchel() {                                   // Function to build ores and ingots
    const container = document.getElementById('satchelContents'); // Find the satchel HTML UI box
    if (!container) return;                                  // Abort if missing

    const data = loadSatchelData();                          // Fetch the complex satchel save data
    container.innerHTML = '';                                // Wipe old contents off the screen

    // 1. Draw Ores
    Object.entries(data.ores).forEach(([type, count]) => {   // Loop through ore types and amounts
        if (count > 0) {                                     // Only draw it if the player owns at least 1
            const slot = document.createElement('div');      // Create wrapper box
            slot.className = 'inventory-slot';               // Apply CSS styling
            
            const img = document.createElement('img');       // Create image element
            img.src = `../assets/${type}_ore.png`;           // Build path dynamically (e.g., 'iron' + '_ore.png')
            img.alt = `${type} ore`;                         // Set alt text
            slot.appendChild(img);                           // Put image in wrapper, size of the image is set in .inventory-slot

            // Number badge
            const badge = document.createElement('div');     // Create quantity badge box
            badge.className = 'quantity-badge';              // Apply badge CSS
            badge.textContent = count;                       // Put the amount inside the badge
            slot.appendChild(badge);                         // Put badge in wrapper

            // Standard tooltip
            const tt = document.createElement('div');        // Create tooltip box
            tt.className = 'tooltip';                        // Apply tooltip CSS
            // adds amount, Capitalizes first letter, writes the ore type without the 1st letter, writes ore
            tt.textContent = `${count} ${type.charAt(0).toUpperCase() + type.slice(1)} Ore`; 
            slot.appendChild(tt);                            // Put tooltip in wrapper

            container.appendChild(slot);                     // Put slot in UI container
        }
    });

    // 2. Draw Ingots (Stacked with custom quality tooltips)
    Object.entries(data.ingots).forEach(([type, ingotArray]) => { // Loop through ingot types and arrays
        if (ingotArray.length > 0) {                         // Only draw if the array has items
            const slot = document.createElement('div');      // Create wrapper box
            slot.className = 'inventory-slot';               // Apply CSS styling
            
            const img = document.createElement('img');       // Create image element
            img.src = `../assets/${type}_ingot.png`;         // Build path dynamically
            img.alt = `${type} ingot`;                       // Set alt text
            slot.appendChild(img);                           // Put image in wrapper

            // Number badge (Stack size)
            const badge = document.createElement('div');     // Create badge box
            badge.className = 'quantity-badge';              // Apply badge CSS
            badge.textContent = ingotArray.length;           // Set text to the size of the array
            slot.appendChild(badge);                         // Put badge in wrapper

            // Dynamic Tooltip with Colors
            const tt = document.createElement('div');        // Create tooltip box
            tt.className = 'tooltip';                        // Apply tooltip CSS
            
            // Builds the title with a border line under it
            let tooltipHTML = `<div style="margin-bottom:3px; border-bottom:1px solid #777;">${type.charAt(0).toUpperCase() + type.slice(1)} Ingot(s)</div>`;
            
            // Calculate color for each ingot and list them
            ingotArray.forEach(ingot => {                    // Loop through every individual ingot
                let q = ingot.quality;                       // Grab its quality number
                let color = '';                              // Prepare a blank color string
                if (q >= 101) {                              // Check for special quality over 100
                    color = '#d000ff';                       // Assign purple
                } else {                                     // Otherwise...
                    let hue = Math.floor((q / 100) * 120);   // Calculate a hue on the color wheel (0=Red to 120=Green)
                    color = `hsl(${hue}, 100%, 50%)`;        // Assemble the final HSL color code
                }
                
                // <--- HERE IS WHERE THE INGOT QUALITY IS ADDED TO THE TOOLTIP
                tooltipHTML += `<span style="color: ${color}; font-weight:bold; margin: 0 2px;">${q}%</span> `;
            });

            tt.innerHTML = tooltipHTML;                      // <--- FINALLY, INJECT THE ASSEMBLED HTML INTO THE TOOLTIP
            slot.appendChild(tt);                            // Put tooltip in wrapper
            container.appendChild(slot);                     // Put slot in UI container
        }
    });
}

function renderEquipment() {
    const equipment = loadEquipment(); // Get current gear from storage
    for (const [slot, gear] of Object.entries(equipment)) { // Loop through each equipment slot
        const slotElement = document.querySelector(`.equipment-part[data-slot="${slot}"]`); // Find the HTML element for this slot
        if (!slotElement) continue; // Skip if the slot element isn't on the current page
        if (gear) { // Check if something is actually equipped in this slot
            // Replace the plain-slot content with gear info
            slotElement.innerHTML = `
                <img src="../assets/${gear.icon || 'default_gear.png'}" style="width:32px; height:auto;">
                <span style="font-size:10px;">${gear.name}</span>
            `; // Inject gear icon and name into the slot
            slotElement.classList.remove('plain-slot'); // Remove the "empty" styling
            slotElement.classList.add('equipped-slot'); // Apply the "filled" styling
        } else {
            // Restore empty state
            slotElement.innerHTML = slot.charAt(0).toUpperCase() + slot.slice(1); // Capitalize slot name (e.g., "head")
            slotElement.classList.add('plain-slot'); // Re-apply "empty" styling
            slotElement.classList.remove('equipped-slot'); // Remove "filled" styling
        }
    }
}

// ======== CRAFTING API HELPERS ========
function addOre(type, amount) {
    let data = loadSatchelData();
    if (data.ores[type] !== undefined) {
        data.ores[type] += amount;
        saveSatchelData(data);
        renderSatchel(); // Visually update the sidebar!
    }
}

function removeOre(type, amount) {
    let data = loadSatchelData();
    if (data.ores[type] >= amount) {
        data.ores[type] -= amount;
        saveSatchelData(data);
        renderSatchel();
        return true;
    }
    return false; // Not enough ore
}

function addIngot(type, quality) {
    let data = loadSatchelData();
    if (data.ingots[type]) {
        data.ingots[type].push({ quality: quality });
        saveSatchelData(data);
        renderSatchel();
    }
}

function equipItem(slot, gearItem) {
    let data = loadEquipment();
    if (data.hasOwnProperty(slot)) {
        data[slot] = gearItem;
        saveEquipment(data);
        renderEquipment();
    }
}



// ======== HIDE ALREADY COLLECTED ITEMS ========
function hideCollectedItems() {
    const collected = loadCollectedItems();
    document.querySelectorAll('.collectible').forEach(el => {
        const id = el.dataset.id;
        
        if (id === 'backpack' && hasBackpack()) {
            el.style.display = 'none';
        } else if (id === 'satchel' && hasSatchel()) {
            el.style.display = 'none';
        } else if (collected.includes(id)) {
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
function addItemToInventory(itemId, itemName, itemDesc) {
    if (itemId === 'backpack') {
        if (!hasBackpack()) {                                         
            setBackpack(true);
            updateInventoryVisibility();                                 
            addExpPoint(25);                                            
            return true;
        }
        return false;                                                  
    }

    if (itemId === 'satchel') {
        if (!hasSatchel()) {
            setSatchel(true);
            updateInventoryVisibility(); 
            addExpPoint(25);
            return true;
        }
        return false;
    }

    if (!hasBackpack()) {
        showTemporaryMessage("You found this item but you do not have the means to carry it with you yet.");
        return false;
    }

    const items = loadCollectedItems();                               
    if (!items.includes(itemId)) {                                    
        items.push(itemId);                                             
        saveCollectedItems(items);                                      
        renderInventory();                                              
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

// ==================== MASTER NAVIGATION (CLICK & KEYBOARD) ====================

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
    // Grab the current file name
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // ONLY save the location if we are NOT looking at the map!
    if (currentPage !== 'map.html' && currentPage !== '') {
        // Save current location
        localStorage.setItem('currentLocation', currentPage);
        
        // Pull the history from memory, or start a blank array
        let visitedPages = JSON.parse(localStorage.getItem('visitedPages') || '[]');
        
        // If this page isn't in our history yet, add it and save the book!
        if (!visitedPages.includes(currentPage)) {
            visitedPages.push(currentPage);
            localStorage.setItem('visitedPages', JSON.stringify(visitedPages));
        }
    }

    const left = document.querySelector('.left-sidebar');
    const right = document.querySelector('.right-sidebar');
    
    loadSidebar('left-sidebar', 'sidebar_left.html')
      .then(() => {
          initBlinkieStrip();
      });
      
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
