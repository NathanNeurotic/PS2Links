[![image](https://github.com/user-attachments/assets/1f7709bc-493c-4f5c-9793-6466f1108e07)](https://nathanneurotic.github.io/PS2Links)
# PS2Links Hub

PS2Links Hub is a static, yet feature-rich, web application that provides a curated collection of PlayStation 2 related resources. It leverages `links.json` for its data, dynamically rendering categorized links with a focus on user experience and customization. The interface has been modernized for improved usability while retaining its thematic roots.

## User Interface and Features

PS2Links Hub offers a comprehensive set of features:

- **Modernized Interface:** A refreshed UI that is clean, intuitive, and retains the project's thematic essence.
- **Categorized Listings:** Links are organized into logical categories, loaded dynamically from `links.json`.
- **Collapsible Sidebar:** Navigate quickly between categories using a sleek, collapsible sidebar. The currently viewed section is highlighted in the sidebar.
- **Category Management:**
    - **Expand/Collapse Individual Categories:** Easily show or hide the content of each category.
    - **Global Controls:** "Expand All" and "Collapse All" buttons allow for quick management of all categories simultaneously.
- **Enhanced Search & Filtering:**
    - **Tag-Based Search:** The search bar now supports filtering by tags. Single tags (e.g., `homebrew`) or multiple comma-separated tags (e.g., `utility,opl`) can be used to find items matching *all* specified tags.
    - **Broad Search Scope:** Search queries also match against link names, URLs, and category names.
    - **Tag Suggestions:** As you type in the search bar, relevant tag suggestions will appear, leveraging browser's native datalist functionality.
- **Favorites System:**
    - **Mark Favorites:** Easily mark any link as a favorite using the star icon (⭐).
    - **Dedicated Favorites Section:** Favorited links appear in a special "Favorites" category at the top for quick access.
    - **Clear Favorites:** A "Clear Favorites" button is available within the Favorites section.
- **Layout Customization:**
    - **Global View Toggle:** A header button allows switching all categories between a "Block" (grid-like card view) or "List" layout.
    - **Per-Category View Toggle:** Each category header contains an icon to toggle its specific view between grid and list, overriding the global setting for that category.
- **Copy Link Functionality:** Each link entry includes a "Copy URL" button (📋) for quickly copying the link to the clipboard.
- **Persistent Preferences:** Your preferences for theme, global and per-category view modes, and category open/closed states are saved locally in your browser and restored on subsequent visits.
- **Theme Toggle:** Switch between dark (default) and light themes using a dedicated header button.
- **Responsive Design:** The layout is optimized for various screen sizes, from desktop to mobile.
- **Mobile View Toggle:** Manually switch to a single-column mobile-friendly layout at any time via a header button.
- **PWA & Offline Support:** Installable as a Progressive Web App (PWA) for an app-like experience. The service worker caches key assets, including link data, favicons, and thumbnails, for offline availability. The app will also notify you if a new version is available, with a button to refresh and update.
- **Alphabetical Sorting:** Categories and the links within them are automatically sorted alphabetically by name.
- **Visuals:** Displays favicons for all links and thumbnails for links where a `thumbnail_url` is provided. Includes a typing animation in the header.
- **Direct Links:** All external links open in a new tab for convenience.

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
