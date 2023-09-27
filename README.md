# TTTakedown Tracker
Automaticially detects when SSSniperWolf takes down a clip or video, reporting to a Discord channel.

The `data` folder has a JSON file for each of SSSniperWolf's videos, updated every 6 hours by GitHub Actions. When a video is published or deleted or the title or length changes, a clean embed is posted to a Discord webhook.
