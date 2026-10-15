const WS_URL = 'wss://wom-projekt-2-websocket.onrender.com';
 
const loginCard = document.getElementById('loginCard');

const appCard = document.getElementById('appCard');
 
const usernameInput = document.getElementById('username');

const passwordInput = document.getElementById('password');
 
const loginBtn = document.getElementById('loginBtn');

const logoutBtn = document.getElementById('logoutBtn');

const reconnectBtn = document.getElementById('reconnectBtn');
 
const statusText = document.getElementById('statusText');

const statusDot = document.getElementById('statusDot');
 
const pasteText = document.getElementById('pasteText');

const sendBtn = document.getElementById('sendBtn');

const copyBtn = document.getElementById('copyBtn');
 
const loginError = document.getElementById('loginError');

const messageInfo = document.getElementById('messageInfo');
 
let socket = null;

let manualClose = false;
 
function setStatus(text, type = '') {

  statusText.textContent = text;

  statusDot.className = 'dot';
 
  if (type) {

    statusDot.classList.add(type);

  }

}
 
function showApp() {

  loginCard.classList.add('hidden');

  appCard.classList.remove('hidden');

}
 
function showLogin() {

  appCard.classList.add('hidden');

  loginCard.classList.remove('hidden');

}
 
async function login() {

  loginError.textContent = '';
 
  try {

    await window.desktopAuth.login({

      username: usernameInput.value,

      password: passwordInput.value

    });
 
    showApp();

    await connectWebSocket();

  } catch (error) {

    console.error(error);

    loginError.textContent = 'Login failed';

  }

}
 
async function connectWebSocket() {

  const token = await window.desktopAuth.getAccessToken();
 
  if (!token) {

    showLogin();

    return;

  }
 
  if (socket) {

    manualClose = true;

    socket.close();

  }
 
  manualClose = false;

  setStatus('Connecting...');
 
  socket = new WebSocket(

    `${WS_URL}?token=${encodeURIComponent(token)}`

  );
 
  socket.onopen = () => {

    setStatus('Connected', 'connected');

  };
 
  socket.onmessage = (event) => {

    pasteText.value = event.data;

    messageInfo.textContent = 'Text received';

  };
 
  socket.onerror = () => {

    setStatus('Connection error', 'error');

  };
 
  socket.onclose = async () => {

    setStatus('Disconnected', 'error');
 
    if (manualClose) {

      return;

    }
 
    try {

      await window.desktopAuth.refresh();

      await connectWebSocket();

    } catch (error) {

      console.error(error);

      showLogin();

      loginError.textContent =

        'Session expired. Please log in again.';

    }

  };

}
 
function sendText() {

  if (

    !socket ||

    socket.readyState !== WebSocket.OPEN

  ) {

    setStatus('Not connected', 'error');

    return;

  }
 
  socket.send(pasteText.value);

}
 
async function logout() {

  try {

    await window.desktopAuth.logout();

  } catch (error) {

    console.error(error);

  }
 
  if (socket) {

    manualClose = true;

    socket.close();

    socket = null;

  }
 
  pasteText.value = '';

  messageInfo.textContent = '';
 
  showLogin();

}
 
loginBtn.addEventListener('click', login);
 
logoutBtn.addEventListener('click', logout);
 
reconnectBtn.addEventListener(

  'click',

  connectWebSocket

);
 
sendBtn.addEventListener(

  'click',

  sendText

);
 
copyBtn.addEventListener(

  'click',

  async () => {

    await navigator.clipboard.writeText(

      pasteText.value

    );
 
    messageInfo.textContent = 'Copied';

  }

);
 
(async () => {

  try {

    const hasSession =

      await window.desktopAuth.hasSession();
 
    if (hasSession) {

      showApp();

      await connectWebSocket();

    }

  } catch (error) {

    console.error(error);

  }

})();
 