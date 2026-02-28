# Neuro-Fade

A browser extension that uses on-device AI to gently fade short-form videos to help reduce dopamine addiction and mindless scrolling.

## What It Is

Short-form video apps like TikTok, Instagram Reels, and YouTube Shorts are designed to be addictive using rapid scene cuts, loud colors, fast motion, and infinite scroll loops.

Instead of blocking the app or limiting screen time (which people just override), Neuro-Fade takes a subtler approach. It modifies the video itself in real time to gently reduce its addictive stimulation, so your brain naturally wants to disengage without relying on willpower.

## How It Works

It watches the video stream and uses lightweight *on-device computer vision* to detect high-dopamine patterns:
- Rapid scene cuts
- High motion density

When it detects these patterns, it quietly applies neuro-calming transformations to the video:
- 🎨 **Gradual grayscale** — color slowly drains away
- 🎵 **Pitch lowering** — audio becomes slightly flatter
- ⏱️ **Playback slowdown** — video slows down to ~85%
- 🌫️ **Contrast softening** — image becomes less sharp and punchy

💡 **Privacy First**: Everything runs 100% locally. No video, audio, or personal data ever leaves your phone or browser.

## How to Install (Chrome / Edge / Brave)

Currently, the extension is in prototype mode and can be installed manually.

1. Click the green **Code** button at the top of this repository and select **Download ZIP**.
2. Unzip the downloaded file somewhere on your computer.
3. Open your browser and go to `chrome://extensions/` (or `edge://extensions/`).
4. Turn on **Developer mode** in the top right corner.
5. Click **Load unpacked** in the top left corner.
6. Select the `neuro-fade` folder you unzipped.
7. You're done! Go to YouTube Shorts or TikTok and watch videos.

## Settings

Click the Neuro-Fade puzzle piece icon in your extension bar to adjust:
- **Sensitivity:** How aggressively it detects rapid cuts and motion.
- **Base Fade Time:** How many seconds it takes to reach maximum fading (default is 30 seconds).
