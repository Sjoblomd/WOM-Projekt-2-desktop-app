const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');

const path = require('path');

const fs = require('fs');
 
const AUTH_API_URL = 'https://wom-projekt-2-auth.onrender.com';
 
const TOKEN_FILE = path.join(

  app.getPath('userData'),

  'tokens.bin'

);
 
function createWindow() {

  const win = new BrowserWindow({

    width: 820,

    height: 720,

    webPreferences: {

      preload: path.join(__dirname, 'preload.js'),

      contextIsolation: true,

      nodeIntegration: false

    }

  });
 
  win.loadFile('index.html');

}
 
function saveTokens(tokens) {

  if (!safeStorage.isEncryptionAvailable()) {

    throw new Error('Secure storage is not available');

  }
 
  const encrypted = safeStorage.encryptString(

    JSON.stringify(tokens)

  );
 
  fs.writeFileSync(TOKEN_FILE, encrypted);

}
 
function loadTokens() {

  if (!fs.existsSync(TOKEN_FILE)) {

    return null;

  }
 
  const encrypted = fs.readFileSync(TOKEN_FILE);
 
  const decrypted = safeStorage.decryptString(

    encrypted

  );
 
  return JSON.parse(decrypted);

}
 
function deleteTokens() {

  if (fs.existsSync(TOKEN_FILE)) {

    fs.unlinkSync(TOKEN_FILE);

  }

}
 
ipcMain.handle(

  'auth:login',

  async (_event, credentials) => {

    const response = await fetch(

      `${AUTH_API_URL}/users/login`,

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify(credentials)

      }

    );
 
    if (!response.ok) {

      throw new Error('Login failed');

    }
 
    const data = await response.json();
 
    saveTokens({

      accessToken: data.accessToken,

      refreshToken: data.refreshToken

    });
 
    return data.user;

  }

);
 
ipcMain.handle(

  'auth:getAccessToken',

  async () => {

    const tokens = loadTokens();

    return tokens?.accessToken || null;

  }

);
 
ipcMain.handle(

  'auth:hasSession',

  async () => {

    const tokens = loadTokens();
 
    return Boolean(

      tokens?.accessToken &&

      tokens?.refreshToken

    );

  }

);
 
ipcMain.handle(

  'auth:refresh',

  async () => {

    const tokens = loadTokens();
 
    if (!tokens?.refreshToken) {

      throw new Error('No refresh token');

    }
 
    const response = await fetch(

      `${AUTH_API_URL}/users/refresh`,

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          refreshToken: tokens.refreshToken

        })

      }

    );
 
    if (!response.ok) {

      deleteTokens();

      throw new Error('Refresh failed');

    }
 
    const data = await response.json();
 
    tokens.accessToken = data.accessToken;
 
    saveTokens(tokens);
 
    return true;

  }

);
 
ipcMain.handle(

  'auth:logout',

  async () => {

    const tokens = loadTokens();
 
    if (tokens?.refreshToken) {

      try {

        await fetch(

          `${AUTH_API_URL}/users/refresh`,

          {

            method: 'DELETE',

            headers: {

              Authorization:

                `Bearer ${tokens.refreshToken}`

            }

          }

        );

      } catch (error) {

        console.error(error);

      }

    }
 
    deleteTokens();
 
    return true;

  }

);
 
app.whenReady().then(createWindow);
 
app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {

    app.quit();

  }

});
 