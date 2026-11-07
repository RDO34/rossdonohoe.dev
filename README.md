# rossdonohoe.dev

A small personal desktop: the original terminal and browser, plus an About
document. Vanilla HTML, CSS and JavaScript; no build step.

Run `python3 -m http.server 8000`, then open http://localhost:8000.

- `index.html`: desktop apps and condensed CV content.
- `index.js`: original terminal, virtual filesystem and terminal/browser controls.
- `desktop.js`: document windows, app focus, dock, clock and CV terminal files.
- `styles.css`: desktop wallpaper, original window chrome and CV document styling.
- `browser-home.html`: local browser bookmarks page.
- `fonts/`: locally hosted CV fonts and SIL Open Font Licenses.

Click a desktop shortcut or dock button to open an app. Title bars support dragging;
window controls close, minimise and maximise. Reopen apps from the dock. Document
windows can be resized from every edge and corner. Smaller screens use a single
frontmost app and provide a native command field for the terminal.

Try `open about`, `cat experience.txt`, `cat skills.txt` or `help`.
The terminal's CV files come from the document, keeping the content in sync.
The document condenses `../cv/index.html`, retaining roles, dates, skills, education,
interests and contacts while omitting job achievement bullets.

The desktop, document and browser start page work without external services.
The original terminal's optional GitHub project exploration uses the GitHub API;
external browser navigation also requires a connection. With JavaScript disabled,
the About document remains readable and scrollable.

## Security

Terminal output, filenames, command history and fetched repository content render as
text. Contact links allow only HTTP(S), email and phone URLs and use `noopener
noreferrer`. The embedded browser accepts only HTTP(S) navigation and has an opaque
sandbox origin, preventing embedded pages from accessing the desktop. The terminal
is a simulation: `node` does not evaluate JavaScript. A Content Security Policy
restricts scripts to local files and blocks inline handlers, plugins and base tags.
