// ==================== MAP LOGIC & FOG OF WAR ====================
// Define the Map Connections (Kept for future use if needed)
const MAP_GRAPH = {
    'index.html': ['castle_gate.html', 'notice_board.html', 'campfire.html', 'mine.html', 'tavern.html', 'market.html', 'blacksmith.html' ],
    'castle_gate.html': ['castle_hallway.html', 'castle_garden.html', 'notice_board.html', 'index.html', 'blacksmith.html'],
    'castle_hallway.html': ['office_room.html', 'castle_gate.html'],
    'office_room.html': ['castle_hallway.html'], 
    'castle_garden.html': ['campfire.html', 'notice_board.html'], 
    'notice_board.html': ['castle_gate.html', 'castle_garden.html', 'campfire.html', 'index.html'], 
    'campfire.html': ['castle_garden.html', 'mine.html', 'index.html', 'notice_board.html'], 
    'mine.html': ['campfire.html', 'index.html'], 
    'tavern.html': ['market.html'], 
    'market.html': ['blacksmith.html', 'index.html', 'tavern.html', 'smeltery.html'], 
    'blacksmith.html': ['castle_gate.html', 'index.html', 'market.html', 'smeltery.html'], 
    'smeltery.html': ['blacksmith.html', 'market.html']
};

// --- TRAVEL CONFIGURATION ---
const BASE_TRAVEL_TIME_MS = 3000;

// Databank for gear that speeds up fast travel
const TRAVEL_MODIFIERS = {
    'boots_of_the_traveller': { timeReduction: 500 }, // Shaves 0.5 seconds off travel time
    'true_compass': { timeReduction: 500 }    // Shaves 0.5 seconds off travel time
    'iron_compass': {timeReduction: 250 }       // 0.25ec
};


document.addEventListener('DOMContentLoaded', () => {
    applyFogOfWar();
});

function calculateTravelTime() {
    let finalTime = BASE_TRAVEL_TIME_MS;
    
    // 1. Check what the player is wearing
    const equipment = loadData('playerEquipment', {}); 
    
    // 2. Loop through their equipped items
    Object.values(equipment).forEach(item => {
        // If the item exists and is in our dictionary then:
        if (item && item.id && TRAVEL_MODIFIERS[item.id]) {
            // Subtract its specific time from the timer
            finalTime -= TRAVEL_MODIFIERS[item.id].timeReduction; 
        }
    });
    // 3. Don't let travel time go below 0
    return Math.max(0, finalTime); 
}

function applyFogOfWar() {
    // 1. Grab clean IDs from memory (default to 'index' instead of 'index.html')
    const visitedIds = loadData('visitedPages', []);
    const currentId = loadData('currentLocation', 'index');
    
    // Hook up the "Go Back" link
    const goBackLink = document.getElementById('goBackLink');
    if (goBackLink) {
        // We add the .html back JUST for the clickable link. If index, use root to keep it clean
        goBackLink.href = currentId === 'index' ? '/' : `${currentId}.html`; 
    }

    // Loop through every pin on the map
    document.querySelectorAll('.map-pin').forEach(pin => {
        // We now rely purely on the data-id for     logic
        const pinId = pin.getAttribute('data-id');
        
        // We still need the target URL for the actual teleportation link
        const pinHref = pin.getAttribute('data-href') || `${pinId}.html`; 

        pin.className = 'map-pin'; // Reset classes

        // 1. CURRENT LOCATION (Compare IDs directly!)
        if (currentId === pinId) {
            pin.classList.add('pin-current');
            
            pin.onclick = (e) => {
                e.stopPropagation();
                if (pin.hasAttribute('data-href')) { // Standard location
                    if (typeof showTemporaryMessage === 'function') showTemporaryMessage("You are already here.");
                } else { // Office Menu
                    toggleOfficeMenu(e, pin);
                }
            };
            
        // 2. VISITED LOCATION (Compare IDs directly!)
        } else if (visitedIds.includes(pinId)) {
            pin.classList.add('pin-visited');
            
            pin.onclick = (e) => {
                e.stopPropagation();
                if (pin.hasAttribute('data-href')) {
                    pin.style.pointerEvents = 'none'; 

                    const travelTime = calculateTravelTime();

                    if (typeof showTemporaryMessage === 'function') {
                        // message is dynamic
                        // Divide by 1000 to turn milliseconds into seconds
                            let roundedSeconds = Math.round(travelTime / 1000);
                            
                            // Inject it into the message! (added a plural check for 'second' vs 'seconds')
                            showTemporaryMessage(`You will arrive in approximately ${roundedSeconds} second${roundedSeconds === 1 ? '' : 's'}...`);
                        }
                    }
                    setTimeout(() => { window.location.href = pinHref; }, travelTime);

                    if (typeof showTemporaryMessage === 'function') showTemporaryMessage("You will be transported momentarily...");
                    setTimeout(() => { window.location.href = pinHref; }, 3000);
                } else {
                    toggleOfficeMenu(e, pin);
                }
            };

        // 3. UNVISITED LOCATION
        } else {
            pin.classList.add('pin-unvisited');
            
            pin.onclick = (e) => {
                e.stopPropagation();
                if (typeof showTemporaryMessage === 'function') {
                    showTemporaryMessage("You haven't visited this place yet, fast travel is not possible.");
                }
            };
        }
    });
}

// --- OFFICE POPUP MENU ---
function toggleOfficeMenu(event, pinElement) {
    event.stopPropagation(); // Stop click from triggering other things
    
    const menu = document.getElementById('officeMenu');
    
    // Position the menu right next to the pin that was clicked
    menu.style.top = (pinElement.offsetTop + 20) + 'px';
    menu.style.left = (pinElement.offsetLeft + 20) + 'px';
    
    // Toggle visibility
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Close the office menu if you click anywhere else on the map
document.addEventListener('click', () => {
    const menu = document.getElementById('officeMenu');
    if (menu) menu.style.display = 'none';
});