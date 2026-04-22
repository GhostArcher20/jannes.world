// ==================== MAP LOGIC & FOG OF WAR ====================
// 1. Define the Map Connections (Kept for future use if needed)
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

document.addEventListener('DOMContentLoaded', () => {
    applyFogOfWar();
});

function applyFogOfWar() {
    // Grab data from the browser memory
    const visitedStr = localStorage.getItem('visitedPages') || '[]';
    const visitedPages = JSON.parse(visitedStr);

    // Grab where the player is currently standing
    const currentLocation = localStorage.getItem('currentLocation') || 'index.html';

    // Hook up the "Go Back" link above the map
    const goBackLink = document.getElementById('goBackLink');
    if (goBackLink) {
        goBackLink.href = currentLocation;
    }

    // Loop through every pin on the map
    document.querySelectorAll('.map-pin').forEach(pin => {
        const pinHref = pin.getAttribute('data-href');
        const pinId = pin.getAttribute('data-id');

        // Figure out the file name this pin represents
        let targetFile = pinHref ? pinHref : `${pinId}.html`;

        // Reset classes to default before applying colors
        pin.className = 'map-pin';

        // 1. CURRENT LOCATION (Green)
        if (currentLocation === targetFile) {
            pin.classList.add('pin-current');

            pin.onclick = (e) => {
                e.stopPropagation();
                // If it's a normal location (not one with a sub menu)
                if (pinHref) {
                    if (typeof showTemporaryMessage === 'function') showTemporaryMessage("You are already here.");
                } else {
                    // If it's a Menu Pin (like the Office), open the menu
                    toggleOfficeMenu(e, pin);
                }
            };

            // 2. VISITED LOCATION (Orange)
        } else if (visitedPages.includes(targetFile)) {
            pin.classList.add('pin-visited');

            pin.onclick = (e) => {
                e.stopPropagation();

                // If it's a normal location (not one with a sub menu)
                if (pinHref) {
                    pin.style.pointerEvents = 'none';
                    if (typeof showTemporaryMessage === 'function') showTemporaryMessage("You will be transported momentarily...");

                    setTimeout(() => {
                        window.location.href = pinHref;
                    }, 3000);
                } else {
                    // If it's a Menu Pin, open the menu
                    toggleOfficeMenu(e, pin);
                }
            };

            // 3. UNVISITED LOCATION (Gray)
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