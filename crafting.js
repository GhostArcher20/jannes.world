// ==================== BLACKSMITH CRAFTING SYSTEM ====================
// --- RENDER BLACKSMITH MENU ---
function renderBlacksmithMenu() {
    const menuContainer = document.getElementById('blacksmithMenu'); // Find the empty container in the HTML
    if (!menuContainer) return;                                  // Abort if the player isn't on the blacksmith page

    menuContainer.innerHTML = '';                                // Clear out any old buttons to prevent duplicates

    // Loop through every recipe in your database
    for (const [recipeId, recipe] of Object.entries(BLACKSMITH_RECIPES)) {
        const capitalizedType = recipe.cost.type.charAt(0).toUpperCase() + recipe.cost.type.slice(1);
        
        // Create the button in plain HTML, and attach the onclick using the recipeId
        menuContainer.innerHTML += `
            <button class="ui-button" onclick="openSmithyUI('${recipeId}')">
                Forge ${recipe.name} (Requires ${recipe.cost.amount} ${capitalizedType})
            </button>
        `;
    }
}

// --- MODAL STATE TRACKING ---
let currentRecipe = null;                                        // Remembers which recipe the player clicked
let selectedIngots = [];                                         // Remembers the ARRAY INDEX of the specific ingots clicked

// --- OPEN MODAL ---
function openSmithyUI(recipeId) {
    currentRecipe = BLACKSMITH_RECIPES[recipeId];                // Look up the recipe data using the ID
    if (!currentRecipe) return;                                  // Safety check

    selectedIngots = [];                                         // Reset selections from previous crafting attempts

    const satchel = loadData('satchelData', DEFAULT_SATCHEL);    // Load player's inventory
    const requiredType = currentRecipe.cost.type;                // What ore type do we need? (e.g., 'iron')
    const requiredAmount = currentRecipe.cost.amount;            // How many do we need? (e.g., 3)
    const playerIngots = satchel.ingots[requiredType] || [];     // Grab the player's ingots of this exact type (or empty array)

    // 1. Update UI Text
    document.getElementById('smithyRequirement').textContent = `0/${requiredAmount} ${requiredType} Ingots`; // Set counter
    document.getElementById('confirmCraftBtn').disabled = true;  // Lock the 'Forge' button initially

    // 2. Populate the Grid
    const grid = document.getElementById('smithyIngotGrid');     // Find the empty grid container
    grid.innerHTML = '';                                         // Clear it out

    if (playerIngots.length === 0) {                             
        grid.innerHTML = `<span style="font-size: 12px; color: #ff4444;">You have no ${requiredType} ingots!</span>`;
    } else {
        // Draw every ingot the player owns of this specific type
        playerIngots.forEach((ingot, index) => {
            const ingotBtn = document.createElement('div');      
            ingotBtn.className = 'selectable-ingot';
            
            // Calculate the dynamic color based on quality
            let qualityColor = ingot.quality >= 101 ? '#d000ff' : `hsl(${Math.floor((ingot.quality / 100) * 120)}, 100%, 50%)`;
            
            // Inject the image and the colored percentage text
            ingotBtn.innerHTML = `
                <img src="../assets/${requiredType}_ingot.png" alt="${requiredType} ingot">
                <span class="ingot-quality-badge" style="color: ${qualityColor};">${ingot.quality}%</span>
            `;
            
            // Attach a click listener that passes this ingot's specific array index
            ingotBtn.onclick = () => toggleIngotSelection(ingotBtn, index, requiredAmount);
            grid.appendChild(ingotBtn);                          
        });
    }

    // 3. Show the Modal
    document.getElementById('smithyModal').classList.remove('hidden'); // Remove the CSS hiding class
}

// --- TOGGLE INGOT SELECTION ---
function toggleIngotSelection(buttonElement, ingotIndex, requiredAmount) {
    const isSelected = selectedIngots.includes(ingotIndex);      // Check if this ingot is already in our chosen list

    if (isSelected) {
        // Deselect it
        selectedIngots = selectedIngots.filter(i => i !== ingotIndex); // Remove its index from our array
        buttonElement.classList.remove('selected');              // Remove the golden CSS border
    } else {
        // Prevent selecting more than the recipe requires
        if (selectedIngots.length >= requiredAmount) return;     // Block the click if they already picked enough
        
        // Select it
        selectedIngots.push(ingotIndex);                         // Add its index to our array
        buttonElement.classList.add('selected');                 // Apply the golden CSS border
    }

    // Update Counter Text dynamically (e.g., "2/3 iron Ingots")
    document.getElementById('smithyRequirement').textContent = `${selectedIngots.length}/${requiredAmount} ${currentRecipe.cost.type} Ingots`;

    // Enable the Forge Button ONLY if they have selected the exact amount needed
    document.getElementById('confirmCraftBtn').disabled = (selectedIngots.length !== requiredAmount);
}

// --- CLOSE MODAL ---
function closeSmithyUI() {
    document.getElementById('smithyModal').classList.add('hidden'); // Hide the UI
    currentRecipe = null;                                        // Wipe memory
    selectedIngots = [];                                         // Wipe memory
}

// --- EXECUTE CRAFTING ---
function executeCrafting() {
    if (!currentRecipe || selectedIngots.length !== currentRecipe.cost.amount) return; // Final safety check

    let satchel = loadData('satchelData', DEFAULT_SATCHEL);      // Load inventory
    const requiredType = currentRecipe.cost.type;                // Get ore type
    
    // CRITICAL: Sort indices descending (Highest index to Lowest index). 
    // If we delete index 0 first, index 1 becomes index 0, ruining our remaining selections!
    selectedIngots.sort((a, b) => b - a);

    let totalQuality = 0;                                        // Start quality counter

    // Remove the selected ingots and add up their quality
    selectedIngots.forEach(index => {
        // .splice(index, 1) removes 1 item at the given index and returns it. [0] grabs that returned item.
        const removedIngot = satchel.ingots[requiredType].splice(index, 1)[0]; 
        totalQuality += removedIngot.quality;                    // Add its quality to the pool
    });

    // Calculate final average quality, rounding down
    const avgQuality = Math.floor(totalQuality / currentRecipe.cost.amount);

    // Save the updated inventory (the spent ingots are now permanently gone)
    saveData('satchelData', satchel);
    if (typeof renderSatchel === 'function') renderSatchel();    // Update sidebar UI

    // Create the final Equipment Object
    // Create the final Equipment Object
    const newGear = {
        id: currentRecipe.id,
        name: currentRecipe.name,
        quality: avgQuality,                                     
        icon: `${currentRecipe.id || 'default_gear'}.png`,
        slot: currentRecipe.slot // CRITICAL: Save the slot data so the inventory knows where it goes!
    };

    let equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT);

    // --- SMART AUTO-EQUIP OR STORE ---
    if (!equipment[currentRecipe.slot]) {
        // Hands are empty? Equip it immediately!
        equipItem(currentRecipe.slot, newGear);
        showTemporaryMessage(`Forged and equipped a ${avgQuality}% quality ${currentRecipe.name}!`);
    } else {
        // Hands are full? Send it to the backpack!
        let gearInv = loadData('unequippedGear', []);
        gearInv.push(newGear);
        saveData('unequippedGear', gearInv);
        if (typeof renderInventory === 'function') renderInventory();
        showTemporaryMessage(`Forged a ${avgQuality}% quality ${currentRecipe.name}! (Placed in Backpack)`);
    }
    
    if (typeof addExpPoint === 'function') addExpPoint(50);      
    closeSmithyUI();
}

// --- STARTUP ---
// Draw the dynamic buttons as soon as the page loads!
document.addEventListener('DOMContentLoaded', () => {
    renderBlacksmithMenu();
});
