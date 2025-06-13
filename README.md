[![image](https://github.com/user-attachments/assets/1f7709bc-493c-4f5c-9793-6466f1108e07)](https://nathanneurotic.github.io/PS2Links)
# PS2 Resource Links

PS2 Resource Links is a static collection of PlayStation 2 related sites. Link data lives in `links.json`, which now groups services under category objects, and is displayed with simple JavaScript and CSS.

## Features

PS2Links Hub is designed with a retro-terminal aesthetic and offers a range of features for a user-friendly experience:

- **Categorized Listings:** Links are organized into collapsible categories, loaded dynamically from `links.json`.
- **Collapsible Sections:** Easily expand and collapse categories. Your preference for which categories are open or closed is saved locally and restored on your next visit.
- **Quick Search:** Instantly filter links by name or URL using the search bar. The search also includes tags and category names, with suggestions appearing as you type.
- **Favorites System:** Mark any link as a favorite using the star icon. Favorites are saved locally and displayed in a dedicated 'Favorites' category for quick access.
- **Theme Toggle:** Switch between dark (default) and light themes. Your choice is saved locally.
- **Responsive Design:** The layout is optimized for various screen sizes, from desktop to mobile.
- **Mobile View Toggle:** Manually switch to a single-column mobile-friendly layout at any time.
- **Category View Toggle:** Each category's content can be displayed as a grid (default) or a list. This preference is saved per category.
- **Sidebar Navigation:** Quickly jump to categories using the collapsible sidebar.
- **PWA & Offline Support:** Installable as a Progressive Web App (PWA) for an app-like experience. Key assets, including link data, favicons, and thumbnails, are cached for offline availability.
- **Alphabetical Sorting:** Categories and the links within them are automatically sorted alphabetically.
- **Visuals:** Displays favicons for all links and thumbnails for links where a `thumbnail_url` is provided in `links.json`. Includes a typing animation in the header.
- **Direct Links:** All links open in a new tab for convenience.

## Running Locally

This project is entirely client‑side. You can open the site by loading `index.html` in any modern browser.

```bash
# clone the repository if you have not already
# git clone <this repo>
# cd PS2Links

# open index.html (double‑click it or use your browser's Open File option)
```

Some browsers restrict `fetch` when using the `file://` protocol. If the links do not load, start a simple local server instead:

```bash
# from inside the repository
python3 -m http.server 3000
```

Then visit `http://localhost:3000/index.html` in your browser. `script.js` fetches `links.json` at page load and dynamically builds the categorized link lists from the nested data structure.

## Manual QA

Manual testing instructions are documented in [MANUAL_TESTING_PLAN.md](MANUAL_TESTING_PLAN.md).

## Automated Tests

Playwright tests live in `tests/`. Install dependencies and run:

```bash
npm install
npm test
```

The tests start a local server automatically by running `npx http-server -p 3000` before executing the test suite. They cover view toggling, theme switching, and favorites persistence.


## License

This project is released under the [MIT License](LICENSE).
