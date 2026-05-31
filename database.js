// ==========================================================================
// MASTER GAME DATABASE
// All items, recipes, and game balance numbers live here!
// ==========================================================================

// --- 1. BASE ITEMS & EQUIPMENT ---
const itemDatabase = {
    key:      { name: 'Key',      desc: 'Opens mysterious doors',      img: '../assets/key.png' },
    compass:  { name: 'Compass',  desc: 'Shows where you are on the map', img: '../assets/compass.png', slot: 'offHand' },
    map:      { name: 'Map',      desc: 'Unlocks the minimap',         img: '../assets/map-item.png' },
    backpack: { name: 'Backpack', desc: 'Allows you to carry items',   img: '../assets/backpack.png' },
    pickaxe:  { name: 'Pickaxe',  desc: 'Used to mine ores',           img: '../assets/pickaxe.png', slot: 'mainHand' },
    satchel:  { name: 'Satchel',  desc: 'Holds heavy ores and ingots', img: '../assets/satchel.png' }
};

// --- 2. DEFAULT STARTING MEMORY ---
const DEFAULT_SATCHEL = {
    ores:   { iron: 0, copper: 0, tin: 0 },
    ingots: { iron: [], copper: [], tin: [] }
};

const DEFAULT_EQUIPMENT = {
    head: null, chest: null, legs: null, boots: null,
    hands: null, mainHand: null, offHand: null, 
    necklace: null, ring: null, potion: null
};

// --- 3. BLACKSMITH RECIPES ---
const BLACKSMITH_RECIPES = {                                     
    iron_sword:                  { id: 'iron_sword',                  name: 'Iron Sword',             slot: 'mainHand', cost: { type: 'iron',   amount: 3 } },
    copper_helmet:               { id: 'copper_helmet',               name: 'Copper Helmet',          slot: 'head',     cost: { type: 'copper', amount: 2 } },
    ring_of_smithing_forgiveness:{ id: 'ring_of_smithing_forgiveness', name: 'Ring of Forgiveness',   slot: 'ring',     cost: { type: 'tin',    amount: 3 } },
    boots_of_the_traveller:      { id: 'boots_of_the_traveller',      name: 'Boots of the Traveller', slot: 'boots',    cost: { type: 'copper', amount: 1 } },
    true_compass:                { id: 'true_compass',                name: 'True Compass',           slot: 'offHand',  cost: { type: 'tin',    amount: 1 } },
    iron_compass:                { id: 'iron_compass',                name: 'Iron Compass',           slot: 'offHand',  cost: { type: 'iron',   amount: 1 } }
};

// --- 4. MINING CONFIGURATIONS ---
const MINING_CONFIG = {                          
    iron:   { requiredTool: 'pickaxe', spawnRange: [3, 5], baseParticles: 3, dropRange: [1, 3] },
    copper: { requiredTool: 'pickaxe', spawnRange: [4, 6], baseParticles: 2, dropRange: [1, 4] },
    tin:    { requiredTool: 'pickaxe', spawnRange: [1, 2], baseParticles: 4, dropRange: [1, 2] }
};

const ITEM_MODIFIERS = {                         
    pickaxe: { power: 0, yield: 0 } 
};

// --- 5. DAILY TIPS ---
const DAILY_TIPS = [
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