// Element Declarations
const sidebar = document.getElementById("app-sidebar");
const main = document.querySelector("main");
const searchBar = document.getElementById("search-bar");
const storageDirectoryButton = document.getElementById(
  "storage-directory-button"
);

let storageDirectoryPath;
let currentFilename = null;

document.addEventListener("DOMContentLoaded", async () => {
  storageDirectoryPath = localStorage.getItem("storageDirectoryPath");

  if (storageDirectoryPath !== null) {
    loadFileList();
  }
});

storageDirectoryButton.onclick = handleStorageDirectoryButtonClick;
sidebar.oncontextmenu = handleOpenContextMenu;
searchBar.oninput = handleSearch;

electron.onCloseContextMenu(handleCloseContextMenu);
electron.onCreateNewFile(handleCreateNewFile);
electron.onRemoveFile(handleRemoveFile);
electron.onRenameFile(handleRenameFile);

delegateEvent(".file-list__item", "click", handleFileListItemClick);
delegateEvent(".file-list__item", "dblclick", (event) =>
  handleRenameFile(event, event.target.dataset.filename)
);
delegateEvent(".editor", "input", handleEditorInput);
addKeyboardShortcut("Tab", handleEditorTabbed);
addKeyboardShortcut("Enter", handleFileRenameEnd);
delegateEvent(".file-list__item", "blur", (event) => handleFileRenameEnd);

let mouseOver = false;
let resizing = false;

let sidebarRect = sidebar.getBoundingClientRect();

document.addEventListener("mousemove", (event) => {
  if (resizing) {
    sidebar.style.width = event.x + "px";
  } else {
    let sidebarRect = sidebar.getBoundingClientRect();

    if (Math.abs(event.x - sidebarRect.right) < 5) {
      document.body.style.cursor = "col-resize";
      mouseOver = true;
    } else {
      document.body.style.cursor = "initial";
      mouseOver = false;
    }
  }
});

document.addEventListener("mousedown", (event) => {
  if (mouseOver) {
    resizing = true;
  }
});

document.addEventListener("mouseup", (event) => {
  if (resizing) {
    resizing = false;
    sidebarRect = sidebar.getBoundingClientRect();
  }
});

// Event Handlers
async function handleStorageDirectoryButtonClick(event) {
  storageDirectoryPath = await electron.showDialog();

  if (storageDirectoryPath) {
    localStorage.setItem("storageDirectoryPath", storageDirectoryPath);
    loadFileList();
  }
}

function handleOpenContextMenu(event) {
  const isFileListItem = event.target.matches(".file-list__item");

  if (isFileListItem) {
    const filename = event.target.dataset.filename;

    changeFileListFocus(filename);
    electron.showContextMenu(storageDirectoryPath, filename);
  } else {
    electron.showContextMenu(storageDirectoryPath);
  }
}

function handleEditorTabbed(event) {
  event.preventDefault();

  const editor = event.target;
  const caretPosition = editor.selectionEnd;

  editor.value = insertCharacter(editor.value, "\t", caretPosition);
  editor.selectionEnd = caretPosition + 1;

  electron.overwriteFile(editor.value, currentFilename, storageDirectoryPath);
}

function handleFileRenameEnd(event) {
  const fileListItem = event.target;
  const currentFilename = fileListItem.dataset.filename;
  const newFilename = fileListItem.textContent;

  makeFileListItemUneditable(currentFilename, newFilename);
  electron.renameFile(currentFilename, newFilename, storageDirectoryPath);
}

async function handleFileListItemClick(event) {
  const isEditable = event.target.getAttribute("contenteditable") === "true";

  if (!isEditable) {
    const filename = event.target.dataset.filename;

    currentFilename = filename;
    selectFileListItem(filename);

    const noteContent = await electron.readFile(filename, storageDirectoryPath);
    updateEditor(noteContent);
  }
}

function handleCloseContextMenu() {
  changeFileListFocus(null);
}
function handleCreateNewFile(_, filename) {
  createFileListItem(filename);
}
function handleRemoveFile(_, filename) {
  removeFileListItem(filename);
}
function handleRenameFile(_, filename) {
  makeFileListItemEditable(filename);
}

function handleEditorInput(event) {
  const editor = event.target;
  electron.overwriteFile(editor.value, currentFilename, storageDirectoryPath);
}

function handleSearch(event) {
  const searchQuery = event.target.value;

  const fileListItems = document.querySelectorAll(".file-list__item");
  fileListItems.forEach((fileListItem) => {
    const { filename } = fileListItem.dataset;

    if (!filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      fileListItem.hidden = true;
    } else {
      fileListItem.hidden = false;
    }
  });
}

// Loaders
async function loadFileList() {
  const filenames = await electron.getFilesInDirectory(storageDirectoryPath);
  renderFileList(filenames);
}

// Renderers
const renderFileList = (filenames) => {
  const fileList = createElement("ul", {
    className: "file-list",
    role: "list",
  });

  sidebar.replaceChildren(fileList);

  filenames.forEach((filename) => {
    const fileListItem = createFileListItem(filename);
    fileList.prepend(fileListItem);
  });
};

const createFileListItem = (filename) => {
  const name = filename.slice(0, -4);
  const fileListItem = createElement(
    "li",
    {
      className: "file-list__item",
      dataset: { filename },
    },
    name
  );

  return fileListItem;
};

const removeFileListItem = (filename) => {
  const fileListItem = getElementByDataAttribute("filename", filename);
  fileListItem.remove();
};

const makeFileListItemEditable = (filename) => {
  const fileListItem = getElementByDataAttribute("filename", filename);

  fileListItem.setAttribute("contenteditable", true);
  selectAll(fileListItem);
};

const makeFileListItemUneditable = (currentFilename, newFilename) => {
  const fileListItem = getElementByDataAttribute("filename", currentFilename);

  fileListItem.setAttribute("contenteditable", false);
  fileListItem.dataset.filename = newFilename + ".txt";
  fileListItem.scrollLeft = "0";
};

const selectFileListItem = (filename) => {
  const fileListItems = document.querySelectorAll(".file-list__item");

  fileListItems.forEach((listItem) => {
    if (listItem.dataset.filename === filename) {
      listItem.classList.add("selected");
    } else {
      listItem.classList.remove("selected");
    }
  });
};

const changeFileListFocus = (filename) => {
  const fileListItems = document.querySelectorAll(".file-list__item");

  fileListItems.forEach((listItem) => {
    if (listItem.dataset.filename === filename) {
      listItem.classList.add("active");
    } else {
      listItem.classList.remove("active");
    }
  });
};

const renderEditor = () => {
  const editor = createElement("textarea", {
    className: "editor | container",
  });

  main.replaceChildren(editor);

  return editor;
};

const updateEditor = (noteContent) => {
  const editor = document.querySelector(".editor") ?? renderEditor();
  editor.value = noteContent;
};

// Utilities
function getElementByDataAttribute(attribute, value) {
  return document.querySelector(`[data-${attribute}="${value}"]`);
}

function createElement(type, attributes, children) {
  const element = document.createElement(type);

  if (attributes?.hasOwnProperty("className")) {
    element.className = attributes.className;
  }

  for (attribute in attributes) {
    const attributeValue = attributes[attribute];
    element.setAttribute(attribute, attributeValue);
  }

  if (attributes?.hasOwnProperty("dataset")) {
    const { dataset } = attributes;

    for (key in dataset) {
      element.dataset[key] = dataset[key];
    }
  }

  if (children !== undefined) element.innerHTML = children;

  return element;
}

function selectAll(element) {
  const range = document.createRange();
  const selection = window.getSelection();

  if (selection.rangeCount > 0) {
    selection.removeAllRanges();
  }

  range.selectNodeContents(element);
  selection.addRange(range);
}

function delegateEvent(selector, type, callback, options) {
  document.addEventListener(
    type,
    (event) => {
      if (event.target.matches(selector)) callback(event);
    },
    { ...options, capture: type === "focus" || type === "blur" ? true : false }
  );
}

function addKeyboardShortcut(key, callback) {
  document.addEventListener("keydown", (event) => {
    if (event.key === key) callback(event);
  });
}

function insertCharacter(string, character, position) {
  return (
    string.slice(0, position) +
    character +
    string.slice(position, string.length)
  );
}
