# AGENTS.md - Ross Donohoe Development Guide

This is a simple static site (vanilla HTML/CSS/JS) that simulates a terminal emulator. There is no build system, no package manager, and no test framework.

## Project Overview

- **Type**: Static website (personal portfolio with terminal emulator)
- **Tech Stack**: Plain HTML5, CSS3, vanilla JavaScript (ES6+)
- **Build**: None (served directly)
- **Testing**: None

## Commands

### Running the Site

Since this is a static site with no build step, you can serve it directly:

```bash
# Using Python
python3 -m http.server 8000

# Using npx
npx serve .

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

### Single Test

No tests exist. If adding tests, use a simple approach:

```bash
# Example with Playwright
npx playwright test

# Example with Jest
npm test
```

### Linting

No linter is configured. If adding one:

```bash
# ESLint
npx eslint .

# Prettier
npx prettier --check .
```

## Code Style Guidelines

### General Principles

- Keep it simple - this is a vanilla JS project, avoid adding frameworks
- Write code that is readable and self-documenting
- Use semantic HTML
- Use CSS custom properties for theming when applicable

### JavaScript

**Formatting**
- Use 2 spaces for indentation
- Use single quotes for strings (except when string contains single quotes)
- Always use semicolons
- Use meaningful variable/function names (camelCase)
- Max line length: ~100 characters (soft guideline)

**Naming Conventions**
- Variables and functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` (e.g., `CONSTANTS`, `STRING_TO_HTML`)
- Classes: `PascalCase` (e.g., `class Path`)
- CSS classes: `kebab-case` (e.g., `.terminal-line`)

**Functions**
- Use arrow functions for callbacks and short functions
- Use `function` keyword for methods that need `this` context
- Keep functions focused and small (single responsibility)
- Use JSDoc comments for complex functions

**Example**:
```javascript
const STRING_TO_HTML = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
};

function encodeHtml(text) {
  return STRING_TO_HTML[text] || text;
}

class Path {
  static resolve(_path = "") {
    // implementation
  }
}
```

**Error Handling**
- No try/catch needed for simple scripts (runs in browser)
- Validate inputs at function boundaries
- Provide meaningful error messages in the terminal output

**Imports/Dependencies**
- No external dependencies
- All code in a single `index.js` file (or split logically if growing)
- Access DOM via `document.querySelector` and `document.createElement`

### CSS

**Formatting**
- Use 2 spaces for indentation
- One selector per line for multi-line rules
- Use shorthand properties where appropriate
- Put media queries at the end of the file or group logically

**Naming**
- Use BEM-like naming: `.block__element--modifier`
- Example: `.terminal-line`, `.header-control--close`

**Properties**
- Use CSS custom properties for colors if theming needed
- Use flexbox and grid for layout
- Use `rem` for font sizes, `dvh`/`dvw` for viewport units

**Example**:
```css
.terminal {
  box-sizing: border-box;
  background-color: #2d2d2d;
  color: #f8f8f2;
}

.terminal-line {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
```

### HTML

**Structure**
- Use HTML5 semantic elements (`<header>`, `<main>`, `<nav>`)
- Include appropriate meta tags
- Use accessible attributes (`lang`, `alt`, `aria-*`)

**Example**:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Ross Donohoe - Software Engineer</title>
    <meta name="description" content="Ross Donohoe - Software Engineer" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="terminal"></main>
    <script src="index.js"></script>
  </body>
</html>
```

## Adding Dependencies

If you need to add a dependency (e.g., for analytics, fonts):

1. Prefer CDN links in HTML over npm packages
2. If npm is needed, initialize with `npm init -y`
3. Keep dependencies minimal

## Making Changes

1. Test in multiple browsers (Chrome, Firefox, Safari)
2. Verify responsive behavior on mobile
3. Check console for errors
4. For terminal commands, test both valid and invalid inputs

## File Structure

```
/
├── index.html      # Main HTML file
├── index.js       # Terminal emulator logic
├── styles.css     # All styles
└── *.png, *.ico   # Favicons and icons
```

## Notes

- The terminal emulator is the core feature - any changes should preserve the interactive CLI experience
- The site should work offline (no external API dependencies)
- Keep the "fake" terminal feel authentic
