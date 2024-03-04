const state = {
  path: "~",
};

const dirMap = {
  "~": {
    "about-me.txt": "I'm a software engineer",
    blog: {
      "placeholder.txt": "Watch this space",
    },
    ".secret.txt": "You can't see me",
  },
};

addEventListener("keypress", function (e) {
  console.log(e.key);

  if (e.key.length === 1) {
    inputChar(e.key);
  }

  // e.preventDefault();
});

addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    handleCommand();
    createNewLine();
  }

  if (e.key === "Backspace") {
    deletePrevChar();
  }

  if (e.key === "ArrowLeft") {
    moveCaretBack();
  }

  if (e.key === "ArrowRight") {
    moveCaretForward();
  }

  // SIGINT
  if (e.key === "c" && e.ctrlKey) {
    createNewLine();
  }

  // e.preventDefault();
});

function inputChar(char) {
  const charElement = document.createElement("span");
  charElement.innerHTML += encodeHtml(char);
  const parentNode = caret().parentNode;
  parentNode.insertBefore(charElement, caret());
}

function deletePrevChar() {
  const parentNode = caret().parentNode;
  const prev = caret().previousElementSibling;

  if (prev) {
    parentNode.removeChild(prev);
  }
}

function moveCaretBack() {
  const prev = caret().previousElementSibling;

  if (prev) {
    caret().classList.remove("caret");
    prev.classList.add("caret");
  }
}

function moveCaretForward() {
  const next = caret().nextElementSibling;

  if (next) {
    caret().classList.remove("caret");
    next.classList.add("caret");
  }
}

function createNewLine() {
  const newLine = document.createElement("span");
  newLine.classList.add("terminal-line");

  const leader = document.createElement("span");
  leader.innerHTML = makeLeaderText();
  leader.classList.add("terminal-leader");
  newLine.appendChild(leader);

  const input = document.createElement("span");
  input.classList.add("terminal-input");
  newLine.appendChild(input);

  const caret = document.createElement("span");
  caret.classList.add("caret");
  input.appendChild(caret);

  const lastCaret = document.querySelector(".caret");
  if (lastCaret) {
    lastCaret.classList.remove("caret");
  }

  const terminal = document.querySelector(".terminal");
  terminal.appendChild(newLine);
  terminal.scrollTop = terminal.scrollHeight;
}

function caret() {
  return document.querySelector(".caret");
}

const STRING_TO_HTML = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#039;",
  " ": "&nbsp;",
};

function encodeHtml(text) {
  return STRING_TO_HTML[text] || text;
}

function makeLeaderText() {
  return `guest@rossdonohoe.dev:${state.path}$`;
}

const handlers = {
  ls: list,
  cd: changeDirectory,
  clear: clear,
  chroot: permissionDenied("chroot"),
  su: permissionDenied("su"),
  sudo: permissionDenied("sudo"),
  rm: permissionDenied("rm"),
  mv: permissionDenied("mv"),
  cp: permissionDenied("cp"),
  touch: permissionDenied("touch"),
  chmod: permissionDenied("chmod"),
  chown: permissionDenied("chown"),
};

const HTML_SPACE_CHAR = " ";

function handleCommand() {
  const commands = document.querySelectorAll(".terminal-input");
  console.log(commands);
  const command = commands[commands.length - 1].textContent.trim();

  const [baseCommand, ...args] = command.split(HTML_SPACE_CHAR);
  console.log(args);
  console.log(baseCommand);
  console.log(command);

  if (handlers[baseCommand]) {
    handlers[baseCommand](args);
  } else {
    insertCommandNotFound(baseCommand);
  }
}

function insertCommandNotFound(command) {
  const newLine = document.createElement("span");
  newLine.classList.add("terminal-line");
  newLine.innerHTML = `sh: command not found: ${command}`;
  document.querySelector(".terminal").appendChild(newLine);
}

function permissionDenied(command) {
  return function () {
    const newLine = document.createElement("span");
    newLine.classList.add("terminal-line");
    newLine.innerHTML = `sh: ${command}: permission denied`;
    document.querySelector(".terminal").appendChild(newLine);
  };
}

function clear() {
  const terminal = document.querySelector(".terminal");
  terminal.innerHTML = "";
}

function list(args) {
  const dirPathParts = state.path.split("/");
  let currentDir = dirMap[dirPathParts.pop()];

  while (dirPathParts.length > 0) {
    currentDir = dirMap[currentDir];
  }

  let entries = [".", "..", ...Object.keys(currentDir)];

  const includeHidden = args.some(
    (arg) => arg.startsWith("-") && arg.includes("a")
  );

  if (!includeHidden) {
    entries = entries.filter((entry) => !entry.startsWith("."));
  }

  const newLine = document.createElement("span");
  newLine.classList.add("terminal-line");
  for (const entry of entries) {
    newLine.innerHTML += entry;
    newLine.innerHTML += "&Tab;";
  }
  document.querySelector(".terminal").appendChild(newLine);
}

function changeDirectory(args) {
  const newPath = args[0];

  if (!newPath) {
    state.path = "~";
    return;
  }

  if (newPath === ".") {
    return;
  }

  const isNotPermitted =
    (state.path === "~" && newPath === "..") || newPath.startsWith("/");

  if (isNotPermitted) {
    permissionDenied("cd")([newPath]);
    return;
  }

  const pathParts = state.path.split("/");

  if (newPath === "..") {
    pathParts.pop();
    state.path = pathParts.join("/");
    return;
  }

  if ("") {
    state.path = newPath;
  }
}
