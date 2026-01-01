const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_DATA_PATH = path.join(process.cwd(), 'AniScript_Projects');
if (!fs.existsSync(APP_DATA_PATH)) fs.mkdirSync(APP_DATA_PATH, { recursive: true });

function createWindow() {
    const win = new BrowserWindow({
        width: 1280, height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true, nodeIntegration: false,
        },
    });
    win.loadURL('http://localhost:3000');
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('create-project-folder', async (e, name) => {
    const p = path.join(APP_DATA_PATH, name);
    if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive:true});
    fs.mkdirSync(path.join(p, 'images'), {recursive:true});
    fs.mkdirSync(path.join(p, 'videos'), {recursive:true});
    return {success:true, path:p};
});

ipcMain.handle('save-asset', async (e, {projectName, type, fileName, data}) => {
    try {
        const buffer = Buffer.from(data.replace(/^data:.*?;base64,/, ""), 'base64');
        const filePath = path.join(APP_DATA_PATH, projectName, type, fileName);
        fs.writeFileSync(filePath, buffer);
        return {success:true};
    } catch(err) { return {success:false, error: err.message}; }
});