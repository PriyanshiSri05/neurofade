// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Neuro-Fade extension installed successfully.");
  
  // Set default settings
  chrome.storage.local.set({
    enabled: true,
    sensitivity: 50, // 0 to 100
    baseFadeTimeMs: 30000 // 30 seconds baseline before full fade
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FADE_EVENT') {
    // In a real implementation this might log telemetry (if privacy allowed)
    // Here we can use this to keep track of how many videos were faded to show in popup stats
    chrome.storage.local.get(['fadedVideosCount'], (result) => {
      const count = result.fadedVideosCount || 0;
      chrome.storage.local.set({ fadedVideosCount: count + 1 });
    });
  }
});
