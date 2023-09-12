require("dotenv").config();

const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const createWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.loadFile("index.html");
};

const showDialog = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!canceled) {
    return filePaths[0];
  }
};

const getFilesInDirectory = async (_event, directoryPath) => {
  try {
    const dirents = await fs.readdir(directoryPath, { withFileTypes: true });
    const files = dirents
      .filter((dirent) => dirent.isFile() && dirent.name !== ".DS_Store")
      .map((dirent) => dirent.name);

    return files;
  } catch (error) {
    console.error(error);
  }
};

const readFile = async (_event, filename, directoryPath) => {
  try {
    return fs.readFile(path.join(directoryPath, filename), {
      encoding: "utf8",
    });
  } catch (error) {
    console.error(error);
  }
};

const renameFile = async (
  _event,
  currentFilename,
  newFilename,
  directoryPath
) => {
  try {
    await fs.rename(
      path.join(directoryPath, currentFilename),
      path.join(directoryPath, newFilename) + ".txt"
    );
  } catch (error) {
    console.error(error);
  }
};

const overwriteFile = async (_event, content, filename, directoryPath) => {
  try {
    await fs.writeFile(path.join(directoryPath, filename), content);
  } catch (error) {
    console.error(error);
  }
};

const showContextMenu = (_event, directoryPath, filename) => {
  const targetIsFile = filename !== undefined;

  const template = [
    {
      label: "Rename",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.send(
          "renameFile",
          filename
        );
      },
      enabled: targetIsFile,
    },
    {
      label: "Delete",
      click: async () => {
        await fs.unlink(path.join(directoryPath, filename));

        BrowserWindow.getFocusedWindow().webContents.send(
          "removeFile",
          filename
        );
      },
      enabled: targetIsFile,
    },
    {
      label: "New...",
      click: async () => {
        const addLeadingZero = (x) => (x < 10 ? "0" + x : x);

        const date = new Date();
        const filename =
          date.getFullYear() +
          addLeadingZero(date.getMonth() + 1) +
          addLeadingZero(date.getDate()) +
          +addLeadingZero(date.getHours()) +
          +addLeadingZero(date.getMinutes()) +
          ".txt";

        await fs.writeFile(path.join(directoryPath, filename), "");

        BrowserWindow.getFocusedWindow().webContents.send(
          "createNewFile",
          filename
        );
      },
    },
    { type: "separator" },
    {
      label: "Copy Title",
      click: () => {},
      enabled: targetIsFile,
    },
    {
      label: "Copy Link",
      click: () => {},
      enabled: targetIsFile,
    },
    { type: "separator" },
    {
      label: "Reveal in Finder",
      click: () => {},
      enabled: targetIsFile,
    },
    {
      label: "Open with External Editor",
      click: () => {},
      enabled: targetIsFile,
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup();

  menu.on("menu-will-close", () =>
    BrowserWindow.getFocusedWindow().webContents.send("closeContextMenu")
  );
};

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();

  ipcMain.handle("showDialog", showDialog);
  ipcMain.handle("getFilesInDirectory", getFilesInDirectory);
  ipcMain.handle("readFile", readFile);
  ipcMain.handle("renameFile", renameFile);
  ipcMain.handle("overwriteFile", overwriteFile);
  ipcMain.on("showContextMenu", showContextMenu);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function createApplicationMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { label: "Settings", click: () => {} },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "Note",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    { label: "Format", submenu: [] },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { label: "Navigate", submenu: [] },
    { label: "Search", submenu: [] },
    { label: "Saved Searches", submenu: [] },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
