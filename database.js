// ==========================================================================
// MASTER GAME DATABASE
// All items, recipes, and game balance numbers live here!
// ==========================================================================

// --- 1. BASE ITEMS & EQUIPMENT (Collectibles) ---
const collectiblesDatabase = {
    key:      { id: 'key',      name: 'Key',      desc: 'Opens mysterious doors' },
    compass:  { id: 'compass',  name: 'Compass',  desc: 'Shows where you are on the map',  slot: 'offHand' },
    map:      { id: 'map',      name: 'Map',      desc: 'Unlocks the minimap' },
    backpack: { id: 'backpack', name: 'Backpack', desc: 'Allows you to carry items' },
    pickaxe:  { id: 'pickaxe',  name: 'Pickaxe',  desc: 'Used to mine ores',               slot: 'mainHand' },
    satchel:  { id: 'satchel',  name: 'Satchel',  desc: 'Holds heavy ores and ingots' }
};

// --- 2. CRAFTABLE ITEMS (Blacksmith Recipes) ---
const craftablesDatabase = {                                     
    iron_sword:                   { id: 'iron_sword',                   name: 'Iron Sword',             desc: 'A basic, sturdy blade.',                        slot: 'mainHand', cost: { iron: 3 } },
    copper_helmet:                { id: 'copper_helmet',                name: 'Copper Helmet',          desc: 'Offers light protection for your head.',        slot: 'head',     cost: { copper: 2 } },
    ring_of_smithing_forgiveness: { id: 'ring_of_smithing_forgiveness', name: 'Ring of Forgiveness',    desc: 'Rumored to slightly boost forging quality.',    slot: 'ring',     cost: { tin: 3 } },
    boots_of_the_traveller:       { id: 'boots_of_the_traveller',       name: 'Boots of the Traveller', desc: 'Lightweight boots for long journeys.',          slot: 'boots',    cost: { copper: 1 } },
    true_compass:                 { id: 'true_compass',                 name: 'True Compass',           desc: 'Always points to hidden truths.',               slot: 'offHand',  cost: { tin: 1, iron: 1 } }, // <-- Multi-ingredient!
    iron_compass:                 { id: 'iron_compass',                 name: 'Iron Compass',           desc: 'A heavy, reliable navigational tool.',          slot: 'offHand',  cost: { iron: 1 } }
};

// --- 3. MATERIALS (Ores & Ingots) ---
const materialsDatabase = {
    iron:   { id: 'iron',   name: 'Iron',   oreDesc: 'A heavy chunk of raw, unrefined iron.',     ingotDesc: 'A smelted bar of solid iron.' },
    copper: { id: 'copper', name: 'Copper', oreDesc: 'A gleaming chunk of raw copper.',           ingotDesc: 'A smelted bar of conductive copper.' },
    tin:    { id: 'tin',    name: 'Tin',    oreDesc: 'A lightweight chunk of raw, pliable tin.',  ingotDesc: 'A smelted bar of soft tin.' }
};

// --- 4. DEFAULT STARTING MEMORY ---
const DEFAULT_SATCHEL = {
    ores:   { iron: 0, copper: 0, tin: 0 },
    ingots: { iron: [], copper: [], tin: [] }
};

const DEFAULT_EQUIPMENT = {
    head: null, chest: null, legs: null, boots: null,
    hands: null, mainHand: null, offHand: null, 
    necklace: null, ring: null, potion: null
};

// --- 5. MINING CONFIGURATIONS ---
const MINING_CONFIG = {                          
    iron:   { requiredTool: 'pickaxe', spawnRange: [3, 5], baseParticles: 3, dropRange: [1, 3] },
    copper: { requiredTool: 'pickaxe', spawnRange: [4, 6], baseParticles: 2, dropRange: [1, 4] },
    tin:    { requiredTool: 'pickaxe', spawnRange: [1, 2], baseParticles: 4, dropRange: [1, 2] }
};

const ITEM_MODIFIERS = {                         
    pickaxe: { power: 0, yield: 0 } 
};

// --- 6. DAILY TIPS ---
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