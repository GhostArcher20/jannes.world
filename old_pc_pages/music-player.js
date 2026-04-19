// ==================== MUSIC PLAYER + DRAGGABLE + DOUBLE-CLICK ====================

// ----- Read playlist from HTML (JSON script) -----
let playlist = [];
try {
    const playlistScript = document.getElementById('playlist-json');
    if (playlistScript) {
        playlist = JSON.parse(playlistScript.textContent);
    } else {
        console.warn('Playlist JSON not found; using fallback empty array.');
    }
} catch (e) {
    console.error('Failed to parse playlist JSON', e);
}

// ----- Elements -----
const audio = document.getElementById('bg-music');
const player = document.querySelector('.wmp-player');
const playPauseBtn = document.querySelector('.play-pause-btn');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const muteBtn = document.querySelector('.mute-btn');
const volumeSlider = document.querySelector('.volume-slider');
const progressFill = document.querySelector('.progress-fill');
const timeCurrent = document.querySelector('.time-current');
const timeDuration = document.querySelector('.time-duration');

let currentTrack = 0;

// ----- Audio functions -----
function loadTrack(index) {
    if (!playlist.length) return;
    audio.src = playlist[index];
    audio.load();
    updateDurationDisplay();
}

function updateDurationDisplay() {
    if (!isNaN(audio.duration)) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        timeDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Update progress & current time
audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;

        const minutes = Math.floor(audio.currentTime / 60);
        const seconds = Math.floor(audio.currentTime % 60);
        timeCurrent.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
});

// Metadata loaded
audio.addEventListener('loadedmetadata', updateDurationDisplay);

// Play / Pause
playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸';
    } else {
        audio.pause();
        playPauseBtn.textContent = '⏵';
    }
});

// Previous track
prevBtn.addEventListener('click', () => {
    if (!playlist.length) return;
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
    audio.play();
    playPauseBtn.textContent = '⏸';
});

// Next track
nextBtn.addEventListener('click', () => {
    if (!playlist.length) return;
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
    audio.play();
    playPauseBtn.textContent = '⏸';
});

// Volume slider
volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

// Mute button
muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.classList.toggle('muted');
    muteBtn.textContent = audio.muted ? '🔇' : '🔊';
});

// Load first track (if playlist exists)
if (playlist.length) {
    loadTrack(0);
}

// ==================== DOUBLE-CLICK TO OPEN PLAYER ====================
const playerLauncher = document.querySelector('.desktop-icon[data-player-launcher="true"]');
if (playerLauncher) {
    playerLauncher.addEventListener('dblclick', (e) => {
        player.style.display = 'block';
        player.style.zIndex = '1000';
        audio.play();
        playPauseBtn.textContent = '⏸';
        e.preventDefault();
        e.stopPropagation();
    });
}

// ==================== DRAGGABLE FUNCTIONALITY ====================
let isDragging = false;
let offsetX, offsetY;

player.addEventListener('mousedown', (e) => {
    const tag = e.target.tagName.toLowerCase();
    const isInteractive = tag === 'button' || 
                         tag === 'input' || 
                         e.target.closest('button') || 
                         e.target.closest('input') ||
                         e.target.closest('.volume-slider') ||
                         e.target.closest('.progress-bar');

    if (isInteractive) return;

    e.preventDefault();
    isDragging = true;
    const rect = player.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    player.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    const maxLeft = window.innerWidth - player.offsetWidth;
    const maxTop = window.innerHeight - player.offsetHeight;
    newLeft = Math.min(Math.max(0, newLeft), maxLeft);
    newTop = Math.min(Math.max(0, newTop), maxTop);

    player.style.left = newLeft + 'px';
    player.style.top = newTop + 'px';

    e.preventDefault();
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        player.style.cursor = '';
    }
});

document.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        player.style.cursor = '';
    }
});