const state = {
  path: "~",
  env: {},
  date: new Date(),
};

const dirMap = {
  "~": {
    ".secret.txt": "You can't see me",
    "about-me.txt": "I'm a software engineer",
    blog: {
      "placeholder.txt": "Pfft, I don't have a blog",
    },
  },
};

addEventListener("keypress", function (e) {
  if (e.key.length === 1) {
    inputChar(e.key);
  }
});

addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    handleCommand();
    createNewLine();
  }

  if (e.key === "Backspace") {
    deletePrevChar();
  }

  if (e.key === "Delete") {
    deleteCurrentChar();
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

function deleteCurrentChar() {
  const parentNode = caret().parentNode;
  const next = caret().nextElementSibling;
  const current = caret();

  if (current) {
    parentNode.removeChild(current);
    next.classList.add("caret");
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

function println(text) {
  const newLine = document.createElement("span");
  newLine.classList.add("terminal-line");
  newLine.innerHTML = text;
  document.querySelector(".terminal").appendChild(newLine);
}

const handlers = {
  alias: alias,
  ls: list,
  cat: concatenate,
  cd: changeDirectory,
  clear: clear,
  echo: echo,
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
  const command = commands[commands.length - 1].textContent.trim();
  if (command.length > 0) {
    cmd(command);
  }
}

function cmd(command) {
  const [baseCommand, ...args] = command.split(HTML_SPACE_CHAR);

  if (handlers[baseCommand]) {
    handlers[baseCommand](args);
  } else {
    insertCommandNotFound(baseCommand);
  }
}

function insertCommandNotFound(command) {
  println(`sh: command not found: ${command}`);
}

function permissionDenied(command) {
  return function () {
    println(`sh: ${command}: permission denied`);
  };
}

function clear() {
  const terminal = document.querySelector(".terminal");
  terminal.innerHTML = "";
}

function list(args) {
  const pathArg = args.find((arg) => !arg.startsWith("-"));
  const dir = Path.resolve(pathArg);

  if (typeof dir === "string") {
    println(`ls: cannot access '${pathArg}': No such file or directory`);
    return;
  }

  let entries = [".", "..", ...Object.keys(dir)];

  const includeHidden = args.some(
    (arg) => arg.startsWith("-") && arg.includes("a")
  );

  if (!includeHidden) {
    entries = entries.filter((entry) => !entry.startsWith("."));
  }

  const longFormat = args.some(
    (arg) => arg.startsWith("-") && arg.includes("l")
  );

  if (longFormat) {
    const entryDetails = entries.map((entry) => {
      const isDir = typeof dir[entry] === "object";
      const typeAndPermissions = `${isDir ? "d" : "-"}r--r--r--`;
      const links = 1;
      const owner = "guest";
      const group = "guest";
      const size = isDir ? 4096 : 1024;

      const month = state.date.toLocaleString("default", { month: "short" });
      const day = state.date.getDate();
      const time = state.date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const date = `${month} ${day} ${time}`;

      return [typeAndPermissions, links, owner, group, size, date, entry].join(
        HTML_SPACE_CHAR
      );
    });

    for (const entry of entryDetails) {
      println(entry);
    }

    return;
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

  const newFullPath = Path.join(newPath) || state.path;
  console.log(newFullPath);
  const target = Path.resolve(newFullPath);

  if (!target) {
    println(`cd: ${newPath}: No such file or directory`);
    return;
  }

  if (typeof target !== "object") {
    println(`cd: ${newPath}: Not a directory`);
    return;
  }

  state.path = newFullPath;
}

function echo(args) {
  println(args.join(HTML_SPACE_CHAR));
}

function alias(args) {
  const [alias, command] = args[0].split("=");

  if (!alias || !command) {
    for (const arg of args.filter((arg) => !arg.startsWith("-"))) {
      println(`sh: alias: ${arg}: not found`);
    }
    return;
  }

  handlers[alias] = function (args) {
    cmd([command, ...args].join(HTML_SPACE_CHAR).trim());
  };
}

// cat
function concatenate(args) {
  const filePath = args[0];

  const file = Path.resolve(filePath);

  if (typeof file === "string") {
    println(file);
    return;
  }

  if (typeof file === "object") {
    println(`cat: ${filePath}: Is a directory`);
    return;
  }

  println(`cat: ${filePath}: No such file or directory`);
}

class Path {
  static join(_path) {
    let baseParts = state.path;
    let path = _path;

    if (path.startsWith("./")) {
      path = path.slice(2);
    }

    while (path.startsWith("../")) {
      path = path.slice(3);
      baseParts = baseParts.split("/").slice(0, -1).join("/");
    }

    return [
      ...baseParts.split("/").filter(Boolean),
      ...path.split("/").filter(Boolean),
    ].join("/");
  }

  static resolve(_path) {
    const dirPathParts = state.path.split("/").filter(Boolean);

    if (_path) {
      const upTimes = (_path.match(/\.\./g) || []).length;
      dirPathParts.splice(-upTimes, upTimes);
    }

    let currentDir = dirMap[dirPathParts.shift()];

    while (dirPathParts.length > 0) {
      currentDir = currentDir[dirPathParts.shift()];
    }

    if (!_path) {
      return currentDir;
    }

    let path = _path;

    if (path.startsWith("./")) {
      path = path.slice(2);
    }

    while (path.startsWith("../")) {
      path = path.slice(3);
    }

    if (path.startsWith("~/")) {
      path = path.slice(2);
      currentDir = dirMap["~"];
    }

    const pathParts = path.split("/").filter(Boolean);
    let resolved = currentDir[pathParts.shift()];
    for (const part of pathParts) {
      resolved = resolved[part];
    }

    return resolved;
  }
}

async function simulateTyping(text) {
  for (const char of text) {
    inputChar(char);
    await sleep();
  }
}

async function sleep(_ms) {
  let ms = _ms;

  if (!ms) {
    ms = Math.floor(Math.random() * 100) + 50;
  }

  return new Promise((res) => setTimeout(res, ms));
}

const scipts = {
  welcome,
};

async function welcome() {
  await simulateTyping("echo Welcome to rossdonohoe.dev!");
  await sleep();
  handleCommand();
  createNewLine();

  await sleep(400);

  await simulateTyping("ls -l");
  await sleep();
  handleCommand();
  createNewLine();
}

scipts.welcome();
