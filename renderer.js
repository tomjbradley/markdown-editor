// DOM Elements
const sidebar = document.querySelector(".app-sidebar");
const main = document.querySelector("main");
const storageDirectoryButton = document.getElementById(
  "storage-directory-button"
);

let storageDirectoryPath;
let currentFilename = null;
document.addEventListener("DOMContentLoaded", async () => {
  storageDirectoryPath = localStorage.getItem("storageDirectoryPath");

  if (storageDirectoryPath !== null) {
    const files = await electron.getFilesInDirectory(storageDirectoryPath);
    renderFileList(files);
  }
});

storageDirectoryButton.onclick = handleStorageDirectoryButtonClick;
addGlobalEventListener(".file-list__item", "click", handleFileListItemClick);

sidebar.oncontextmenu = handleOpenContextMenu;
electron.onCloseContextMenu(handleCloseContextMenu);
electron.onCreateNewFile(handleCreateNewFile);
electron.onRemoveFile(handleRemoveFile);
electron.onRenameFile(handleRenameFile);
addGlobalEventListener(".file-list__item", "dblclick", (event) =>
  handleRenameFile(event, event.target.dataset.filename)
);

addGlobalEventListener(".editor", "input", handleEditorInput);

// Logic
async function handleStorageDirectoryButtonClick(event) {
  storageDirectoryPath = await electron.showDialog();

  if (storageDirectoryPath) {
    localStorage.setItem("storageDirectoryPath", storageDirectoryPath);
    const files = await electron.getFilesInDirectory(storageDirectoryPath);
    renderFileList(files);
  }
}

async function handleFileListItemClick(event) {
  const isEditable = event.target.getAttribute("contenteditable") === "true";

  if (!isEditable) {
    const filename = event.target.dataset.filename;

    currentFilename = filename;

    changeFileListActivation(filename);

    const noteContent = await electron.readFile(filename, storageDirectoryPath);
    renderNoteContent(noteContent);
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

function handleCloseContextMenu(_event) {
  changeFileListFocus(null);
}

function handleCreateNewFile(_event, filename) {
  createFileListItem(filename);
}

function handleRemoveFile(_event, filename) {
  removeFileListItem(filename);
}

function handleRenameFile(_event, filename) {
  makeFileListItemEditable(filename);

  const fileListItem = document.querySelector(
    `.file-list__item[data-filename="${filename}"]`
  );

  fileListItem.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const newFilename = fileListItem.textContent;
      electron.renameFile(filename, newFilename, storageDirectoryPath);
      makeFileListItemUneditable(filename);
      fileListItem.dataset.filename = newFilename + ".txt";
      fileListItem.scrollLeft = "0";
    }
  });
  fileListItem.addEventListener("blur", (_event) => {
    const newFilename = fileListItem.textContent;
    electron.renameFile(filename, newFilename, storageDirectoryPath);
    makeFileListItemUneditable(filename);
    fileListItem.dataset.filename = newFilename + ".txt";
    fileListItem.scrollLeft = "0";
  });
}

function handleEditorInput(event) {
  electron.overwriteFile(
    event.target.innerText,
    currentFilename,
    storageDirectoryPath
  );
}

// Renderers
const renderFileList = (files) => {
  const fileList = document.createElement("ul");
  fileList.className = "file-list";
  fileList.role = "list";

  sidebar.replaceChildren(fileList);

  files.forEach((file) => createFileListItem(file));
};

const createFileListItem = (file) => {
  const fileList = document.querySelector(".file-list");

  const fileListItem = document.createElement("li");
  fileListItem.textContent = file.slice(0, -4);
  fileListItem.className = "file-list__item";
  fileListItem.dataset.filename = file;

  fileList.insertBefore(fileListItem, fileList.firstChild);
};

const removeFileListItem = (file) => {
  const fileListItem = document.querySelector(
    `.file-list__item[data-filename="${file}"]`
  );
  fileListItem.remove();
};

const makeFileListItemEditable = (file) => {
  const fileListItem = document.querySelector(
    `.file-list__item[data-filename="${file}"]`
  );
  fileListItem.setAttribute("contenteditable", true);

  fileListItem.focus();

  const range = document.createRange();
  range.selectNodeContents(fileListItem);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

const makeFileListItemUneditable = (file) => {
  const fileListItem = document.querySelector(
    `.file-list__item[data-filename="${file}"]`
  );
  fileListItem.setAttribute("contenteditable", false);
};

const changeFileListActivation = (filename) => {
  const fileListItems = document.querySelectorAll(".file-list__item");

  fileListItems.forEach((listItem) => {
    if (listItem.dataset.filename === filename) {
      listItem.classList.add("active");
    } else {
      listItem.classList.remove("active");
    }
  });
};

const changeFileListFocus = (filename) => {
  const fileListItems = document.querySelectorAll(".file-list__item");

  fileListItems.forEach((listItem) => {
    if (listItem.dataset.filename === filename) {
      listItem.classList.add("focus");
    } else {
      listItem.classList.remove("focus");
    }
  });
};

const renderNoteContent = (noteContent) => {
  let editor = document.querySelector(".editor") ?? createTextEditor();
  editor.textContent = noteContent;
};

const createTextEditor = () => {
  const textEditor = document.createElement("pre");
  textEditor.className = "editor";
  textEditor.setAttribute("contenteditable", true);
  main.firstElementChild.replaceWith(textEditor);

  return textEditor;
};

// Utilities
function addGlobalEventListener(selector, type, callback) {
  document.addEventListener(type, (event) => {
    if (event.target.matches(selector)) callback(event);
  });
}
