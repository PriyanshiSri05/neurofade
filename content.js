// content.js
console.log("Neuro-Fade content script loaded.");

// --- Configuration & State ---
let config = {
    enabled: true,
    sensitivity: 50,
    maxGrayscale: 100, // percentage
    maxContrastDrop: 30, // drops to 70% contrast
    minPlaybackRate: 0.5, // slows down by 50%
    baseFadeTimeMs: 30000 // default 30s to full fade
};

let currentVideo = null;
let fadeLevel = 0; // 0.0 to 1.0 (0 is normal, 1 is fully faded)
let dopamineScore = 0; // tracks accumulated stimulation (cuts, motion)
let isFading = false;
let updateInterval = null;

// AI / Computer Vision variables
let cvCanvas = null;
let cvContext = null;
let lastImageData = null;
const CV_FPS = 5; // analyze 5 frames per second
let cvInterval = null;

// Load config
chrome.storage.local.get(['enabled', 'sensitivity', 'baseFadeTimeMs'], (res) => {
    if (res.enabled !== undefined) config.enabled = res.enabled;
    if (res.sensitivity !== undefined) config.sensitivity = res.sensitivity;
    if (res.baseFadeTimeMs !== undefined) config.baseFadeTimeMs = res.baseFadeTimeMs;
});

// Update config on change
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.enabled) config.enabled = changes.enabled.newValue;
        if (changes.sensitivity) config.sensitivity = changes.sensitivity.newValue;
        if (changes.baseFadeTimeMs) config.baseFadeTimeMs = changes.baseFadeTimeMs.newValue;
    }
});

function initCV() {
    if (!cvCanvas) {
        cvCanvas = document.createElement('canvas');
        cvCanvas.width = 64; // downscale for fast processing
        cvCanvas.height = 64;
        cvContext = cvCanvas.getContext('2d', { willReadFrequently: true });
    }
}

function analyzeVideoFrame(video) {
    if (!config.enabled || video.paused || video.ended) return;

    cvContext.drawImage(video, 0, 0, cvCanvas.width, cvCanvas.height);
    const currentImageData = cvContext.getImageData(0, 0, cvCanvas.width, cvCanvas.height).data;

    if (lastImageData) {
        let diffSum = 0;
        const pixels = currentImageData.length / 4;

        // Calculate sum of absolute differences for luma
        for (let i = 0; i < currentImageData.length; i += 4) {
            // rough luma
            const luma1 = currentImageData[i] * 0.299 + currentImageData[i + 1] * 0.587 + currentImageData[i + 2] * 0.114;
            const luma2 = lastImageData[i] * 0.299 + lastImageData[i + 1] * 0.587 + lastImageData[i + 2] * 0.114;
            diffSum += Math.abs(luma1 - luma2);
        }

        const avgDiff = diffSum / pixels; // average pixel difference (0 to 255)

        // Heuristics for "High Dopamine" Features
        const CUT_THRESHOLD = 50; // High average diff indicates a full scene change
        const MOTION_WEIGHT = 0.5;

        let frameDopamineContribution = 0;

        if (avgDiff > CUT_THRESHOLD) {
            // Rapid scene cut detected! Spike the dopamine score
            frameDopamineContribution += 15.0;
            console.debug("Neuro-Fade: Scene cut detected.");
        } else {
            // Continuous motion
            frameDopamineContribution += avgDiff * MOTION_WEIGHT;
        }

        // Apply sensitivity multiplier
        const sensitivityMultiplier = (config.sensitivity / 50.0); // 1.0 at default 50 sensitivity
        dopamineScore += (frameDopamineContribution * sensitivityMultiplier);
    }

    // Save current frame for next diff
    lastImageData = new Uint8ClampedArray(currentImageData);
}

function applyFade(video, level) {
    if (!video) return;

    const grayscaleVal = level * config.maxGrayscale;
    const contrastVal = 100 - (level * config.maxContrastDrop);

    // Visual transformations: gradual grayscale and contrast softening
    video.style.filter = `grayscale(${grayscaleVal}%) contrast(${contrastVal}%)`;

    // Audio transformations: pitch lowering and playback slowdown
    if ('preservesPitch' in video) {
        video.preservesPitch = false;
    }
    const targetPlaybackRate = 1.0 - (level * (1.0 - config.minPlaybackRate));

    // Only apply playback rate if we are actually deviating from 1.0 to avoid breaking native speeds unnecessarily
    if (Math.abs(video.playbackRate - targetPlaybackRate) > 0.01) {
        video.playbackRate = targetPlaybackRate;
    }
}

function resetFade(video) {
    if (video) {
        video.style.filter = '';
        video.playbackRate = 1.0;
        if ('preservesPitch' in video) {
            video.preservesPitch = true;
        }
    }
    fadeLevel = 0;
    dopamineScore = 0;
    lastImageData = null;
}

function getActiveShortVideo() {
    // Check if we're on a likely short-form video URL
    const isShorts = window.location.href.includes('/shorts/');
    const isTikTok = window.location.hostname.includes('tiktok.com');
    const isReels = window.location.href.includes('/reels/');

    if (!isShorts && !isTikTok && !isReels) return null;

    // Find the video taking most screen space or is actively playing
    const videos = Array.from(document.querySelectorAll('video'));
    let bestVideo = null;
    let maxArea = 0;

    for (const video of videos) {
        const rect = video.getBoundingClientRect();
        // Check if video is visible in the viewport
        if (rect.width > 0 && rect.height > 0) {
            const area = rect.width * rect.height;
            // Heuristic: Must be reasonably large, usually taller than it is wide 
            if (area > 50000 && rect.height >= rect.width - 50) {
                // If it's playing, prefer it immediately. Otherwise, keep the largest visible one.
                if (!video.paused) {
                    return video;
                }
                if (area > maxArea) {
                    maxArea = area;
                    bestVideo = video;
                }
            }
        }
    }
    return bestVideo;
}

function updateEngine() {
    const activeVideo = getActiveShortVideo();

    if (!activeVideo || !config.enabled) {
        // Even if paused, we must continuously apply the fade. 
        // YouTube/TikTok aggressively reset styles and playback rates when paused or scrolling.
        if (currentVideo && config.enabled) {
            applyFade(currentVideo, fadeLevel);
        }
        return;
    }

    // Did the user swipe to a new video?
    // We update currentVideo but DO NOT reset the fade! The punishment persists.
    if (activeVideo !== currentVideo || (currentVideo && activeVideo.currentSrc !== currentVideo.currentSrc)) {
        currentVideo = activeVideo;
    }

    if (!activeVideo.paused) {
        // --- Calculate Fade Progression ---
        const timeStepMs = 1000 / CV_FPS;
        const baseIncrement = timeStepMs / config.baseFadeTimeMs;
        const dopamineIncrement = (dopamineScore / 100) * 0.005;
        dopamineScore = 0; // Consume the score

        fadeLevel = Math.min(1.0, fadeLevel + baseIncrement + dopamineIncrement);
    }

    // Always apply fade to fight against YouTube/TikTok resetting the DOM
    applyFade(currentVideo, fadeLevel);
}

// Start Main Loops
initCV();
cvInterval = setInterval(() => {
    if (currentVideo && config.enabled) {
        analyzeVideoFrame(currentVideo);
    }
    updateEngine(); // sync logic with frame analysis
}, 1000 / CV_FPS);
