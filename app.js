function encrypt(str) {
  const encBytes = new Uint8Array(str.length+4);
  const encBytesVw = new DataView(encBytes.buffer);
  encBytesVw.setUint32(0, str.length);
  let key = 171;
  let a;
  for (let i = 0; i < str.length; i++) {
    let cc = str.charCodeAt(i); 
    if (cc > 255) {
      throw Error('Not ASCII')
    }
    a = key ^ cc;
    key = a;
    encBytes[i+4] = a
  }
  return encBytes.buffer;
}

 
function decrypt(buf) {
  const bytes = new Uint8Array(buf)
  const bufVw = new DataView(buf)
  const strLength = bufVw.getUint32(0)
  if (bytes.length < strLength + 4) {
    throw Error('Underflow')
  } else if (bytes.length > strLength + 4) {
    throw Error('Overflow')
  }

  let key = 171;
  let a;
  let str = '';
  for (let i = 4; i < bytes.length; i++) {
    a = key ^ bytes[i]
    key = bytes[i]
    str += String.fromCharCode(a)
  }
  return str
}

const $ = document.querySelector.bind(document);
const $o1 = $('#o1');
const $o2 = $('#o2');
const $o3 = $('#o3');
const $o4 = $('#o4');
const $p = $('#port');
const $btnOn = $('#on');
const $btnOff = $('#off');

const CMD_ON = '{"system":{"set_relay_state":{"state":1}}}';
const CMD_OFF = '{"system":{"set_relay_state":{"state":0}}}';

function sendCmd(cmd) {
  const ip = [$o1,$o2,$o3,$o4].map((e) => e.value).join('.');
  const port = Number($p.value);

  // Create Socket
  chrome.sockets.tcp.create(({ socketId }) => {
    // Check for errors
    if (chrome.runtime.lastError) {
      console.log(`c.s.tcp.create: ${chrome.runtime.lastError.message}`)
      return
    }

    console.log(`Created socket ${socketId}`);

    // Connect socket
    chrome.sockets.tcp.connect(socketId, ip, port, (connectResult) => {
      // Check for errors
      if (connectResult !== 0 || chrome.runtime.lastError) {
        if (connectResult !== 0) {
          console.log(`${socketId}: Error: ${connectResult}`);
        }
        if (chrome.runtime.lastError) {
          console.log(`${socketId}: ${chrome.runtime.lastError.message}`);
        }
        return;
      }

      console.log(`${socketId}: Connected to ${ip}:${port}`);
      console.log(`${socketId}: Sending ${cmd}`);

      // Send command
      chrome.sockets.tcp.send(socketId, encrypt(cmd), (sendInfo) => {
        // Check for errors
        if (sendInfo.resultCode !== 0 || chrome.runtime.lastError) {
          if (sendInfo.resultCode !== 0) {
            console.log(`${socketId}: Error: ${sendInfo.resultCode}`);
          }
          if (chrome.runtime.lastError) {
            console.log(`${socketId}: ${chrome.runtime.lastError.message}`);
          }
          return;
        }

        console.log(`${socketId} Sent ${sendInfo.bytesSent} bytes`);

        // Close Socket
        chrome.sockets.tcp.close(socketId, () => {
          // Check for errors
          if (chrome.runtime.lastError) {
            console.log(`${socketId}: ${chrome.runtime.lastError.message}`);
            return
          }
          console.log(`Closed socket ${socketId}`);
        }) /* Close */;
      }) /* Send */;
    }) /* Connect */;
  }) /* Create */;
} /* sendCmd */

function sendOn() {
  sendCmd(CMD_ON);
}

function sendOff() {
  sendCmd(CMD_OFF);
}

$btnOn.addEventListener('click', sendOn);
$btnOff.addEventListener('click', sendOff);

