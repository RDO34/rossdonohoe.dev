const state = {
  path: "~",
  env: {},
  date: new Date(),
  startTime: Date.now(),
  dirs: ["/home/guest"],
  hist: [],
  histPtr: null,
};

const githubCache = {
  repos: null,
  contents: {},
  lastFetch: null,
};

async function fetchGitHubRepos() {
  if (
    githubCache.repos &&
    githubCache.lastFetch &&
    Date.now() - githubCache.lastFetch < 300000
  ) {
    return githubCache.repos;
  }

  try {
    const response = await fetch(
      "https://api.github.com/users/RDO34/repos?sort=updated&per_page=100",
    );
    if (!response.ok) throw new Error("Failed to fetch");
    const repos = await response.json();
    githubCache.repos = repos;
    githubCache.lastFetch = Date.now();
    return repos;
  } catch (e) {
    return [];
  }
}

async function fetchGitHubContents(repo, path = "") {
  const cacheKey = `${repo}:${path}`;
  if (
    githubCache.contents[cacheKey] &&
    Date.now() - githubCache.contents[cacheKey].timestamp < 300000
  ) {
    return githubCache.contents[cacheKey].data;
  }

  try {
    const url = `https://api.github.com/repos/RDO34/${repo}/contents/${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    githubCache.contents[cacheKey] = { data, timestamp: Date.now() };
    return data;
  } catch (e) {
    return null;
  }
}

async function fetchGitHubFile(repo, path) {
  try {
    const url = `https://api.github.com/repos/RDO34/${repo}/contents/${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    if (data.content) {
      // Decode base64 content
      return atob(data.content.replace(/\s/g, ""));
    }
    return null;
  } catch (e) {
    return null;
  }
}

function isGitHubPath(absolutePath) {
  return (
    absolutePath.startsWith("/home/guest/projects/") &&
    absolutePath.split("/").length > 3
  );
}

function parseGitHubPath(absolutePath) {
  const parts = absolutePath.split("/").filter(Boolean);
  // parts = ['home', 'guest', 'projects', 'repo-name', ...path]
  const repo = parts[3];
  const path = parts.slice(4).join("/");
  return { repo, path };
}

async function getProjectsDir() {
  const repos = await fetchGitHubRepos();
  const projects = {
    "README.md":
      "# Projects\n\nThis directory contains my GitHub repositories.\n\nUse 'ls' to see all projects, then 'cd' into any project to explore it.\n\nEach project shows actual files from GitHub!",
  };

  for (const repo of repos) {
    projects[repo.name] = {};
  }

  return projects;
}

async function getGitHubDirContents(absolutePath) {
  const { repo, path } = parseGitHubPath(absolutePath);
  const contents = await fetchGitHubContents(repo, path);

  if (!contents) return null;
  if (!Array.isArray(contents)) return null; // It's a file, not a directory

  const result = {};
  for (const item of contents) {
    if (item.type === "dir") {
      result[item.name] = {};
    } else {
      result[item.name] = item;
    }
  }
  return result;
}

async function getGitHubFileContent(absolutePath) {
  const { repo, path } = parseGitHubPath(absolutePath);
  return await fetchGitHubFile(repo, path);
}

const dirMap = {
  home: {
    guest: {
      ".secret.txt": "😊",
      "about-me.txt": `Software engineer with ${new Date().getFullYear() - 2018}+ years of production experience.

Terminal nerd passionate about shipping quality software.

Drop me a line at [rossdon.95@googlemail.com](mailto:rossdon.95@googlemail.com).`,
      "about-this-site.txt": `Ok, ok, yes. This isn't a real terminal.

You got me.

If you're trying to do some cool grep-pipe-xargs wizardry it won't work.

This has just been a fun way to present some information in a way that shows what I enjoy.

I will come back and implement a vim emulator one day, I swear...`,
      "links.txt": `[github](https://github.com/rdo34)&nbsp;|&nbsp;[linkedin](https://linkedin.com/in/ross-james-donohoe)`,
      blog: {
        "placeholder.txt": "Pfft, I don't have a blog",
      },
      projects: {
        "README.md":
          "# Projects\n\nThis directory contains my GitHub repositories.\n\nUse 'ls' to see all projects, then 'cd' into any project to explore it.",
      },
    },
  },
};

addEventListener("keypress", function (e) {
  if (e.key.length === 1) {
    e.preventDefault();
    inputChar(e.key);
  }
});

addEventListener("keydown", async function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    await handleCommand();
    createNewLine();
  }

  if (e.key === "Backspace") {
    e.preventDefault();
    deletePrevChar();
  }

  if (e.key === "Delete") {
    e.preventDefault();
    deleteCurrentChar();
  }

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    moveCaretBack();
  }

  if (e.key === "ArrowRight") {
    e.preventDefault();
    moveCaretForward();
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    moveHistoryBack();
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveHistoryForward();
  }

  // SIGINT
  if (e.key === "c" && e.ctrlKey) {
    e.preventDefault();
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
    if (next) {
      next.classList.add("caret");
    }
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

function moveHistoryBack() {
  if (state.histPtr === null) {
    state.histPtr = state.hist.length - 1;
  } else if (state.histPtr > 0) {
    state.histPtr = Math.max(0, state.histPtr - 1);
  }

  createInputLine(state.hist[state.histPtr]);
}

function moveHistoryForward() {
  if (state.histPtr === null) {
    return;
  }

  if (state.histPtr === state.hist.length - 1) {
    state.histPtr = null;
    createInputLine("");
    return;
  }

  state.histPtr = Math.min(state.hist.length - 1, state.histPtr + 1);
  createInputLine(state.hist[state.histPtr]);
}

function createInputLine(text) {
  const commands = document.querySelectorAll(".terminal-input");
  const lastCommand = commands[commands.length - 1];

  const children = text.split("").map((char) => {
    const span = document.createElement("span");
    span.innerHTML = encodeHtml(char);
    return span;
  });

  const newCaret = document.createElement("span");
  newCaret.classList.add("caret");

  lastCommand.innerHTML = "";
  lastCommand.append(...children);
  lastCommand.appendChild(newCaret);
}

function createNewLine() {
  state.histPtr = null;
  const newLine = document.createElement("div");
  newLine.classList.add("terminal-line", "terminal-prompt");

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

function println(text, parseLinks = false) {
  const newLine = document.createElement("div");
  newLine.classList.add("terminal-line");

  let innerHTML = text;

  if (parseLinks) {
    const elements = innerHTML.match(/\[.*?\)/g);

    if (elements != null && elements.length > 0) {
      for (const element of elements) {
        const label = element.match(/\[(.*?)\]/)[1];
        const url = element.match(/\((.*?)\)/)[1];

        innerHTML = innerHTML.replace(
          element,
          `<a href="${url}" target="_blank">${label}</a>`,
        );
      }
    }
  }

  newLine.innerHTML = innerHTML;
  document.querySelector(".terminal").appendChild(newLine);
}

const handlers = {
  alias: alias,
  bg: permissionDenied("bg"),
  bind: permissionDenied("bind"),
  builtin: permissionDenied("builtin"),
  cat: concatenate,
  caller: permissionDenied("caller"),
  cd: changeDirectory,
  chmod: permissionDenied("chmod"),
  chown: permissionDenied("chown"),
  chroot: permissionDenied("chroot"),
  clear: clear,
  compgen: permissionDenied("compgen"),
  complete: permissionDenied("complete"),
  compopt: permissionDenied("compopt"),
  coproc: permissionDenied("coproc"),
  cp: permissionDenied("cp"),
  dirs: dirs,
  disown: permissionDenied("disown"),
  echo: echo,
  enable: permissionDenied("enable"),
  eval: permissionDenied("eval"),
  exec: permissionDenied("exec"),
  exit: permissionDenied("exit"),
  export: exportFn,
  false: permissionDenied("false"),
  fc: fixCommand,
  fg: permissionDenied("fg"),
  for: permissionDenied("for"),
  function: permissionDenied("function"),
  getopts: noop,
  hash: permissionDenied("hash"),
  help: help,
  history: history,
  if: permissionDenied("if"),
  jobs: permissionDenied("jobs"),
  kill: permissionDenied("kill"),
  let: permissionDenied("let"),
  local: permissionDenied("local"),
  logout: permissionDenied("logout"),
  mapfile: permissionDenied("mapfile"),
  popd: popd,
  printf: echo,
  pushd: pushd,
  pwd: processWorkingDirectory,
  read: permissionDenied("read"),
  readarray: permissionDenied("readarray"),
  readonly: permissionDenied("readonly"),
  return: permissionDenied("return"),
  select: permissionDenied("select"),
  set: permissionDenied("set"),
  shift: permissionDenied("shift"),
  shopt: permissionDenied("shopt"),
  source: permissionDenied("source"),
  suspend: permissionDenied("suspend"),
  test: permissionDenied("test"),
  time: permissionDenied("time"),
  times: permissionDenied("times"),
  trap: permissionDenied("trap"),
  true: permissionDenied("true"),
  type: permissionDenied("type"),
  typeset: permissionDenied("typeset"),
  ulimit: permissionDenied("ulimit"),
  umask: permissionDenied("umask"),
  unalias: permissionDenied("unalias"),
  unset: permissionDenied("unset"),
  wait: permissionDenied("wait"),
  while: permissionDenied("while"),

  apt: permissionDenied("apt"),
  "apt-get": permissionDenied("apt-get"),
  curl: permissionDenied("curl"),
  fastfetch: fastfetch,
  ls: list,
  mkdir: makeDirectory,
  mv: permissionDenied("mv"),
  nano: permissionDenied("nano"),
  node: node,
  rm: permissionDenied("rm"),
  su: permissionDenied("su"),
  sudo: permissionDenied("sudo"),
  touch: makeFile,
  vi: permissionDenied("vi"),
  vim: permissionDenied("vim"),
  wget: permissionDenied("wget"),
};

const HTML_SPACE_CHAR = " ";

function fastfetch() {
  const logo = [
    `<span style="color: #bb9af7">____/\\\\\\\\\\\\\\\\\\_____         </span>`,
    `<span style="color: #b39bf7"> __/\\\\\\///////\\\\\\___        </span>`,
    `<span style="color: #ab9cf7">  _\\/\\\\\\_____\\/\\\\\\___       </span>`,
    `<span style="color: #a39df7">   _\\/\\\\\\\\\\\\\\\\\\\\\\/____      </span>`,
    `<span style="color: #9a9ef7">    _\\/\\\\\\//////\\\\\\____     </span>`,
    `<span style="color: #929ff7">     _\\/\\\\\\____\\//\\\\\\___    </span>`,
    `<span style="color: #8aa0f7">      _\\/\\\\\\_____\\//\\\\\\__   </span>`,
    `<span style="color: #82a1f7">       _\\/\\\\\\______\\//\\\\\\_  </span>`,
    `<span style="color: #7aa2f7">        _\\///________\\///__ </span>`,
  ];

  const uptime = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(uptime / 60);
  const seconds = uptime % 60;
  const uptimeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const info = [
    `<span style="color: #7aa2f7; font-weight: bold">guest</span>@<span style="color: #7aa2f7; font-weight: bold">rossdonohoe.dev</span>`,
    "-----------------------",
    `<span style="color: #7aa2f7">OS:</span> rOS 1.0`,
    `<span style="color: #7aa2f7">Kernel:</span> Vanilla JS`,
    `<span style="color: #7aa2f7">Uptime:</span> ${uptimeStr}`,
    `<span style="color: #7aa2f7">Shell:</span> custom-sh`,
    `<span style="color: #7aa2f7">Resolution:</span> ${window.innerWidth}x${window.innerHeight}`,
    `<span style="color: #7aa2f7">Memory:</span> 128MB / 512MB`,
    `<span style="background-color: #f7768e">&nbsp;&nbsp;&nbsp;</span><span style="background-color: #9ece6a">&nbsp;&nbsp;&nbsp;</span><span style="background-color: #e0af68">&nbsp;&nbsp;&nbsp;</span><span style="background-color: #7aa2f7">&nbsp;&nbsp;&nbsp;</span><span style="background-color: #bb9af7">&nbsp;&nbsp;&nbsp;</span><span style="background-color: #7dcfff">&nbsp;&nbsp;&nbsp;</span>`,
  ];

  const maxLines = Math.max(logo.length, info.length);
  for (let i = 0; i < maxLines; i++) {
    const logoLine = logo[i] || " ".repeat(27);
    const infoLine = info[i] || "";
    const padding = "   ";
    println(logoLine + padding + infoLine, false);
  }
}

async function handleCommand() {
  const commands = document.querySelectorAll(".terminal-input");
  // Replace non-breaking spaces with regular spaces
  const command = commands[commands.length - 1].textContent
    .trim()
    .replace(/\u00A0/g, " ");
  if (command.length > 0) {
    await cmd(command);
    state.hist.push(command);
  }
}

async function cmd(command) {
  const [baseCommand, ...args] = command.split(HTML_SPACE_CHAR);

  if (handlers[baseCommand]) {
    await handlers[baseCommand](args);
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

function noop() {
  println("");
}

function help() {
  for (const line of CONSTANTS.HELP.split("\n")) {
    println(line);
  }
}

function clear() {
  const terminal = document.querySelector(".terminal");
  terminal.innerHTML = "";
}

async function list(args) {
  const pathArg = args.find((arg) => !arg.startsWith("-"));

  if (pathArg && Path.outOfBounds(pathArg)) {
    permissionDenied("ls")([pathArg]);
    return;
  }

  const targetPath = pathArg || ".";
  const absolutePath = Path.absolute(targetPath);

  // Check if we're listing a GitHub project directory
  let dir;
  if (absolutePath === "/home/guest/projects") {
    // Just the projects folder - show repo list
    const projectsDir = await getProjectsDir();
    dirMap.home.guest.projects = projectsDir;
    dir = Path.resolve(targetPath);
  } else if (isGitHubPath(absolutePath)) {
    // Inside a specific project - fetch from GitHub
    const githubContents = await getGitHubDirContents(absolutePath);
    if (githubContents) {
      // Update dirMap with the fetched contents
      const { repo, path: ghPath } = parseGitHubPath(absolutePath);
      let current = dirMap.home.guest.projects;
      if (!current[repo]) current[repo] = {};
      current = current[repo];

      // Navigate to the correct subdirectory in dirMap
      if (ghPath) {
        const pathParts = ghPath.split("/");
        for (const part of pathParts) {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }

      // Merge GitHub contents
      Object.assign(current, githubContents);
      dir = current;
    } else {
      dir = Path.resolve(targetPath);
    }
  } else {
    dir = Path.resolve(targetPath);
  }

  if (!dir) {
    println(`ls: cannot access '${pathArg}': No such file or directory`);
    return;
  }

  let entries = [".", "..", ...Object.keys(dir)];

  const includeHidden = args.some(
    (arg) => arg.startsWith("-") && arg.includes("a"),
  );

  if (!includeHidden) {
    entries = entries.filter((entry) => !entry.startsWith("."));
  }

  if (typeof dir === "string") {
    entries = [(pathArg || targetPath).split("/").pop()];
  }

  const longFormat = args.some(
    (arg) => arg.startsWith("-") && arg.includes("l"),
  );

  if (longFormat) {
    const entryDetails = entries.map((entry) => {
      const isDir =
        entry === "." || entry === ".." || typeof dir[entry] === "object";
      const typeAndPermissions = `${isDir ? "d" : "-"}r--r--r--`;
      const links = 1;
      const owner = "guest";
      const group = "guest";
      const size = isDir ? 4096 : dir[entry] ? dir[entry].length || 1024 : 1024;

      const month = state.date.toLocaleString("default", { month: "short" });
      const day = state.date.getDate().toString().padStart(2, " ");
      const time = state.date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const date = `${month} ${day} ${time}`;

      return [
        typeAndPermissions,
        links.toString().padStart(2, " "),
        owner.padEnd(8, " "),
        group.padEnd(8, " "),
        size.toString().padStart(8, " "),
        date,
        entry,
      ].join(" ");
    });

    for (const entry of entryDetails) {
      println(entry.replace(/ /g, "&nbsp;"));
    }

    return;
  }

  const newLine = document.createElement("div");
  newLine.classList.add("terminal-line");
  for (const entry of entries) {
    newLine.innerHTML += entry;
    newLine.innerHTML += "&Tab;&Tab;";
  }
  document.querySelector(".terminal").appendChild(newLine);
}

async function changeDirectory(args) {
  const newPath = args[0];

  if (!newPath) {
    state.path = "~";
    return;
  }

  if (newPath === ".") {
    return;
  }

  if (Path.outOfBounds(newPath)) {
    permissionDenied("cd")([newPath]);
    return;
  }

  const newFullPath = Path.absolute(newPath);

  // Check if we're accessing projects directory
  if (newFullPath.startsWith("/home/guest/projects")) {
    await getProjectsDir();
  }

  // Check if we're cd'ing into a GitHub project subdirectory
  if (isGitHubPath(newFullPath)) {
    const githubContents = await getGitHubDirContents(newFullPath);
    if (githubContents) {
      // Update dirMap with fetched contents
      const { repo, path: ghPath } = parseGitHubPath(newFullPath);
      let current = dirMap.home.guest.projects;
      if (!current[repo]) current[repo] = {};
      current = current[repo];

      if (ghPath) {
        const pathParts = ghPath.split("/");
        for (const part of pathParts) {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }

      Object.assign(current, githubContents);
    }
  }

  const target = Path.resolve(newFullPath);

  if (typeof target !== "object") {
    println(`cd: ${newPath}: Not a directory`);
    return;
  }

  if (!target) {
    println(`cd: ${newPath}: No such file or directory`);
    return;
  }

  state.path = newFullPath.replace("/home/guest", "~");
  state.dirs.push(Path.absolute(newFullPath));
}

function echo(args) {
  println(args.join(HTML_SPACE_CHAR));
}

function alias(args) {
  if (!args[0]) {
    println("sh: alias: missing argument");
    return;
  }
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
async function concatenate(args) {
  const filePath = args[0];

  if (!filePath) {
    println("cat: missing file operand");
    return;
  }

  const absolutePath = Path.absolute(filePath);

  // Check if we're accessing a GitHub project file
  if (isGitHubPath(absolutePath)) {
    const content = await getGitHubFileContent(absolutePath);
    if (content) {
      const lines = content.split("\n");
      for (const line of lines) {
        println(line, false);
      }
      return;
    }
  }

  // Check if we're accessing projects directory
  if (absolutePath.startsWith("/home/guest/projects")) {
    await getProjectsDir();
  }

  const file = Path.resolve(filePath);

  if (typeof file === "string") {
    const lines = file.split("\n");
    for (const line of lines) {
      println(line, true);
    }
    return;
  }

  if (typeof file === "object") {
    println(`cat: ${filePath}: Is a directory`);
    return;
  }

  println(`cat: ${filePath}: No such file or directory`);
}

function makeDirectory(args) {
  const dirPath = args[0];

  if (!dirPath) {
    println("mkdir: missing operand");
    return;
  }

  const dir = Path.resolve(dirPath);

  if (dir) {
    println(`mkdir: cannot create directory '${dirPath}': File exists`);
    return;
  }

  const pathParts = dirPath.split("/");
  const dirName = pathParts.pop();
  const parentDir = Path.resolve(pathParts.join("/"));

  if (!parentDir) {
    println(
      `mkdir: cannot create directory '${dirPath}': No such file or directory`,
    );
    return;
  }

  parentDir[dirName] = {};
}

function makeFile(args) {
  const filePath = args[0];

  if (!filePath) {
    println("touch: missing file operand");
    return;
  }

  const file = Path.resolve(filePath);

  if (file) {
    println(`touch: cannot create file '${filePath}': File exists`);
    return;
  }

  const pathParts = filePath.split("/");
  const fileName = pathParts.pop();
  const parentDir = Path.resolve(pathParts.join("/"));

  if (!parentDir) {
    println(
      `touch: cannot create file '${filePath}': No such file or directory`,
    );
    return;
  }

  parentDir[fileName] = "";
}

function node(args) {
  if (args[0] !== "-p") {
    println("Welcome to Node.js v14.17.0.");
    println('Type ".help" for more information.');
    return;
  }

  let code = args.slice(1).join(" ");

  // Remove surrounding quotes if present
  if (
    (code.startsWith('"') && code.endsWith('"')) ||
    (code.startsWith("'") && code.endsWith("'"))
  ) {
    code = code.slice(1, -1);
  }

  try {
    const result = eval(code);
    if (result !== undefined) {
      println(String(result));
    }
  } catch (e) {
    println(e.toString());
  }
}

function processWorkingDirectory() {
  println(Path.absolute(state.path));
}

function dirs() {
  println(state.dirs.join(" "));
}

function pushd(args) {
  const dirPath = args[0];

  if (!dirPath) {
    println("pushd: missing operand");
    return;
  }

  const dir = Path.resolve(dirPath);

  if (!dir) {
    println(`pushd: ${dirPath}: No such file or directory`);
    return;
  }

  state.dirs.push(Path.absolute(dirPath));
}

function popd() {
  state.dirs.pop();
}

function exportFn(args) {
  if (!args[0]) {
    println("export: missing argument");
    return;
  }
  const [envVar, value] = args[0].split("=");
  state.env[envVar] = value;
}

function history(_args) {
  for (const [idx, cmd] of state.hist.entries()) {
    const newLine = document.createElement("div");
    newLine.classList.add("terminal-line");
    newLine.innerHTML += "&nbsp;";
    newLine.innerHTML += idx + 1;
    newLine.innerHTML += "&Tab;";
    newLine.innerHTML += cmd;
    document.querySelector(".terminal").appendChild(newLine);
  }
}

function fixCommand(args) {
  return history(args);
}

class Path {
  static traverse(_path) {
    const basePath = ["home", "guest"];

    if (["~", "~/"].includes(_path)) {
      return basePath;
    }

    let targetPath = _path;
    let currentRelativePath = state.path.slice(1).split("/").filter(Boolean);

    if (targetPath.startsWith("/home/guest")) {
      targetPath = targetPath.slice(11);
      currentRelativePath = [];
    }

    if (targetPath.startsWith("~/")) {
      targetPath = targetPath.slice(2);
      currentRelativePath = [];
    }

    const resolvedPath = [...basePath, ...currentRelativePath];

    const targetPathParts = targetPath.split("/").filter(Boolean);

    for (const part of targetPathParts) {
      if (part === ".") {
        continue;
      } else if (part === "..") {
        resolvedPath.pop();
      } else {
        resolvedPath.push(part);
      }
    }

    return resolvedPath;
  }

  static resolve(_path = "") {
    const resolvedPath = Path.traverse(_path);

    let resolved = dirMap;
    for (const part of resolvedPath) {
      resolved = resolved[part];
    }

    return resolved;
  }

  static absolute(_path) {
    const path = Path.traverse(_path);
    return `/${path.join("/")}`;
  }

  static outOfBounds(_path = "") {
    if (!_path) return false;
    const path = Path.absolute(_path);
    return path.startsWith("/") && !path.startsWith("/home/guest");
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

const scripts = {
  welcome,
};

async function welcome() {
  await simulateTyping("fastfetch");
  await sleep();
  handleCommand();
  createNewLine();

  await sleep(400);

  await simulateTyping("ls -l");
  await sleep();
  handleCommand();
  createNewLine();
}

scripts.welcome();

const CONSTANTS = {
  HELP: `GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)
These shell commands are defined internally.  Type \help' to see this list.
Type \help name' to find out more about the function \name'.
Use \info bash' to find out more about the shell in general.
Use \man -k' or \`info' to find out more about commands not in this list.

A star (*) next to a name means that the command is disabled.

 job_spec [&]                                      history [-c] [-d offset] [n] or history -anrw >
 (( expression ))                                  if COMMANDS; then COMMANDS; [ elif COMMANDS; t>
 . filename [arguments]                            jobs [-lnprs] [jobspec ...] or jobs -x command>
 :                                                 kill [-s sigspec | -n signum | -sigspec] pid |>
 [ arg... ]                                        let arg [arg ...]
 [[ expression ]]                                  local [option] name[=value] ...
 alias [-p] [name[=value] ... ]                    logout [n]
 bg [job_spec ...]                                 mapfile [-d delim] [-n count] [-O origin] [-s >
 bind [-lpsvPSVX] [-m keymap] [-f filename] [-q >  popd [-n] [+N | -N]
 break [n]                                         printf [-v var] format [arguments]
 builtin [shell-builtin [arg ...]]                 pushd [-n] [+N | -N | dir]
 caller [expr]                                     pwd [-LP]
 case WORD in [PATTERN [| PATTERN]...) COMMANDS >  read [-ers] [-a array] [-d delim] [-i text] [->
 cd [-L|[-P [-e]] [-@]] [dir]                      readarray [-d delim] [-n count] [-O origin] [->
 command [-pVv] command [arg ...]                  readonly [-aAf] [name[=value] ...] or readonly>
 compgen [-abcdefgjksuv] [-o option] [-A action]>  return [n]
 complete [-abcdefgjksuv] [-pr] [-DEI] [-o optio>  select NAME [in WORDS ... ;] do COMMANDS; done
 compopt [-o|+o option] [-DEI] [name ...]          set [-abefhkmnptuvxBCHP] [-o option-name] [--]>
 continue [n]                                      shift [n]
 coproc [NAME] command [redirections]              shopt [-pqsu] [-o] [optname ...]
 declare [-aAfFgiIlnrtux] [-p] [name[=value] ...>  source filename [arguments]
 dirs [-clpv] [+N] [-N]                            suspend [-f]
 disown [-h] [-ar] [jobspec ... | pid ...]         test [expr]
 echo [-neE] [arg ...]                             time [-p] pipeline
 enable [-a] [-dnps] [-f filename] [name ...]      times
 eval [arg ...]                                    trap [-lp] [[arg] signal_spec ...]
 exec [-cl] [-a name] [command [argument ...]] [>  true
 exit [n]                                          type [-afptP] name [name ...]
 export [-fn] [name[=value] ...] or export -p      typeset [-aAfFgiIlnrtux] [-p] name[=value] ...
 false                                             ulimit [-SHabcdefiklmnpqrstuvxPT] [limit]
 fc [-e ename] [-lnr] [first] [last] or fc -s [p>  umask [-p] [-S] [mode]
 fg [job_spec]                                     unalias [-a] name [name ...]
 for NAME [in WORDS ... ] ; do COMMANDS; done      unset [-f] [-v] [-n] [name ...]
 for (( exp1; exp2; exp3 )); do COMMANDS; done     until COMMANDS; do COMMANDS; done
 function name { COMMANDS ; } or name () { COMMA>  variables - Names and meanings of some shell v>
 getopts optstring name [arg ...]                  wait [-fn] [-p var] [id ...]
 hash [-lr] [-p pathname] [-dt] [name ...]         while COMMANDS; do COMMANDS; done
 help [-dms] [pattern ...]                         { COMMANDS ; }`,
};

const windowEl = document.getElementById("window");
const headerEl = document.getElementById("window-header");
const btnClose = document.getElementById("btn-close");
const btnMinimize = document.getElementById("btn-minimize");
const btnMaximize = document.getElementById("btn-maximize");

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

let isResizing = false;
let resizeDirection = "";
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartLeft = 0;
let resizeStartTop = 0;

headerEl.addEventListener("mousedown", (e) => {
  if (e.target.closest(".header-control")) return;

  if (e.detail === 2) {
    btnMaximize.click();
    return;
  }

  const wasMaximized = windowEl.classList.contains("maximized");

  isDragging = true;

  if (wasMaximized) {
    // First restore the window to get its natural size
    windowEl.classList.remove("maximized");
    windowEl.style.width = "";
    windowEl.style.height = "";
    windowEl.style.transform = "none";
    windowEl.style.left = "";
    windowEl.style.top = "";

    // Force reflow to get the actual restored dimensions
    const restoredWidth = windowEl.offsetWidth;

    // Position window so cursor is centered on title bar
    windowEl.style.left = e.clientX - restoredWidth / 2 + "px";
    windowEl.style.top = e.clientY - 16 + "px"; // 16px is roughly header center

    dragOffsetX = restoredWidth / 2;
    dragOffsetY = 16;
  } else {
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.transform = "none";
    windowEl.style.left = rect.left + "px";
    windowEl.style.top = rect.top + "px";
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  }

  windowEl.style.transition = "none";
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    if (!windowEl.classList.contains("maximized")) {
      windowEl.style.left = e.clientX - dragOffsetX + "px";
      windowEl.style.top = e.clientY - dragOffsetY + "px";
    }
  }

  if (isResizing) {
    handleResize(e);
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  resizeDirection = "";
  windowEl.style.transition = "";
});

document.querySelectorAll(".resize-handle").forEach((handle) => {
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeDirection = handle.className
      .split(" ")
      .find((c) => c.startsWith("resize-") && c !== "resize-handle")
      .replace("resize-", "");
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.transform = "none";
    windowEl.style.left = rect.left + "px";
    windowEl.style.top = rect.top + "px";
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartWidth = rect.width;
    resizeStartHeight = rect.height;
    resizeStartLeft = rect.left;
    resizeStartTop = rect.top;
    windowEl.style.transition = "none";
  });
});

function handleResize(e) {
  const dx = e.clientX - resizeStartX;
  const dy = e.clientY - resizeStartY;

  const minWidth = 400;
  const minHeight = 300;

  if (
    resizeDirection === "e" ||
    resizeDirection === "ne" ||
    resizeDirection === "se"
  ) {
    const newWidth = Math.max(minWidth, resizeStartWidth + dx);
    windowEl.style.width = newWidth + "px";
  }

  if (
    resizeDirection === "w" ||
    resizeDirection === "nw" ||
    resizeDirection === "sw"
  ) {
    const newWidth = Math.max(minWidth, resizeStartWidth - dx);
    windowEl.style.width = newWidth + "px";
    windowEl.style.left = resizeStartLeft + dx + "px";
  }

  if (
    resizeDirection === "s" ||
    resizeDirection === "se" ||
    resizeDirection === "sw"
  ) {
    const newHeight = Math.max(minHeight, resizeStartHeight + dy);
    windowEl.style.height = newHeight + "px";
  }

  if (
    resizeDirection === "n" ||
    resizeDirection === "ne" ||
    resizeDirection === "nw"
  ) {
    const newHeight = Math.max(minHeight, resizeStartHeight - dy);
    windowEl.style.height = newHeight + "px";
    windowEl.style.top = resizeStartTop + dy + "px";
  }
}

btnClose.addEventListener("click", () => {
  windowEl.classList.add("closed");
});

const terminalShortcut = document.getElementById("terminal-shortcut");
const desktop = document.querySelector(".desktop");

terminalShortcut.addEventListener("click", (e) => {
  e.stopPropagation();
  terminalShortcut.classList.add("selected");
});

terminalShortcut.addEventListener("dblclick", (e) => {
  e.stopPropagation();
  windowEl.classList.remove("closed");
});

desktop.addEventListener("click", () => {
  terminalShortcut.classList.remove("selected");
});

btnMinimize.addEventListener("click", () => {
  windowEl.classList.add("minimized");
  setTimeout(() => {
    windowEl.classList.remove("minimized");
  }, 100);
});

btnMaximize.addEventListener("click", () => {
  windowEl.classList.toggle("maximized");
  if (windowEl.classList.contains("maximized")) {
    windowEl.style.left = "0";
    windowEl.style.top = "0";
    windowEl.style.transform = "none";
    windowEl.style.width = "100vw";
    windowEl.style.height = "100dvh";
  } else {
    windowEl.style.width = "";
    windowEl.style.height = "";
    windowEl.style.transform = "translate(-50%, -50%)";
    windowEl.style.left = "50%";
    windowEl.style.top = "50%";
  }
});
