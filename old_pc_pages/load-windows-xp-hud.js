// ==================== INJECT WINDOWS XP HUD ====================
function injectWindowsXPHUD() {
    // Create taskbar container
    const taskbarHTML = `
        <div class="xp-taskbar">
            <div class="taskbar-start">
            	<img src="../assets/taskbar_start.png" alt="Start" id="start-button" style="cursor: pointer;">
        	</div>
            <div class="taskbar-background"></div>
            <div class="taskbar-right-menu"><img src="../assets/taskbar_right_menu.png" alt="System Tray"></div>
        </div>
        <div id="start-menu" class="start-menu">
            <a href="socials.html" class="menu-item"><img src="../assets/socials_icon.png" alt="socials"> My socials!</a>
            <a href="old_pc_hub.html" class="menu-item"><img src="../assets/blog_hub.png" alt="blog"> My blogs!</a>	
            <a href="../office_room.html" class="menu-item"><img src="../assets/windows_xp_shutdown.png" alt="shutdown"> Shut down computer</a>
        </div>
        <a href="old_desktop.html" class="minimize-menu" style="cursor: pointer;">
            <img src="../assets/xp_upper_right_minimize.png" alt="Minimize">
            <span>Go to old desktop</span>
        </a>
    `;

    // Insert at the end of body
    document.body.insertAdjacentHTML('beforeend', taskbarHTML);
}

// ==================== START BUTTON FUNCTIONALITY ====================
function initStartMenu() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    if (startBtn && startMenu) {
        startBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', function(e) {
            if (!startMenu.contains(e.target) && e.target !== startBtn) {
                startMenu.style.display = 'none';
            }
        });
    }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', function() {
    injectWindowsXPHUD();  // adds the HTML to the page
    initStartMenu();       // adds the click functionality
});