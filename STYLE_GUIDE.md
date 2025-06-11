# Style Guide for Application UI

This document outlines the defined styles to ensure a uniform and professional consistency across the application's user interface.

## 1. Button Standardization

This applies to interactive control buttons. The `.service-button` is treated separately due to its card-like nature.

**Target Elements:**
- `#themeToggle`
- `#viewToggle`
- `#installBtn`
- `#clearFavoritesBtn`
- `#sidebarToggle`

**Desktop Styles (Default):**
- **Font Size:** `1rem`
- **Padding:** `0.35rem 0.7rem`
- **Rationale:** Provides a consistent and readable size for all primary control buttons. This harmonizes the appearance, especially bringing `#sidebarToggle` in line with other controls.

**Mobile Styles (`@media (max-width: 768px)`):**
- **Font Size:** `0.9rem`
- **Padding:** `0.3rem 0.6rem`
- **Rationale:** Slightly reduced size and padding for better fit and proportionality on smaller screens, while maintaining visual consistency with the desktop style.

**Excluded Elements:**
- **`.service-button`:** This element functions as a "card" or "link item." Its current padding of `1rem` is appropriate for its content structure (thumbnail, text, star icon). No changes to its overall padding structure are proposed under this button standardization. Internal text or icon sizes within `.service-button` may be reviewed separately if needed.

## 2. Toggle Appearance

- **`#themeToggle` and `#viewToggle`:**
    - The current active/inactive styling (using `background: var(--accent-color); color: var(--bg-color);` for active, and `background: none; border: 2px solid var(--text-color);` for inactive) is considered consistent and provides clear visual feedback. No changes are proposed.
- **Category Toggles:**
    - **Expand/Collapse Chevrons (`.category h2 .chevron`):** These are part of the category header's interactive element and indicate accordion state.
    - **List/Grid View Toggles (`.category-view-toggle`):** These icons switch the view mode within a category.
    - **Rationale:** These toggles are functionally distinct from the header toggles (`#themeToggle`, `#viewToggle`). Their current appearances are contextually appropriate and do not need to match the header toggles.

## 3. Layout Widths

- **`--card-min-width`:**
    - Desktop: `300px`
    - Mobile: `240px`
- **`--category-min-width`:**
    - Desktop: `300px`
    - Mobile: `240px`
- **Rationale:** These CSS variables are used consistently for responsive grid layouts. The current values are deemed reasonable for maintaining readability and flow on different screen sizes. No changes are proposed.

## 4. Font Sizes (General)

- **Headers:**
    - `header h1`: `3rem` (Desktop), `2rem` (Mobile), `1.8rem` (Mobile with sidebar open)
    - `.category h2`: `1.8rem` (Desktop), `1.4rem` (Mobile)
- **Body Text:** Primarily inherits from `body` (`var(--font-family)`) and relies on standard browser font rendering.
- **Rationale:** Existing header font sizes establish a clear visual hierarchy. The main font inconsistency identified previously was related to buttons, which is addressed in Section 1. No other general font size changes are proposed.

## 5. Padding and Margins (General)

- Spacing for major layout sections (e.g., `header`, `main`, `footer`, `#sidebar`) and components (e.g., `.category h2`, `.category-content`) is generally consistent and uses `rem` units appropriately.
- **Rationale:** The primary padding inconsistencies identified previously were related to buttons, which is addressed in Section 1. No other general padding or margin changes are proposed.

## Summary of Key Values for Implementation:

**Buttons (Desktop - applicable to `#themeToggle`, `#viewToggle`, `#installBtn`, `#clearFavoritesBtn`, `#sidebarToggle`):**
- `font-size: 1rem;`
- `padding: 0.35rem 0.7rem;`

**Buttons (Mobile, `@media (max-width: 768px)` - applicable to `#themeToggle`, `#viewToggle`, `#installBtn`, `#clearFavoritesBtn`, `#sidebarToggle`):**
- `font-size: 0.9rem;`
- `padding: 0.3rem 0.6rem;`
