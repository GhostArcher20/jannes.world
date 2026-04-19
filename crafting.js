// ==================== BLACKSMITH CRAFTING SYSTEM ====================

// --- DATA CONFIGURATION ---
const BLACKSMITH_RECIPES = {                                     // Central databank for everything the Blacksmith can make
    'iron_sword': {
        id: 'iron_sword',                                        // The exact ID used to save and track the item
        name: 'Iron Sword',                                      // The display name shown to the player
        slot: 'mainHand',                                        // Which body part this item equips to
        cost: { type: 'iron', amount: 3 }                        // The exact type and quantity of ingots required
    },
    'copper_helmet': {
        id: 'copper_helmet',                
        name: 'Copper Helmet',
        slot: 'head',
        cost: { type: 'copper', amount: 2 } 
    },
    'ring_of_smithing_forgiveness': {
        id: 'ring_of_smithing_forgiveness', 
        name: 'Ring of Forgiveness',
        slot: 'ring',
        cost: { type: 'tin', amount: 3 } 
    }
};

// --- RENDER BLACKSMITH MENU ---
// Generates the buttons dynamically so you never have to hardcode HTML text again!
function renderBlacksmithMenu() {
    const menuContainer = document.getElementById('blacksmithMenu'); // Find the empty container in the HTML
    if (!menuContainer) return;                                  // Abort if the player isn't on the blacksmith page

    menuContainer.innerHTML = '';                                // Clear out any old buttons to prevent duplicates

    // Loop through every recipe in your database
    for (const [recipeId, recipe] of Object.entries(BLACKSMITH_RECIPES)) {
        
        // Capitalize the ore type for the button text (e.g., 'iron' -> 'Iron')
        const capitalizedType = recipe.cost.type.charAt(0).toUpperCase() + recipe.cost.type.slice(1);
        
        // Create the physical button element
        const btn = document.createElement('button');
        btn.className = 'ui-button';                             // Apply your CSS styling
        
        // Dynamically inject the recipe variables into the button text!
        btn.textContent = `Forge ${recipe.name} (Requires ${recipe.cost.amount} ${capitalizedType})`;
        
        // Attach the click event, passing the specific recipeId to the Modal function
        btn.onclick = () => openSmithyUI(recipeId);
        
        // Add the finished button to the webpage
        menuContainer.appendChild(btn);
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

    const satchel = loadSatchelData();                           // Load player's inventory
    const requiredType = currentRecipe.cost.type;                // What ore type do we need? (e.g., 'iron')
    const requiredAmount = currentRecipe.cost.amount;            // How many do we need? (e.g., 3)
    const playerIngots = satchel.ingots[requiredType] || [];     // Grab the player's ingots of this exact type (or empty array)

    // 1. Update UI Text
    document.getElementById('smithyRequirement').textContent = `0/${requiredAmount} ${requiredType} Ingots`; // Set counter
    document.getElementById('confirmCraftBtn').disabled = true;  // Lock the 'Forge' button initially

    // 2. Populate the Grid
    const grid = document.getElementById('smithyIngotGrid');     // Find the empty grid container
    grid.innerHTML = '';                                         // Clear it out

    if (playerIngots.length === 0) {                             // If the player is totally broke...
        grid.innerHTML = `<span style="font-size: 12px; color: #ff4444;">You have no ${requiredType} ingots!</span>`;
    } else {
        // Draw every ingot the player owns of this specific type
        playerIngots.forEach((ingot, index) => {
            const ingotBtn = document.createElement('div');      // Create a visual square for the ingot
            ingotBtn.className = 'selectable-ingot';
            
            // Color code the text using the exact same HSL math from the smelting minigame!
            if (ingot.quality >= 101) ingotBtn.style.color = '#d000ff';
            else ingotBtn.style.color = `hsl(${Math.floor((ingot.quality / 100) * 120)}, 100%, 50%)`;
            
            ingotBtn.textContent = `${ingot.quality}%`;          // Print the quality score on the square
            
            // Attach a click listener that passes this ingot's specific array index
            ingotBtn.onclick = () => toggleIngotSelection(ingotBtn, index, requiredAmount);
            grid.appendChild(ingotBtn);                          // Put the square into the grid
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

    let satchel = loadSatchelData();                             // Load inventory
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
    saveSatchelData(satchel);
    if (typeof renderSatchel === 'function') renderSatchel();    // Update sidebar UI

    // Create the final Equipment Object
    const newGear = {
        id: currentRecipe.id,
        name: currentRecipe.name,
        quality: avgQuality,                                     // Inject the calculated average quality!
        icon: `${currentRecipe.id || 'default_gear'}.png`        // Dynamically point to the correct image file
    };

    // Equip it to the player's body
    equipItem(currentRecipe.slot, newGear);
    
    showTemporaryMessage(`Forged a ${avgQuality}% quality ${currentRecipe.name}!`); // Alert player
    if (typeof addExpPoint === 'function') addExpPoint(50);      // Big XP reward for crafting!
    
    closeSmithyUI();                                             // Close the modal
}