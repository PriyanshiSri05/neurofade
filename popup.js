document.addEventListener('DOMContentLoaded', () => {
    const enabledCheckbox = document.getElementById('enabled');
    const sensitivitySlider = document.getElementById('sensitivity');
    const sensitivityVal = document.getElementById('sensitivity-val');
    const fadeTimeSlider = document.getElementById('fadeTime');
    const fadeTimeVal = document.getElementById('fadeTime-val');

    // Load existing settings
    chrome.storage.local.get(['enabled', 'sensitivity', 'baseFadeTimeMs'], (result) => {
        enabledCheckbox.checked = result.enabled !== undefined ? result.enabled : true;

        if (result.sensitivity !== undefined) {
            sensitivitySlider.value = result.sensitivity;
            sensitivityVal.textContent = result.sensitivity;
        }

        if (result.baseFadeTimeMs !== undefined) {
            const seconds = result.baseFadeTimeMs / 1000;
            fadeTimeSlider.value = seconds;
            fadeTimeVal.textContent = seconds;
        }
    });

    // Save on change
    enabledCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ enabled: enabledCheckbox.checked });
    });

    sensitivitySlider.addEventListener('input', () => {
        sensitivityVal.textContent = sensitivitySlider.value;
        chrome.storage.local.set({ sensitivity: parseInt(sensitivitySlider.value, 10) });
    });

    fadeTimeSlider.addEventListener('input', () => {
        fadeTimeVal.textContent = fadeTimeSlider.value;
        chrome.storage.local.set({ baseFadeTimeMs: parseInt(fadeTimeSlider.value, 10) * 1000 });
    });
});
