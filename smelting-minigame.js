// ==================== SMELTING MINIGAME SYSTEM ====================

// --- DATA CONFIGURATIONS ---
const SMITHING_MODIFIERS = {                                     // Databank for gear that changes the minigame
    'ring_of_smithing_forgiveness': { bonusTolerance: 10 }       // Adds +10 hits to the base 110 limit
    // You can easily add future items here!
};

// --- GAME STATE ---
let smeltState = {
    active: false,                                               // Is the minigame currently running?
    oreType: null,                                               // Tracks which ore is inside (Iron, copper, etc.)
    temperature: 100,                                            // Heat scale from 0 to 100
    sideA: 0,                                                    // Total hits applied to Side A
    sideB: 0,                                                    // Total hits applied to Side B
    activeSideIsA: true,                                         // True = A is facing up, False = B is facing up
    heatInterval: null,                                          // Stores the timer ID so we can pause/stop cooling
    maxHits: 110                                                 // Dynamic failure limit (Changes if ring is equipped!)
};

const ORE_COST = 2;                                              // Cost per ingot

// --- PREPARATION PHASE ---
function startFurnace() {
    const selector = document.getElementById('oreSelect');       // Find the dropdown menu
    const oreType = selector.value;                              // Get the currently selected ore
    
    if (!removeOre(oreType, ORE_COST)) {                         // Try to deduct the cost from the satchel
        showTemporaryMessage(`You need at least ${ORE_COST} ${oreType} ore!`); // Warn if too poor
        return;                                                  // Abort the function
    }
    
    smeltState.oreType = oreType;                                // Save the chosen ore type to the state
    
    document.getElementById('forgePrepPhase').style.display = 'none';  // Hide the selection menu
    document.getElementById('forgeHeatPhase').style.display = 'block'; // Show the furnace loading screen
    
    let heatProgress = 0;                                        // Start loading bar at 0
    const bar = document.getElementById('furnaceProgressBar');   // Find the loading bar HTML
    
    const heatTimer = setInterval(() => {                        // Start a repeating timer
        heatProgress += 10;                                      // Increase progress by 10%
        bar.style.width = heatProgress + '%';                    // Update the visual CSS width
        
        if (heatProgress >= 100) {                               // Once fully loaded...
            clearInterval(heatTimer);                            // Stop the timer from running
            
            const actionBtn = document.getElementById('takeOutBtn'); // Find the action button
            
            if (smeltState.oreType === 'iron') {                 // FORK: If it is Iron...
                actionBtn.textContent = 'Take Out Bloom';        // Set button text for minigame
                actionBtn.onclick = moveToAnvil;                 // Connect click to start minigame
            } else {                                             // FORK: If it is Copper or Tin...
                actionBtn.textContent = `Get the ${smeltState.oreType} ingot out of the mold`; // Set text for auto-loot
                actionBtn.onclick = collectSimpleIngot;          // Connect click to auto-loot
            }
            
            actionBtn.style.display = 'inline-block';            // Unhide the correctly programmed button
        }
    }, 200);                                                     // Timer ticks every 200 milliseconds
}

// --- AUTO-COLLECT FOR BASIC ORES ---
function collectSimpleIngot() {
    let isLegendary = Math.random() < 0.01;                      // Roll a 1% chance for Legendary status
    let finalQuality = isLegendary ? 101 : 100;                  // Give 101% or 100% quality

    spawnIngotOnGround(smeltState.oreType, finalQuality);        // Drop the item on the floor
    showTemporaryMessage(`Collected a ${smeltState.oreType} ingot! Pick it up from the floor.`); // Alert player
    resetForge();                                                // Reset the UI to the start
}

// --- ANVIL PHASE (INIT) ---
function moveToAnvil() {
    document.getElementById('forgeHeatPhase').style.display = 'none';  // Hide furnace screen
    document.getElementById('forgeAnvilPhase').style.display = 'block';// Show anvil minigame screen
    
    document.getElementById('bloomVisualContainer').style.display = 'flex'; // Unhide the right-side images
    document.getElementById('visualBloom').src = `../assets/${smeltState.oreType}_bloom.png`; // Set bloom image
    document.getElementById('visualIngot').src = `../assets/${smeltState.oreType}_ingot.png`; // Set ingot image
    
    // ---> DYNAMIC MODIFIER CALCULATION <---
    let bonusHits = 0;                                           // Start with 0 bonus tolerance
    const equipment = typeof loadEquipment === 'function' ? loadEquipment() : {}; // Load equipped gear safely
    
    Object.values(equipment).forEach(item => {                   // Loop through every worn item
        if (item && item.id && SMITHING_MODIFIERS[item.id]) {    // Does this item exist in our databank?
            bonusHits += SMITHING_MODIFIERS[item.id].bonusTolerance; // Yes? Add its bonus hits!
        }
    });
    
    smeltState.maxHits = 110 + bonusHits;                        // Set limit (Base 110 + gear bonuses)
    
    smeltState.active = true;                                    // Turn minigame ON
    smeltState.temperature = 100;                                // Reset heat to max
    smeltState.sideA = 0;                                        // Reset Side A hits
    smeltState.sideB = 0;                                        // Reset Side B hits
    smeltState.activeSideIsA = true;                             // Start with Side A facing up
    
    updateAnvilUI();                                             // Draw the fresh UI
    startHeatLoss();                                             // Start the cooling timer
}

function startHeatLoss() {
    clearInterval(smeltState.heatInterval);                      // Clear any old, stuck timers just in case
    
    smeltState.heatInterval = setInterval(() => {                // Start a new repeating timer
        if (!smeltState.active) return;                          // Do nothing if game is paused/stopped
        
        if (smeltState.temperature > 0) {                        // If it's not totally frozen yet...
            smeltState.temperature -= 1;                         // Drop heat by 1%
            updateAnvilUI();                                     // Redraw the temperature bar mask
        }
    }, 200);                                                     // Ticks 5 times per second (smooth visual)
}

// --- CORE MECHANICS ---
function hitBloom(powerType) {
    if (!smeltState.active) return;                              // Ignore clicks if game is over
    
    if (smeltState.temperature <= 25) {                          // Block hits if it's too cold
        showTemporaryMessage("Too cold! Reheat it first.");      // Warn player
        return;                                                  // Abort hit
    }
    
    let baseHit = 0;                                             // Start calculating power
    if (powerType === 'light') baseHit = 10;                     // Light hammer = 10
    if (powerType === 'medium') baseHit = 25;                    // Medium hammer = 25
    if (powerType === 'heavy') baseHit = 40;                     // Heavy hammer = 40

    let multiplier = 0;                                          // Start calculating heat efficiency
    let t = smeltState.temperature;                              // Grab current temp for easier math
    
    if (t >= 75) {                                               // High heat tier
        multiplier = 0.5 + ((t - 75) / 25) * 0.5;                // Interpolate between 50% and 100% efficiency
    } else if (t >= 50) {                                        // Medium heat tier
        multiplier = 0.25 + ((t - 50) / 25) * 0.25;              // Interpolate between 25% and 50% efficiency
    } else if (t > 25) {                                         // Low heat tier
        multiplier = 0.125 + ((t - 25) / 25) * 0.125;            // Interpolate between 12.5% and 25% efficiency
    }

    let hitValue = Math.floor(baseHit * multiplier);             // Multiply base power by efficiency, round DOWN
    
    if (smeltState.activeSideIsA) {                              // Apply the calculated hit to whichever side is UP
        smeltState.sideA += hitValue;
    } else {
        smeltState.sideB += hitValue;
    }
    
    updateAnvilUI();                                             // Redraw the progress bars
    
    // Check for catastrophic failure (exceeding dynamic maxHits)
    if (smeltState.sideA > smeltState.maxHits || smeltState.sideB > smeltState.maxHits) {
        smeltState.active = false;                               // Stop minigame
        clearInterval(smeltState.heatInterval);                  // Stop cooling timer
        
        addOre(smeltState.oreType, 1);                           // Give 1 ore back as a consolation prize
        showTemporaryMessage(`You flattened it too much! Salvaged 1 ${smeltState.oreType} ore.`);
        
        setTimeout(resetForge, 2500);                            // Wait 2.5s, then kick back to main menu
        return;
    }
    
    // Check if ready to cool (Both sides have reached at least 100)
    if (smeltState.sideA >= 100 && smeltState.sideB >= 100) {
        document.getElementById('coolIngotBtn').style.display = 'inline-block';  // Reveal the Finish button!
    }
}

function turnBloom() {
    if (!smeltState.active) return;                              // Ignore if game is over
    smeltState.activeSideIsA = !smeltState.activeSideIsA;        // Flip the boolean to swap sides
    updateAnvilUI();                                             // Redraw the UI to reflect the flip
}

function reheatBloom() {
    if (!smeltState.active) return;                              // Ignore if game is over
    clearInterval(smeltState.heatInterval);                      // Pause the cooling timer
    
    const btns = document.querySelectorAll('.hit-btn');          // Find all hammer buttons
    btns.forEach(b => b.disabled = true);                        // Disable them so player can't hit while reheating
    
    showTemporaryMessage("Reheating...", 2000);                  // Show a 2-second message
    
    setTimeout(() => {                                           // Wait exactly 2 seconds
        smeltState.temperature = 100;                            // Restore heat to 100%
        btns.forEach(b => b.disabled = false);                   // Re-enable the hammer buttons
        updateAnvilUI();                                         // Redraw the full heat bar
        startHeatLoss();                                         // Resume the cooling timer
    }, 2000);
}

// --- FINISH & REWARD MATH ---
function coolIngot() {
    smeltState.active = false;                                   // Stop minigame
    clearInterval(smeltState.heatInterval);                      // Stop cooling timer
    
    let offA = Math.abs(100 - smeltState.sideA);                 // Calc absolute distance from 100 for Side A
    let offB = Math.abs(100 - smeltState.sideB);                 // Calc absolute distance from 100 for Side B
    let totalOff = offA + offB;                                  // Combine the total mistakes
    
    // ---> DYNAMIC PENALTY MATH <---
    let maxOff = (smeltState.maxHits - 100) * 2;                 // Calc theoretical max mistakes (e.g., 20 or 40)
    if (totalOff > maxOff) totalOff = maxOff;                    // Safety cap penalty at the mathematical limit
    
    let penaltyPerMiss = 100 / maxOff;                           // Calc penalty % per mistake (e.g., 5% or 2.5%)
    
    let finalQuality = 0;
    
    if (totalOff === 0) {                                        // PERFECT RUN (0 mistakes)
        let isLegendary = Math.random() < 0.01;                  // Roll 1% chance
        finalQuality = isLegendary ? 101 : 100;                  // Reward 101% or 100%
    } else {
        let baseQuality = 100 - (totalOff * penaltyPerMiss);     // Deduct penalties from 100
        let randomFill = Math.floor(Math.random() * penaltyPerMiss); // Generate a random fluff number within the penalty tier
        finalQuality = Math.floor(baseQuality + randomFill);     // Combine for final score
        
        if (finalQuality < 1) finalQuality = 1;                  // Floor the quality at 1%
    }
    
    spawnIngotOnGround(smeltState.oreType, finalQuality);        // Drop the loot!
    showTemporaryMessage(`Forged a ${smeltState.oreType} ingot! Pick it up from the floor.`);
    resetForge();                                                // Kick back to start menu
}

// --- UI UPDATER ---
function updateAnvilUI() {
    let maskHeight = 100 - smeltState.temperature;               // Calc how much gray mask to show over the heat bar
    document.getElementById('bloomTempMask').style.height = maskHeight + '%'; // Apply it
    
    // Figure out which values belong on Top vs Bottom based on the activeSideIsA toggle
    let activeVal = smeltState.activeSideIsA ? smeltState.sideA : smeltState.sideB;
    let bottomVal = smeltState.activeSideIsA ? smeltState.sideB : smeltState.sideA;
    let activeName = smeltState.activeSideIsA ? "Side A" : "Side B";
    let bottomName = smeltState.activeSideIsA ? "Side B" : "Side A";
    
    // Calculate the shrinking mask to reveal the gradient (stops shrinking at 0)
    let activeMaskWidth = Math.max(0, 100 - activeVal); 
    document.getElementById('activeSideMask').style.width = activeMaskWidth + '%';
    document.getElementById('activeSideText').textContent = `${activeName}: ${activeVal} / 100`;
    
    let bottomMaskWidth = Math.max(0, 100 - bottomVal); 
    document.getElementById('bottomSideMask').style.width = bottomMaskWidth + '%';
    document.getElementById('bottomSideText').textContent = `${bottomName}: ${bottomVal} / 100`;
    
    // Smart Color Warnings (Red = Dead, Orange = Warning, White/Gray = Safe)
    if (activeVal > smeltState.maxHits) document.getElementById('activeSideText').style.color = 'red';
    else if (activeVal > 100) document.getElementById('activeSideText').style.color = 'orange';
    else document.getElementById('activeSideText').style.color = 'white';
    
    if (bottomVal > smeltState.maxHits) document.getElementById('bottomSideText').style.color = 'red';
    else if (bottomVal > 100) document.getElementById('bottomSideText').style.color = 'orange';
    else document.getElementById('bottomSideText').style.color = 'var(--light-gray)';
    
    // Fade the Ingot graphic in as you get closer to 200 total hits
    let totalHits = Math.min(smeltState.sideA, 100) + Math.min(smeltState.sideB, 100);
    let ingotOpacity = totalHits / 200; 
    document.getElementById('visualIngot').style.opacity = ingotOpacity;
}

// --- CLEANUP ---
function resetForge() {                                          // Completely resets the UI
    document.getElementById('forgePrepPhase').style.display = 'block'; 
    document.getElementById('forgeHeatPhase').style.display = 'none';  
    document.getElementById('forgeAnvilPhase').style.display = 'none'; 
    document.getElementById('takeOutBtn').style.display = 'none';      
    document.getElementById('coolIngotBtn').style.display = 'none';
    
    document.getElementById('furnaceProgressBar').style.width = '0%';  
    document.getElementById('activeSideMask').style.width = '100%';
    document.getElementById('bottomSideMask').style.width = '100%';
    
    document.getElementById('visualIngot').style.opacity = '0';          
    document.getElementById('bloomVisualContainer').style.display = 'none'; 
}

// ======== SPAWN INGOT ON GROUND ========
function spawnIngotOnGround(type, quality) {                     
    let container = document.getElementById('smelteryFloorContainer'); // Find the floor HTML div
    if (!container) return;                                      // Abort if missing

    const ingotEl = document.createElement('div');               // Create a wrapper div for the item
    ingotEl.className = 'collectible';                           // Give it the glowing hover CSS class
    ingotEl.style.cursor = 'pointer';                            // Make mouse look clickable
    ingotEl.style.textAlign = 'center';                          // Center text under it
    ingotEl.style.position = 'relative';                         // Setup for relative positioning

    const img = document.createElement('img');                   // Create an image element
    img.src = `../assets/${type}_ingot.png`;                     // Load the correct graphic dynamically
    img.style.width = '40px';                                    // Size it

    const badge = document.createElement('div');                 // Create the % text badge
    badge.textContent = `${quality}%`;                           // Inject the quality score
    badge.style.fontSize = '12px';                               
    badge.style.fontWeight = 'bold';
    
    // Dynamically color the % text from red (low) to green (high) using HSL math!
    if (quality >= 101) badge.style.color = '#d000ff';           // Unless it's legendary, then make it purple
    else badge.style.color = `hsl(${Math.floor((quality / 100) * 120)}, 100%, 50%)`;

    ingotEl.appendChild(img);                                    // Attach image to wrapper
    ingotEl.appendChild(badge);                                  // Attach badge to wrapper

    // Pick-up logic
    ingotEl.onclick = function(e) {                              // Listen for click
        e.stopPropagation();                                     // Prevent clicking the floor under it
        
        if (typeof loadData === 'function' && !loadData('collectedItems', []).includes('satchel')) { // Verify they own a satchel
            if (typeof showTemporaryMessage === 'function') showTemporaryMessage("You need a Satchel to pick up heavy ingots!");
        } else {
            addIngot(type, quality);                             // Save to data API
            ingotEl.remove();                                    // Delete from floor HTML
            if (typeof showTemporaryMessage === 'function') showTemporaryMessage(`Stashed a ${quality}% ${type} ingot!`);
            
            // Pulls from the central XP Databank!
            if (typeof addExpPoint === 'function' && typeof XP_REWARDS !== 'undefined') {
                addExpPoint(XP_REWARDS.smeltIngot);              // Reward XP
            }
        }
    };
    
    container.appendChild(ingotEl);                              // Physically drop the wrapper onto the HTML floor
}