const WebSocket = require('ws');
const chalk = require('chalk');
const CFonts = require('cfonts');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const readlineSync = require('readline-sync');

// Constants
const MAX_RETRIES = 20; // Maximum number of retry attempts
const BASE_RETRY_DELAY = 2000; // Base delay in ms (2 seconds)
const MAX_RETRY_DELAY = 60000; // Maximum delay in ms (1 minute)

// Fungsi untuk menghitung delay dengan exponential backoff
const calculateRetryDelay = (retryCount) => {
  // Exponential backoff: BASE_RETRY_DELAY * 2^retryCount
  const delay = Math.min(BASE_RETRY_DELAY * Math.pow(1.5, retryCount), MAX_RETRY_DELAY);
  return delay;
};

// Tampilkan Banner
CFonts.say('Airdrop 888', {
  font: 'block',
  align: 'center',
  colors: ['magenta', 'cyan'],
});
console.log(chalk.cyan('🚀 Script coded by - @balveerxyz || Ping Nexus 🔥\n'));

// Baca Wallets
let wallets;
try {
  wallets = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
  if (!Array.isArray(wallets) || wallets.length === 0) throw new Error('Wallet array is empty');
  
  // Validate wallet addresses
  const invalidWallets = wallets.filter(wallet => 
    wallet === "WALLET ADDRESS KALIAN" || 
    !wallet || 
    typeof wallet !== 'string' || 
    !wallet.match(/^(0x)?[0-9a-fA-F]{40}$/)
  );
  
  if (invalidWallets.length > 0) {
    console.log(chalk.red(`❌ Ditemukan ${invalidWallets.length} wallet tidak valid di accounts.json!`));
    console.log(chalk.yellow('⚠️ Pastikan Anda telah mengganti "WALLET ADDRESS KALIAN" dengan alamat wallet Ethereum yang valid.'));
    process.exit(1);
  }
} catch (err) {
  console.log(chalk.red(`❌ Gagal membaca accounts.json: ${err.message}`));
  console.log(chalk.yellow('⚠️ Pastikan file accounts.json ada dan berisi array alamat wallet yang valid.'));
  process.exit(1);
}

// Prompt Proxy
const useProxy = readlineSync.question('Mau menggunakan proxy? (y/n): ').toLowerCase();
let proxies = [];
if (useProxy === 'y') {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').map(p => p.trim()).filter(Boolean);
    if (proxies.length === 0) {
      console.log(chalk.yellow('⚠️ File proxy.txt kosong! Melanjutkan tanpa proxy...'));
      console.log(chalk.yellow('⚠️ Jika Anda ingin menggunakan proxy, tambahkan proxy ke proxy.txt dan restart script.'));
    } else {
      console.log(chalk.green(`✅ Berhasil memuat ${proxies.length} proxy dari proxy.txt`));
    }
  } catch (err) {
    console.log(chalk.red(`❌ Gagal membaca proxy.txt: ${err.message}`));
    console.log(chalk.yellow('⚠️ Melanjutkan tanpa proxy...'));
  }
}

// Fungsi Ambil Proxy Acak
const getRandomProxy = () => {
  if (proxies.length === 0) return null;
  
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  try {
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) return new HttpsProxyAgent(proxy);
    if (proxy.startsWith('socks5://')) return new SocksProxyAgent(proxy);
    console.log(chalk.red(`⚠️ Format proxy tidak valid: ${proxy}`));
    return null;
  } catch (error) {
    console.log(chalk.red(`⚠️ Error saat membuat agent proxy: ${error.message}`));
    return null;
  }
};

// Fungsi Ping dengan Retry dan Exponential Backoff
const pingWallet = async (wallet) => {
  console.log(chalk.yellow(`\n🔔 Melakukan ping untuk wallet: ${wallet}`));

  const startWebSocket = async (retryCount = 0) => {
    // Check if max retries reached
    if (retryCount >= MAX_RETRIES) {
      console.log(chalk.red(`❌ Mencapai batas maksimum percobaan (${MAX_RETRIES}) untuk wallet: ${wallet}`));
      console.log(chalk.yellow('⚠️ Server mungkin sedang down atau tidak tersedia. Coba lagi nanti.'));
      return;
    }

    // Calculate connection options
    let wsOptions = { handshakeTimeout: 15000 }; // Increased timeout
    
    if (useProxy === 'y' && proxies.length > 0) {
      const agent = getRandomProxy();
      if (agent) wsOptions.agent = agent;
    }

    // Create WebSocket connection
    const ws = new WebSocket('wss://metamask-sdk.api.cx.metamask.io/socket.io/?EIO=4&transport=websocket', wsOptions);

    let isConnected = false;
    let connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        console.log(chalk.red('⏱️ Koneksi timeout setelah 15 detik'));
        ws.terminate();
      }
    }, 15000);

    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      isConnected = true;
      console.log(chalk.green('✅ Terhubung ke websocket!'));
      ws.send('40');
      setTimeout(() => {
        ws.send(`420["join_channel",{"channelId":"a75e1ea6-35c5-458b-973e-293f65620790","context":"dapp_connectToChannel","wallet":"${wallet}"}]`);
        console.log(chalk.cyan('🔗 Bergabung dengan channel...'));
      }, 1000);

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`42["ping",{"id":"a75e1ea6-35c5-458b-973e-293f65620790","clientType":"dapp","context":"on_channel_config","wallet":"${wallet}"}]`);
          console.log(chalk.blue(`📡 Ping dikirim untuk wallet: ${wallet}`));
        }
      }, 10000);

      ws.on('close', () => {
        clearInterval(pingInterval);
        console.log(chalk.red(`🔴 Koneksi websocket ditutup untuk wallet: ${wallet}`));
        
        const delay = calculateRetryDelay(retryCount);
        retryCount++;
        console.log(chalk.cyan(`🔄 Mencoba ulang dalam ${Math.round(delay/1000)} detik (Percobaan ke-${retryCount}/${MAX_RETRIES})...`));
        
        setTimeout(() => startWebSocket(retryCount), delay);
      });

      ws.on('message', (data) => {
        const message = data.toString();
        if (message.startsWith('0')) console.log(chalk.magenta('📩 Session dimulai'));
        else if (message.startsWith('40')) console.log(chalk.magenta('📩 Channel bergabung'));
        else if (message.startsWith('2')) console.log(chalk.magenta('📩 Ping diterima'));
        else if (message.includes('points')) {
          try {
            // Try to extract and display points information
            const jsonStart = message.indexOf('[');
            if (jsonStart >= 0) {
              const jsonData = JSON.parse(message.substring(jsonStart));
              if (jsonData[1] && jsonData[1].data && jsonData[1].data.points) {
                console.log(chalk.green(`🎉 Points updated: ${jsonData[1].data.points}`));
              }
            }
          } catch (e) {
            // Just log the raw message if parsing fails
            console.log(chalk.magenta(`📩 Pesan diterima: ${message}`));
          }
        }
      });
    });

    ws.on('error', (err) => {
      clearTimeout(connectionTimeout);
      
      // Handle specific error types
      if (err.message.includes('503')) {
        console.log(chalk.red(`❌ Error websocket: Server tidak tersedia (503). Server mungkin sedang maintenance.`));
      } else {
        console.log(chalk.red(`❌ Error websocket: ${err.message}`));
      }
      
      if (!isConnected) {
        const delay = calculateRetryDelay(retryCount);
        retryCount++;
        console.log(chalk.cyan(`🔄 Koneksi gagal, mencoba ulang dalam ${Math.round(delay/1000)} detik (Percobaan ke-${retryCount}/${MAX_RETRIES})...`));
        
        setTimeout(() => startWebSocket(retryCount), delay);
      }
      
      ws.terminate();
    });
  };

  startWebSocket();
};

console.log(chalk.green('\n🚀 Mulai Ping untuk Semua Wallet...'));
wallets.forEach(wallet => pingWallet(wallet));