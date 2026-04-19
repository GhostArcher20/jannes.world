// ==================== MINING MINIGAME SYSTEM ====================
const MINIGAME_CONTAINER_CLASS = 'main-content'; // CSS class where the game lives
const BASE_TOLERANCE_PX = 4;                     // Starting click radius (px)
const MAX_TOLERANCE_PX = 20;                     // Max click radius allowed
const DROP_DURATION_MS = 250;                    // Falling animation speed

// --- CONFIGURATIONS ---
const MINING_CONFIG = {                          // Change balance numbers here
    'iron': {
        requiredTool: 'pickaxe',                 // Required item in inventory
        spawnRange: [3, 5],                      // Min/Max ores on the wall
        baseParticles: 3,                        // Clicks required to break
        dropRange: [1, 3]                        // Min/Max items dropped
    },
    'copper': {
        requiredTool: 'pickaxe',
        spawnRange: [4, 6],
        baseParticles: 2,        
        dropRange: [1, 4]
    },
    'tin': {
        requiredTool: 'pickaxe',
        spawnRange: [1, 2],
        baseParticles: 4,
        dropRange: [1, 2]
    }
};

const ITEM_MODIFIERS = {                         // Future tool upgrades go here
    'pickaxe': { power: 0, yield: 0 } 
};

// --- GAME STATE ---
let minigameActive = false;                      // Tracks if game is running
let minigameContainer;                           // Reference to the HTML element

// --- SCALING & STATS ---
function calculateTolerance() {
    const level = typeof getLevel === 'function' ? getLevel(getExpPoint()) : 0; // Safely get level
    const scalingBonus = level * 1;              // +1px tolerance per level
    const calculated = BASE_TOLERANCE_PX + scalingBonus;
    return Math.min(calculated, MAX_TOLERANCE_PX); // Enforce maximum ceiling
}

function calculatePlayerStats() {
    let stats = { power: 0, yield: 0 };          // Start with 0 bonuses
    if (typeof loadCollectedItems !== 'function') return stats; 
    
    const inventory = loadCollectedItems();      // Get player's items
    inventory.forEach(itemId => {
        if (ITEM_MODIFIERS[itemId]) {            // If item gives bonuses, add them
            stats.power += ITEM_MODIFIERS[itemId].power;
            stats.yield += ITEM_MODIFIERS[itemId].yield;
        }
    });
    return stats;
}

// --- CORE: START GAME ---
function startMiningMinigame() {
    minigameContainer = document.querySelector('.' + MINIGAME_CONTAINER_CLASS); 
    if (!minigameContainer) return;              // Abort if screen is missing
    
    const inventory = typeof loadCollectedItems === 'function' ? loadCollectedItems() : []; 
    if (!inventory.includes('pickaxe')) {        // Verify tool requirement
        if (typeof showTemporaryMessage === 'function') {
            showTemporaryMessage(`You need a pickaxe to start mining!`); 
        }
        return;                                  // Abort without tool
    }
    
    minigameActive = true;                       // Enable interactions
    clearMinigameElements();                     // Clean up old elements
    populateMineWall();                          // Build the new wall
}

// --- HELPER: MATH UTILITY ---
function getValidPosition(existingItems, config) { // Finds non-overlapping coords
    let isValid = false;                         
    let newX, newY;                 
    let attempts = 0;                            // Prevent infinite loops

    while (!isValid && attempts < config.maxAttempts) { 
        newX = (Math.random() * config.rangeX) + config.offsetX; // Randomize X
        newY = (Math.random() * config.rangeY) + config.offsetY; // Randomize Y
        isValid = true;                          // Assume good initially

        for (let item of existingItems) {        // Check against all placed items
            if (Math.hypot(item.x - newX, item.y - newY) < config.minDistance) { 
                isValid = false;                 // Too close! Overlapping
                break;                           // Stop checking, try again
            }
        }
        attempts++;                              
    }
    return { x: newX, y: newY };                 // Return safe coordinates
}

// --- HELPER: FLOATING TEXT ---
function showFloatingText(clientX, clientY, container, message, color, moveYOffset) {
    const floatText = document.createElement('div');      
    floatText.textContent = message;             // e.g., 'Hit!' or 'Miss!'
    
    floatText.style.position = 'absolute';       // Free positioning
    floatText.style.color = color;               // Apply chosen hex color
    floatText.style.fontWeight = 'bold';         
    floatText.style.fontSize = '14px';           
    floatText.style.pointerEvents = 'none';      // Prevent blocking clicks!
    floatText.style.zIndex = '50';               // Keep on top layer
    floatText.style.opacity = '1';               
    
    floatText.style.transition = 'transform 0.2s ease-out, opacity 0.5s ease-out'; 
    floatText.style.transform = 'translateY(0px)';// Start stationary
    
	const containerRect = container.getBoundingClientRect(); 
    
    // Add 15px to shift right, Subtract 20px to shift up
    floatText.style.left = (clientX - containerRect.left - 20) + 'px'; 
    floatText.style.top = (clientY - containerRect.top - 20) + 'px';
    
    container.appendChild(floatText);            
    
    setTimeout(() => {                           // 10ms delay triggers animation
        floatText.style.transform = `translateY(${moveYOffset}px)`;  
        floatText.style.opacity = '0';           // Fade out
    }, 10);
    
    setTimeout(() => floatText.remove(), 500);   // Delete HTML after 0.2s 
}

// --- WORKER: SPAWN ORE ---
function spawnSingleOre(oreType, config, reqSparkles, tolerance, pStats, width, height, placedOres, wallState) {
    
    const pos = getValidPosition(placedOres, {   // Find safe spot for Ore
        rangeX: width - 80, rangeY: height - 150,
        offsetX: 0, offsetY: 50,
        minDistance: 75, maxAttempts: 100
    });
    placedOres.push(pos);                        // Save spot to prevent overlaps

    const oreEl = document.createElement('div');
    oreEl.className = 'minigame-ore'; 
    oreEl.style.backgroundImage = `url('../assets/${oreType}_ore_mine.png')`; 
    oreEl.style.backgroundSize = 'contain';
    oreEl.style.backgroundRepeat = 'no-repeat';
    oreEl.style.backgroundPosition = 'center';
    oreEl.style.position = 'absolute';
    oreEl.style.left = pos.x + 'px';             // Apply safe X
    oreEl.style.top = pos.y + 'px';              // Apply safe Y
    oreEl.style.width = '100px'; 
    oreEl.style.height = '100px';
    oreEl.style.zIndex = '5'; 
    oreEl.style.cursor = `url('../assets/pickaxe.png'), pointer`; // Custom cursor
    
    let oreParticleHits = 0;                     // Hits on THIS ore
    let placedSparkles = [];                     // Sparkles on THIS ore
    
    for (let j = 0; j < reqSparkles; j++) {      // Generate sparkles
        
        const sPos = getValidPosition(placedSparkles, { // Find safe offset
            rangeX: 30, rangeY: 30,
            offsetX: -15, offsetY: -15,
            minDistance: 15, maxAttempts: 50
        });
        placedSparkles.push(sPos);               

        const sparkleEl = document.createElement('div');
        sparkleEl.className = 'minigame-sparkle'; 
        sparkleEl.style.position = 'absolute';
        sparkleEl.style.left = `calc(50% + ${sPos.x}px)`; // Center + X offset
        sparkleEl.style.top = `calc(50% + ${sPos.y}px)`;  // Center + Y offset
        sparkleEl.style.transform = 'translate(-50%, -50%)'; // Center perfectly
        sparkleEl.style.width = '70px'; 
        sparkleEl.style.height = '70px';
        sparkleEl.style.backgroundImage = `url('../assets/sparkle.gif')`;
        sparkleEl.style.backgroundSize = 'contain';
        sparkleEl.style.backgroundRepeat = 'no-repeat';
        sparkleEl.style.backgroundPosition = 'center';

        sparkleEl.addEventListener('click', (e) => { // Handle clicking
            if (!minigameActive) return;         

            const rect = sparkleEl.getBoundingClientRect(); // Get exact location
            const clickX = e.clientX - rect.left - rect.width / 2; 
            const clickY = e.clientY - rect.top - rect.height / 2;
            const distance = Math.sqrt(clickX * clickX + clickY * clickY); // Pyth. Thm.

            if (distance <= tolerance) {         // HIT!
                e.stopPropagation();             // Don't click background
                sparkleEl.remove();              // Remove visual
                oreParticleHits++;               // Increment local score
                
                showFloatingText(e.clientX, e.clientY, minigameContainer, 'Hit!', '#00ff00', -40);

                if (oreParticleHits === reqSparkles) { // Ore destroyed?
                    handleOreMinedStateTransition(oreEl, pos.x, pos.y, oreType, config, pStats);
                    wallState.minedOres++;       // Increment global score
                    
                    if (wallState.minedOres === wallState.totalTargetOres) {
                        allOresMinedEvent();     // Wall cleared!
                    }
                }
            } else {                             // MISS!
                e.stopPropagation(); 
                showFloatingText(e.clientX, e.clientY, minigameContainer, 'Miss!', '#ff3333', 20);
            }
        });
        oreEl.appendChild(sparkleEl);            // Attach sparkle to ore
    }
    minigameContainer.appendChild(oreEl);        // Attach ore to wall
}

// --- MANAGER: POPULATE WALL ---
function populateMineWall() {
    let wallState = {                            // Object allows pass-by-reference
        minedOres: 0,
        totalTargetOres: 0
    };
    
    const tolerancePx = calculateTolerance(); 
    const playerStats = calculatePlayerStats(); 

    const cWidth = minigameContainer.clientWidth > 200 ? minigameContainer.clientWidth : 600;
    const cHeight = minigameContainer.clientHeight > 300 ? minigameContainer.clientHeight : 600;

    let placedOres = [];                         // Tracks all ore coordinates

    for (const [oreType, config] of Object.entries(MINING_CONFIG)) { // Loop database
        
        const min = config.spawnRange[0];
        const max = config.spawnRange[1];
        const spawnCount = Math.floor(Math.random() * (max - min + 1)) + min;
        
        wallState.totalTargetOres += spawnCount; // Update global target
        const reqSparkles = Math.max(1, config.baseParticles - playerStats.power); // Min 1

        for (let i = 0; i < spawnCount; i++) {   // Tell Worker to build them
            spawnSingleOre(oreType, config, reqSparkles, tolerancePx, playerStats, cWidth, cHeight, placedOres, wallState);
        }
    }
}

// --- TRANSITION: DROP LOOT ---
function handleOreMinedStateTransition(oreOnWall, left, top, oreType, config, playerStats) {
    oreOnWall.style.display = 'none';            // Hide wall ore instantly

    const minDrop = config.dropRange[0];
    const maxDrop = config.dropRange[1];
    let dropAmount = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
    dropAmount += playerStats.yield;             // Apply lucky bonuses

    if (typeof spawnOreOnGround === 'function') {
        spawnOreOnGround(oreType, dropAmount);   // Create physical item
        
        const floorContainer = document.getElementById('minedOresContainer');
        if (floorContainer && floorContainer.children.length > 0) {
            const latestDrop = floorContainer.lastElementChild; // Grab new item
            
            latestDrop.style.position = 'absolute'; // Pop out of flexbox
            latestDrop.style.left = left + 'px';    // Snap to wall coords
            latestDrop.style.top = top + 'px';
            latestDrop.style.transition = `top ${DROP_DURATION_MS / 1000}s cubic-bezier(0.55, 0.085, 0.68, 0.53)`; // Gravity curve
            
            setTimeout(() => {                   // Trigger animation
                const targetY = minigameContainer.clientHeight - 80;
                latestDrop.style.top = targetY + 'px'; // Move to floor
            }, 10);

            setTimeout(() => {                   // Reset CSS after drop finishes
                latestDrop.style.position = 'relative';
                latestDrop.style.left = 'auto';
                latestDrop.style.top = 'auto';
            }, DROP_DURATION_MS + 20);           // 20ms safety buffer
        }
    }
}

// --- REGENERATION LOOP ---
function allOresMinedEvent() {                   // Runs when wall is cleared
    if (minigameActive) {
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'ui-button venture-button'; 
        regenerateBtn.textContent = 'Venture Deeper (Regenerate)'; 
        regenerateBtn.style.position = 'absolute';
        regenerateBtn.style.bottom = '20px';     // Lock to bottom
        regenerateBtn.style.left = '50%';        
        regenerateBtn.style.transform = 'translateX(-50%)'; // Center perfectly
        
        regenerateBtn.addEventListener('click', () => {
             clearMinigameElements();            // Wipe screen
             startMiningMinigame();              // Restart script loop
        });
        minigameContainer.appendChild(regenerateBtn);
    }
}

// --- THE JANITOR ---
function clearMinigameElements() {               // Cleans up UI clutter
    if (!minigameContainer) return; 
    
    const toRemove = ['.minigame-ore', '.minigame-sparkle', '.venture-button'];
    toRemove.forEach(selector => {               // Delete wall elements
        document.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    const floorContainer = document.getElementById('minedOresContainer');
    if (floorContainer) floorContainer.innerHTML = ''; // Delete floor items

    minigameContainer.style.cursor = 'default';  // Reset cursor
}

// --- CRAFTING API: SPAWN ORE ---
function spawnOreOnGround(type, amount) {        // Builds clickable floor item
    let container = document.getElementById('minedOresContainer');
    if (!container) return; 

    const oreEl = document.createElement('div');
    oreEl.className = 'collectible';             // Glowing hover effect
    oreEl.style.cursor = 'pointer';
    oreEl.style.textAlign = 'center';
    oreEl.style.position = 'relative';           // Obeys flexbox flow
    oreEl.style.zIndex = '10';

    const img = document.createElement('img');
    img.src = `../assets/${type}_ore.png`; 
    img.style.width = '40px';

    const badge = document.createElement('div');
    badge.textContent = `x${amount}`;            // "x3" text
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    badge.style.color = 'gold';

    oreEl.appendChild(img);                      // Assemble wrapper
    oreEl.appendChild(badge);

    // Pick-up logic
    oreEl.onclick = function(e) {                
        e.stopPropagation(); 
        
        if (typeof hasSatchel === 'function' && !hasSatchel()) {
            if (typeof showTemporaryMessage === 'function') showTemporaryMessage("You need a Satchel to pick up heavy ores!");
        } else {
            if (typeof addOre === 'function') addOre(type, amount); 
            oreEl.remove();                                         
            if (typeof showTemporaryMessage === 'function') showTemporaryMessage(`Stashed ${amount} ${type} ore in your satchel!`);
            
            // pulls from databank
            if (typeof addExpPoint === 'function') addExpPoint(XP_REWARDS.mineOre);  
        }
    };
    container.appendChild(oreEl);                // Place on floor
}