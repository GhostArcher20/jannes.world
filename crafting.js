// ==================== BLACKSMITH CRAFTING SYSTEM ====================
// --- RENDER BLACKSMITH MENU ---
function renderBlacksmithMenu() {
    const menuContainer = document.getElementById('blacksmithMenu'); 
    if (!menuContainer) return;                                  

    menuContainer.innerHTML = '';                                

    for (const [recipeId, recipe] of Object.entries(craftablesDatabase)) {
        // Dynamically build the requirement string (e.g., "3 Iron, 1 Coal")
        let costString = Object.entries(recipe.cost)
            .map(([type, amount]) => `${amount} ${type.charAt(0).toUpperCase() + type.slice(1)}`)
            .join(', ');
        
        menuContainer.innerHTML += `
            <button class="ui-button" onclick="openSmithyUI('${recipeId}')">
                Forge ${recipe.name} (Requires ${costString})
            </button>
        `;
    }
}

// --- MODAL STATE TRACKING ---
let currentRecipe = null;                                        
let selectedIngots = {}; // Now a dictionary: { iron: [], tin: [] } to track multiple materials

// --- OPEN MODAL ---
function openSmithyUI(recipeId) {
    currentRecipe = craftablesDatabase[recipeId];                
    if (!currentRecipe) return;                                  

    selectedIngots = {}; // Wipe old memory
    for (const type of Object.keys(currentRecipe.cost)) {
        selectedIngots[type] = []; 
    }

    const satchel = loadData('satchelData', DEFAULT_SATCHEL);    
    document.getElementById('confirmCraftBtn').disabled = true;  
    
    const grid = document.getElementById('smithyIngotGrid');     
    grid.innerHTML = ''; // Wipe old UI
    
    let reqTextArray = [];

    // Loop through EVERY material required by the recipe
    for (const [type, reqAmount] of Object.entries(currentRecipe.cost)) {
        const playerIngots = satchel.ingots[type] || [];         
        reqTextArray.push(`0/${reqAmount} ${type}`);
        
        // 1. CREATE THE VERTICAL WRAPPER
        const metalSection = document.createElement('div');
        metalSection.className = 'metal-section'; // Using CSS class!

        // 2. ADD THE TITLE
        metalSection.innerHTML = `<div class="metal-title">${type}</div>`; // Using CSS class!

        if (playerIngots.length < reqAmount) {                             
            metalSection.innerHTML += `<div class="metal-warning">Not enough ${type} ingots! (Need ${reqAmount})</div>`; // Using CSS class!
        } else {
            // 3. CREATE THE HORIZONTAL ROW
            const rowContainer = document.createElement('div');
            rowContainer.className = 'ingot-scroll-row custom-scroll-area'; 
            
            // 4. DRAW THE INGOTS INSIDE THE ROW
            playerIngots.forEach((ingot, index) => {
                const ingotBtn = document.createElement('div');      
                ingotBtn.className = 'selectable-ingot';
                
                let qualityColor = ingot.quality >= 101 ? '#d000ff' : `hsl(${Math.floor((ingot.quality / 100) * 120)}, 100%, 50%)`;
                
                ingotBtn.innerHTML = `
                    <img src="../assets/${type}_ingot.png" alt="${type} ingot">
                    <span class="ingot-quality-badge" style="color: ${qualityColor};">${ingot.quality}%</span>
                `;
                
                ingotBtn.onclick = () => toggleIngotSelection(ingotBtn, type, index, reqAmount);
                rowContainer.appendChild(ingotBtn);                          
            });
            
            // 5. ATTACH ROW TO SECTION
            metalSection.appendChild(rowContainer);
        }

        // 6. ATTACH SECTION TO GRID
        grid.appendChild(metalSection);
    }

    document.getElementById('smithyRequirement').textContent = reqTextArray.join(' | '); 
    document.getElementById('smithyModal').classList.remove('hidden'); 
}

// --- TOGGLE INGOT SELECTION ---
function toggleIngotSelection(buttonElement, type, ingotIndex, requiredAmount) {
    const isSelected = selectedIngots[type].includes(ingotIndex);      

    if (isSelected) {
        selectedIngots[type] = selectedIngots[type].filter(i => i !== ingotIndex); 
        buttonElement.classList.remove('selected');              
    } else {
        if (selectedIngots[type].length >= requiredAmount) return;     
        selectedIngots[type].push(ingotIndex);                         
        buttonElement.classList.add('selected');                 
    }

    // Recalculate Requirement Text and Button Status
    let reqTextArray = [];
    let allSatisfied = true;

    for (const [reqType, reqAmt] of Object.entries(currentRecipe.cost)) {
        const selectedAmt = selectedIngots[reqType].length;
        reqTextArray.push(`${selectedAmt}/${reqAmt} ${reqType}`);
        
        if (selectedAmt !== reqAmt) allSatisfied = false; // If even ONE material is short, lock the button
    }

    document.getElementById('smithyRequirement').textContent = reqTextArray.join(' | ');
    document.getElementById('confirmCraftBtn').disabled = !allSatisfied;
}

// --- CLOSE MODAL ---
function closeSmithyUI() {
    document.getElementById('smithyModal').classList.add('hidden'); 
    currentRecipe = null;                                        
    selectedIngots = {};                                         
}

// --- EXECUTE CRAFTING ---
function executeCrafting() {
    if (!currentRecipe) return;

    // Final safety check: ensure every requirement was perfectly met
    for (const [type, amount] of Object.entries(currentRecipe.cost)) {
        if (selectedIngots[type].length !== amount) return; 
    }

    let satchel = loadData('satchelData', DEFAULT_SATCHEL);      
    
    let totalQuality = 0;                                        
    let totalIngotsSpent = 0;

    // Loop through every material spent
    for (const [type, amount] of Object.entries(currentRecipe.cost)) {
        
        // CRITICAL: Sort indices descending to prevent array-shift bugs when deleting!
        selectedIngots[type].sort((a, b) => b - a);

        selectedIngots[type].forEach(index => {
            const removedIngot = satchel.ingots[type].splice(index, 1)[0]; 
            totalQuality += removedIngot.quality;                    
            totalIngotsSpent++;
        });
    }

    // Calculate final average quality across ALL spent materials
    const avgQuality = Math.floor(totalQuality / totalIngotsSpent);

    saveData('satchelData', satchel);
    if (typeof renderSatchel === 'function') renderSatchel();    

    // Create the final Equipment Object
    const newGear = {
        id: currentRecipe.id,
        name: currentRecipe.name,
        desc: currentRecipe.desc,
        quality: avgQuality,                                     
        icon: `../assets/${currentRecipe.id || 'default_gear'}.png`,
        slot: currentRecipe.slot 
    };

    let equipment = loadData('playerEquipment', DEFAULT_EQUIPMENT);

    // --- SMART AUTO-EQUIP OR STORE ---
    if (!equipment[currentRecipe.slot]) {
        equipItem(currentRecipe.slot, newGear);
        showTemporaryMessage(`Forged and equipped a ${avgQuality}% quality ${currentRecipe.name}!`);
    } else {
        let gearInv = loadData('unequippedGear', []);
        gearInv.push(newGear);
        saveData('unequippedGear', gearInv);
        if (typeof renderInventory === 'function') renderInventory();
        showTemporaryMessage(`Forged a ${avgQuality}% quality ${currentRecipe.name}! (Placed in Backpack)`);
    }
    
    if (typeof addExpPoint === 'function' && typeof XP_REWARDS !== 'undefined') {
        addExpPoint(XP_REWARDS.craftItem);
    }  
    closeSmithyUI();
}

// --- STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    renderBlacksmithMenu();
});