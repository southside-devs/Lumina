const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
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

  // Open Developer Tools in dev mode for diagnostics
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
