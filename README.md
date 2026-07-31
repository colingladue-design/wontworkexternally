# Workout Tracker

A single-page workout tracker that installs to the iPhone home screen and runs
full-screen, with no App Store and no backend. Data lives in `localStorage` on
the phone.

**Live:** https://colingladue-design.github.io/wontworkexternally/

## Add it to the home screen

1. Open the link above **in Safari** (Chrome on iOS can't install web apps).
2. Tap the Share button, then **Add to Home Screen**.
3. Tap **Add**. It lands on your home screen as "Workout".

Launching from that icon opens it full-screen with no Safari chrome, and it
works offline.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and the iOS home-screen meta tags |
| `app.js` | Tracker logic and `localStorage` persistence |
| `style.css` | Styling, including safe-area padding for the notch |
| `manifest.webmanifest` | Web app manifest — name, icons, standalone display |
| `sw.js` | Service worker that caches the app shell for offline use |
| `apple-touch-icon.png` | 180×180 icon iOS uses on the home screen |
| `icon-192.png`, `icon-512.png` | Manifest icons |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Notes

- GitHub Pages serves this from the repository's default branch, so changes go
  live only once they land there.
- iOS caches the home-screen icon aggressively. If you change
  `apple-touch-icon.png`, delete the icon from the home screen and re-add it.
- The service worker uses stale-while-revalidate, so an edit shows up the
  *second* time you open the app after deploying.
