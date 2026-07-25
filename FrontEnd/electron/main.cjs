const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

let autoUpdater = null;
try {
  autoUpdater = require("electron-updater").autoUpdater;
} catch (e) {
  console.log("electron-updater unavailable:", e.message);
}

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: "#0d1117",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev
    },
    title: "Lumina Crime Intelligence & Analytical Platform"
  });

  // Remove default menu bar
  mainWindow.setMenuBarVisibility(false);

  // Open Developer Tools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173").catch(() => {
      console.log("Dev server not ready yet, loading built dist...");
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Handle load failure gracefully
  mainWindow.webContents.on("did-fail-load", () => {
    console.log("Page failed to load. Retrying in 1s...");
    setTimeout(() => {
      if (isDev) {
        mainWindow.loadURL("http://localhost:5173").catch(() => {
          mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
        });
      } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
      }
    }, 1000);
  });
}

// Set up Auto-Updater Events
if (autoUpdater && !isDev) {
  autoUpdater.autoDownload = false; // Require explicit user confirmation before downloading
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("update-available", {
        version: info.version,
        releaseNotes: info.releaseNotes || "Performance enhancements, BNS legal code updates, interactive filters, and UI bug fixes.",
        releaseDate: info.releaseDate
      });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info.version);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("update-downloaded", {
        version: info.version
      });
    }
  });

  autoUpdater.on("error", (err) => {
    console.log("AutoUpdater Error:", err.message);
  });
}

// IPC Handlers for Update Actions
ipcMain.on("download-update", () => {
  if (autoUpdater && !isDev) {
    autoUpdater.downloadUpdate();
  }
});

ipcMain.on("quit-and-install", () => {
  if (autoUpdater && !isDev) {
    autoUpdater.quitAndInstall();
  } else {
    app.relaunch();
    app.exit(0);
  }
});

app.whenReady().then(() => {
  createWindow();

  // Check for updates from GitHub Releases
  if (autoUpdater && !isDev) {
    try {
      autoUpdater.checkForUpdates();
    } catch (err) {
      console.log("Auto-update check skipped:", err.message);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
