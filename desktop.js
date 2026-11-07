// Desktop documents extend the original terminal and browser windows.
const appWindows = [...document.querySelectorAll('.window-frame')];
const dockButtons = [...document.querySelectorAll('.desktop-dock [data-open]')];
let activeWindow = null;

function isAppOpen(app) {
  return !app.classList.contains('closed') && !app.classList.contains('minimized')
    && (app.id !== 'browser-window' || app.classList.contains('active'));
}

function updateDock() {
  dockButtons.forEach((button) => {
    const app = document.getElementById(button.dataset.open);
    button.setAttribute('aria-pressed', String(isAppOpen(app) && activeWindow === app));
    button.dataset.running = String(isAppOpen(app));
  });
}

function focusApp(app) {
  activeWindow = app;
  const appNames = { window: 'Terminal', 'document-window': 'About', 'browser-window': 'Browser' };
  document.querySelector('#active-app-name').textContent = appNames[app.id];
  // Normalise stacking instead of letting z-index values grow on every click.
  appWindows.forEach((window) => {
    window.style.zIndex = window === app ? '300' : (window.id === 'window' ? '100' : '200');
    window.classList.toggle('is-active', window === app);
  });
  focusState.terminalFocused = app.id === 'window';
  focusState.browserFocused = app.id === 'browser-window';
  const cursor = caret();
  if (cursor) cursor.classList.toggle('hidden', !focusState.terminalFocused);
  updateDock();
}

function openApp(id) {
  const app = document.getElementById(id);
  if (!app || !appWindows.includes(app)) return;
  app.classList.remove('closed', 'minimized');
  if (id === 'browser-window') app.classList.add('active');
  focusApp(app);
  const content = app.querySelector('.terminal, .document-scroll, .address-input');
  if (content) content.focus({ preventScroll: true });
}

function focusNextApp() {
  const next = appWindows.filter(isAppOpen).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
  if (next) focusApp(next);
  else {
    activeWindow = null;
    appWindows.forEach((app) => app.classList.remove('is-active'));
    document.querySelector('#active-app-name').textContent = 'Desktop';
    focusState.terminalFocused = false;
    focusState.browserFocused = false;
    updateDock();
  }
}

// Bubble after the original per-window handlers to keep all apps in one focus order.
document.querySelector('.desktop').addEventListener('mousedown', (event) => {
  const app = event.target.closest('.window-frame');
  if (app) focusApp(app);
});
document.querySelector('.desktop').addEventListener('focusin', (event) => {
  const app = event.target.closest('.window-frame');
  if (app) focusApp(app);
});

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => openApp(button.dataset.open));
});
// A single click also works with touch and keyboard activation.
terminalShortcut.addEventListener('click', () => openApp('window'));
browserShortcut.addEventListener('click', () => openApp('browser-window'));

appWindows.forEach((app) => {
  app.querySelectorAll('.close, .minimize').forEach((button) => {
    button.addEventListener('click', () => {
      // Original controls handle terminal/browser classes; document controls live here.
      if (button.dataset.windowAction) {
        app.classList.add(button.dataset.windowAction === 'close' ? 'closed' : 'minimized');
      }
      focusNextApp();
    });
  });
});

const normalWindowBounds = new WeakMap();

function setWindowBounds(app, bounds) {
  Object.assign(app.style, {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    right: 'auto',
    transform: 'none',
  });
}

function toggleAppSize(app) {
  if (app.classList.contains('maximized')) {
    const bounds = normalWindowBounds.get(app);
    if (bounds) setWindowBounds(app, bounds);
    app.classList.remove('maximized');
    normalWindowBounds.delete(app);
  } else {
    const bounds = app.getBoundingClientRect();
    normalWindowBounds.set(app, {
      left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
    });
    // Freeze right-anchored or CSS-sized windows at their current pixel bounds.
    // The transition then has numeric start/end values, just like every other app.
    app.style.transition = 'none';
    setWindowBounds(app, bounds);
    void app.offsetWidth;
    app.style.transition = '';
    app.classList.add('maximized');
  }
  focusApp(app);
}

btnMaximize.addEventListener('click', () => toggleAppSize(windowEl));
browserBtnMaximize.addEventListener('click', () => toggleAppSize(browserWindowEl));

// Document windows use Pointer Events for mouse, pen and touch, retaining window bounds.
function enableDocumentWindow(app) {
  const header = app.querySelector('.window-header');
  app.querySelector('[data-window-action="maximize"]').addEventListener('click', () => {
    toggleAppSize(app);
  });
  header.addEventListener('dblclick', (event) => {
    if (!event.target.closest('button')) toggleAppSize(app);
  });
  header.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button') || app.classList.contains('maximized')
      || window.innerWidth <= 700 || event.button !== 0) return;
    event.preventDefault();
    focusApp(app);
    const bounds = app.getBoundingClientRect();
    const offset = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    app.style.transition = 'none';
    header.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      app.style.left = `${Math.max(0, Math.min(window.innerWidth - 120, moveEvent.clientX - offset.x))}px`;
      app.style.top = `${Math.max(35, Math.min(window.innerHeight - 110, moveEvent.clientY - offset.y))}px`;
      app.style.right = 'auto';
    };
    const finish = () => {
      header.removeEventListener('pointermove', move);
      app.style.transition = '';
    };
    header.addEventListener('pointermove', move);
    header.addEventListener('lostpointercapture', finish, { once: true });
  });
  // Match the terminal/browser: resize from every edge and corner.
  ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].forEach((direction) => {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-${direction}${direction === 'se' ? ' document-resize' : ''}`;
    handle.setAttribute('aria-hidden', 'true');
    app.append(handle);
    handle.addEventListener('pointerdown', (event) => {
      if (app.classList.contains('maximized') || event.button !== 0) return;
      event.preventDefault();
      focusApp(app);
      const bounds = app.getBoundingClientRect();
      app.style.left = `${bounds.left}px`;
      app.style.top = `${bounds.top}px`;
      app.style.right = 'auto';
      app.style.transition = 'none';
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const dx = moveEvent.clientX - event.clientX;
        const dy = moveEvent.clientY - event.clientY;
        const minWidth = 400;
        const minHeight = 300;
        let { left, right, top, bottom } = bounds;
        if (direction.includes('w')) left = Math.max(0, Math.min(right - minWidth, left + dx));
        if (direction.includes('e')) right = Math.max(left + minWidth, Math.min(window.innerWidth, right + dx));
        if (direction.includes('n')) top = Math.max(35, Math.min(bottom - minHeight, top + dy));
        if (direction.includes('s')) bottom = Math.max(top + minHeight, Math.min(window.innerHeight - 80, bottom + dy));
        app.style.left = `${left}px`;
        app.style.top = `${top}px`;
        app.style.width = `${right - left}px`;
        app.style.height = `${bottom - top}px`;
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('lostpointercapture', () => {
        handle.removeEventListener('pointermove', move);
        app.style.transition = '';
      }, { once: true });
    });
  });
}

enableDocumentWindow(document.getElementById('document-window'));

// Format plain-text files from the document's semantic content, independently of its layout.
const TEXT_RULE = '-'.repeat(40);
const readText = (element) => element.textContent.replace(/\s+/g, ' ').trim();

function wrapText(text, indent = '') {
  const lines = [];
  let line = indent;
  text.split(/\s+/).forEach((word) => {
    if (line.length > indent.length && line.length + word.length + 1 > 60) {
      lines.push(line);
      line = indent;
    }
    line += `${line.length > indent.length ? ' ' : ''}${word}`;
  });
  lines.push(line);
  return lines.join('\n');
}

function textFile(title, content) {
  return `[ ${title.toUpperCase()} ]\n${TEXT_RULE}\n\n${content}`;
}

function formatExperience(section) {
  return [...section.querySelectorAll('.document-job')].map((job) => {
    const company = job.querySelector('h3').firstChild.textContent.trim();
    const industry = readText(job.querySelector('h3 span'));
    const dates = readText(job.querySelector('.company-line > p'));
    const roles = job.querySelector('.document-progression');
    const roleText = roles
      ? [...roles.children].map((role) => `${readText(role.querySelector('dt'))}\n  ${readText(role.querySelector('dd'))}`).join('\n\n')
      : readText(job.querySelector('.document-role'));
    return `[ ${company} ] ${industry}\n${dates}\n\n${roleText}`;
  }).join(`\n\n${TEXT_RULE}\n\n`);
}

function formatContactLink(link) {
  const label = link.firstChild.textContent.trim();
  const value = readText(link.querySelector('span')).replace(/ ↗$/, '');
  return `${label.padEnd(10)}[${value}](${link.getAttribute('href')})`;
}

const fileFormatters = {
  'about-me.txt': (section) => textFile(readText(document.querySelector('#profile h1')), [
    readText(document.querySelector('#profile > p')),
    readText(document.querySelector('.document-folio > span:last-child')),
    '',
    wrapText(readText(section)),
  ].join('\n')),
  'experience.txt': (section) => textFile('Professional experience', formatExperience(section)),
  'skills.txt': (section) => textFile('Key skills', [...section.querySelectorAll('.document-skills > div')]
    .map((skill) => `[ ${readText(skill.querySelector('dt'))} ]\n${wrapText(readText(skill.querySelector('dd')), '  ')}`)
    .join('\n\n')),
  'education.txt': (section) => textFile('Education', [
    wrapText(readText(section.querySelector('h3'))),
    ...[...section.querySelectorAll('.company-line p')].map(readText),
  ].join('\n')),
  'interests.txt': (section) => textFile('Interests', wrapText(readText(section.querySelector('p')))),
  'contact.txt': (section) => textFile('Get in touch', [...section.querySelectorAll('address a')]
    .map(formatContactLink).join('\n')),
};

document.querySelectorAll('[data-terminal-file]').forEach((section) => {
  const filename = section.dataset.terminalFile;
  dirMap.home.guest[filename] = fileFormatters[filename](section);
});
dirMap.home.guest['about-this-site.txt'] = textFile('This desktop', [
  wrapText('Welcome to rOS: a tiny desktop built with HTML, CSS and JavaScript.'),
  '',
  wrapText('Open documents, move the windows around, or explore from the terminal. This is a simulated shell.'),
  '',
  TEXT_RULE,
  '',
  '[ Have a look around ]',
  '  open about',
  '  cat experience.txt',
  '  cd repos',
  '  help',
].join('\n'));

handlers.open = (args) => {
  const apps = { about: 'document-window', cv: 'document-window', terminal: 'window', browser: 'browser-window' };
  if (!Object.hasOwn(apps, args[0])) {
    println('open: choose about, terminal or browser');
    return;
  }
  openApp(apps[args[0]]);
};
handlers.about = () => openApp('document-window');
const originalHelp = handlers.help;
handlers.help = () => {
  println('Desktop: open about | open terminal | open browser');
  println('My files: cat about-me.txt | cat experience.txt | cat skills.txt');
  println('');
  originalHelp();
};

const mobileCommand = document.querySelector('#mobile-command');
document.querySelector('#mobile-command-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.booting) return;
  createInputLine(mobileCommand.value);
  mobileCommand.value = '';
  await handleCommand();
  createNewLine();
});

// App links scroll only their document, leaving the desktop in place.
document.querySelectorAll('.document-toolbar a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    const scrollArea = document.querySelector('.document-scroll');
    scrollArea.scrollTo({ top: target.offsetTop - document.querySelector('.cv-document').offsetTop + 24 });
  });
});

const documentScroll = document.querySelector('.document-scroll');
const documentLinks = [...document.querySelectorAll('.document-toolbar a')];
function updateDocumentLocation() {
  const readingLine = documentScroll.getBoundingClientRect().top + 55;
  let current = documentLinks[0];
  documentLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section.getBoundingClientRect().top <= readingLine) current = link;
  });
  // The last section may be shorter than the viewport and unable to reach its top.
  if (documentScroll.scrollTop > 0
    && documentScroll.scrollTop + documentScroll.clientHeight >= documentScroll.scrollHeight - 2) {
    current = documentLinks[documentLinks.length - 1];
  }
  documentLinks.forEach((link) => {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
documentScroll.addEventListener('scroll', updateDocumentLocation, { passive: true });

function updateClock() {
  const now = new Date();
  const clock = document.querySelector('#desktop-clock');
  clock.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  clock.dateTime = now.toISOString();
}
updateClock();
setInterval(updateClock, 30000);

// Clear desktop geometry when the viewport changes so title bars stay reachable.
window.addEventListener('resize', () => {
  appWindows.forEach((app) => {
    if (app.classList.contains('maximized')) {
      const bounds = normalWindowBounds.get(app);
      if (bounds) {
        bounds.width = Math.min(bounds.width, window.innerWidth - 20);
        bounds.height = Math.min(bounds.height, Math.max(300, window.innerHeight - 145));
        bounds.left = Math.max(0, Math.min(bounds.left, window.innerWidth - bounds.width));
        bounds.top = Math.max(35, Math.min(bounds.top, window.innerHeight - bounds.height - 80));
      }
      return;
    }
    ['left', 'right', 'top', 'width', 'height', 'transform'].forEach((property) => {
      app.style[property] = '';
    });
  });
});
focusApp(document.getElementById('document-window'));
