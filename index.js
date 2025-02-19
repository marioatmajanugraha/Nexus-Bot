// Import required modules
const axios = require('axios');
const WebSocket = require('ws');
const chalk = require('chalk');
const CFonts = require('cfonts');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');
const readlineSync = require('readline-sync');

// Display Banner
CFonts.say('Airdrop 888', {
  font: 'block',
  align: 'center',
  colors: ['cyan'],
});
console.log(chalk.cyan('🚀 Script coded by - @balveerxyz || Ping Nexus 🔥\n'));

// Load accounts.json
let wallets;
try {
  const data = fs.readFileSync('accounts.json', 'utf-8');
  wallets = JSON.parse(data);
  if (!Array.isArray(wallets) || wallets.length === 0) {
    console.log(chalk.red('⚠️ accounts.json tidak valid atau kosong!'));
    process.exit(1);
  }
} catch (err) {
  console.log(chalk.red('❌ Gagal membaca accounts.json!'));
  process.exit(1);
}

// Prompt Proxy Usage
const useProxy = readlineSync.question('🔌 Mau menggunakan proxy? (y/n): ').toLowerCase();
let proxies = [];
if (useProxy === 'y') {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(line => line.trim() !== '');
    if (proxies.length === 0) throw new Error();
  } catch (err) {
    console.log(chalk.red('⚠️ Gagal membaca proxy.txt atau proxy kosong!'));
    process.exit(1);
  }
}

// Random Proxy Function
const getRandomProxy = () => {
  const proxy = proxies[Math.floor(Math.random() * proxies.length)].trim();
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
    return new HttpsProxyAgent(proxy);
  }
  if (proxy.startsWith('socks5://')) {
    return new SocksProxyAgent(proxy);
  }
  console.log(chalk.red('⚠️ Format proxy tidak dikenali: ' + proxy));
  return null;
};

// Shorten Wallet Address for Display
const shortenWallet = (wallet) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

// Ping Function
const pingWallet = (wallet) => {
  const walletShort = shortenWallet(wallet);
  console.log(chalk.yellow(`\n🔔 Melakukan ping untuk wallet: ${walletShort}`));
  
  let reconnectAttempts = 0;

  const startWebSocket = () => {
    const wsOptions = useProxy === 'y' ? { agent: getRandomProxy() } : {};
    const ws = new WebSocket('wss://metamask-sdk.api.cx.metamask.io/socket.io/?EIO=4&transport=websocket', wsOptions);

    ws.on('open', () => {
      console.log(chalk.green('✅ Terhubung ke websocket!'));
      reconnectAttempts = 0;

      // Step 1: Handshake
      ws.send('40');

      // Step 2: Join Channel
      setTimeout(() => {
        ws.send(`420["join_channel",{"channelId":"a75e1ea6-35c5-458b-973e-293f65620790","context":"dapp_connectToChannel","wallet":"${wallet}"}]`);
      }, 1000);

      // Step 3: Kirim Ping secara terus-menerus
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`42["ping",{"id":"a75e1ea6-35c5-458b-973e-293f65620790","clientType":"dapp","context":"on_channel_config","wallet":"${wallet}"}]`);
          console.log(chalk.blue('📡 Ping dikirim untuk wallet: ' + walletShort));
        }
      }, 10000);

      ws.on('message', (data) => {
        const message = data.toString();
        if (message.startsWith('0')) {
          console.log(chalk.magenta('📩 Session dimulai'));
        } else if (message.startsWith('40')) {
          console.log(chalk.magenta('📩 Channel bergabung'));
        } else if (message.startsWith('42')) {
          console.log(chalk.magenta('📩 Update channel'));
        } else if (message.startsWith('2')) {
          console.log(chalk.magenta('📩 Ping diterima'));
        } else {
          console.log(chalk.gray('📩 Pesan lainnya'));
        }
      });

      ws.on('close', () => {
        clearInterval(pingInterval);
        console.log(chalk.red('🔴 Koneksi websocket ditutup untuk wallet: ' + walletShort));
        reconnectAttempts++;
        if (reconnectAttempts <= 3) {
          console.log(chalk.yellow(`♻️ Mencoba reconnect untuk wallet: ${walletShort} (${reconnectAttempts}/3)`));
          setTimeout(startWebSocket, 5000);
        } else {
          console.log(chalk.red(`❌ Gagal reconnect 3 kali, melewati wallet: ${walletShort}`));
        }
      });

      ws.on('error', (err) => {
        console.log(chalk.red('❌ Error websocket: '), err.message);
      });
    });
  };

  startWebSocket();
};

// Start Ping for All Wallets
console.log(chalk.green('\n🚀 Mulai Ping untuk Semua Wallet...'));
wallets.forEach(wallet => pingWallet(wallet));
