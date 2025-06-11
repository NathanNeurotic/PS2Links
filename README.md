[![image](https://github.com/user-attachments/assets/1f7709bc-493c-4f5c-9793-6466f1108e07)](https://nathanneurotic.github.io/PS2Links)
# PS2 Resource Links

PS2 Resource Links is a static collection of PlayStation 2 related sites. The page is built from `services.json` and displayed with simple JavaScript and CSS.

## Features

- **Search** – Filter links instantly by typing in the search bar. Matching categories automatically expand while you search.
- **Theme Toggle** – Use the **Toggle Theme** button to switch between light and dark modes. Your choice is remembered with `localStorage`.
- **Favorites** – Click the star next to any link to add it to your favorites list. Favorites persist across page reloads and appear in their own section.

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

Then visit `http://localhost:3000/index.html` in your browser. `script.js` fetches `services.json` at page load and dynamically builds the categorized link lists.

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

