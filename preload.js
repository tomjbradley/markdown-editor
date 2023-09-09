const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  showDialog: () => {
    return ipcRenderer.invoke("showDialog");
  },
  getFilesInDirectory: (directoryPath) => {
    return ipcRenderer.invoke("getFilesInDirectory", directoryPath);
  },
  readFile: (filename, directoryPath) => {
    return ipcRenderer.invoke("readFile", filename, directoryPath);
  },
  renameFile: (currentFilename, newFilename, directoryPath) => {
    return ipcRenderer.invoke(
      "renameFile",
      currentFilename,
      newFilename,
      directoryPath
    );
  },
  showContextMenu: (directoryPath, filename) => {
    ipcRenderer.send("showContextMenu", directoryPath, filename);
  },
  overwriteFile: (content, filename, directoryPath) => {
    ipcRenderer.invoke("overwriteFile", content, filename, directoryPath);
  },
  onCloseContextMenu: (callback) => {
    ipcRenderer.on("closeContextMenu", callback);
  },
  onCreateNewFile: (callback) => {
    ipcRenderer.on("createNewFile", callback);
  },
  onRemoveFile: (callback) => {
    ipcRenderer.on("removeFile", callback);
  },
  onRenameFile: (callback) => {
    ipcRenderer.on("renameFile", callback);
  },
});
