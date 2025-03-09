const WebSocket = require('ws');
const chalk = require('chalk');
const CFonts = require('cfonts');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const readlineSync = require('readline-sync');

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
  if (!Array.isArray(wallets) || wallets.length === 0) throw new Error();
} catch (err) {
  console.log(chalk.red('❌ Gagal membaca accounts.json!'));
  console.log(chalk.yellow('ℹ️ Pastikan file accounts.json berisi array wallet address yang valid'));
  process.exit(1);
}

// Prompt Proxy
const useProxy = readlineSync.question('Mau menggunakan proxy? (y/n): ').toLowerCase();
let proxies = [];
let failedProxies = new Set(); // Track failed proxies

if (useProxy === 'y') {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').map(p => p.trim()).filter(Boolean);
    if (proxies.length === 0) {
      console.log(chalk.yellow('⚠️ File proxy.txt kosong atau tidak berisi proxy yang valid!'));
      console.log(chalk.yellow('ℹ️ Disarankan menggunakan proxy dari webshare untuk hasil terbaik'));
      
      // Ask if user wants to continue without proxies
      const continueWithoutProxy = readlineSync.question('Lanjutkan tanpa proxy? (y/n): ').toLowerCase();
      if (continueWithoutProxy !== 'y') {
        process.exit(1);
      }
    } else {
      console.log(chalk.green(`✅ Berhasil memuat ${proxies.length} proxy`));
    }
  } catch (err) {
    console.log(chalk.red('❌ Gagal membaca proxy.txt!'));
    console.log(chalk.yellow('ℹ️ Pastikan file proxy.txt ada dan berisi daftar proxy yang valid'));
    
    // Ask if user wants to continue without proxies
    const continueWithoutProxy = readlineSync.question('Lanjutkan tanpa proxy? (y/n): ').toLowerCase();
    if (continueWithoutProxy !== 'y') {
      process.exit(1);
    }
  }
}

// Fungsi Validasi Proxy
const isValidProxy = (proxy) => {
  return proxy.startsWith('http://') || proxy.startsWith('https://') || proxy.startsWith('socks5://');
};

// Fungsi Ambil Proxy Acak yang Belum Gagal
const getRandomProxy = () => {
  // Filter out failed proxies and invalid formats
  const availableProxies = proxies.filter(p => !failedProxies.has(p) && isValidProxy(p));
  
  if (availableProxies.length === 0) {
    // If all proxies have failed or are invalid, reset the failed proxies list and try again
    if (failedProxies.size > 0) {
      console.log(chalk.yellow('⚠️ Semua proxy telah dicoba dan gagal. Mereset daftar proxy...'));
      failedProxies.clear();
      return getRandomProxy();
    }
    
    // If no valid proxies at all, return null
    console.log(chalk.red('❌ Tidak ada proxy valid yang tersedia!'));
    return null;
  }
  
  const proxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
  
  try {
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) return new HttpsProxyAgent(proxy);
    if (proxy.startsWith('socks5://')) return new SocksProxyAgent(proxy);
  } catch (err) {
    console.log(chalk.red(`❌ Error membuat agent untuk proxy ${proxy}: ${err.message}`));
    failedProxies.add(proxy);
    return getRandomProxy(); // Try another proxy
  }
};

// Fungsi Ping dengan Retry dan Fallback
const pingWallet = async (wallet) => {
  console.log(chalk.yellow(`\n🔔 Melakukan ping untuk wallet: ${wallet}`));
  
  // Track consecutive failures for this wallet
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 5;
  
  // Track if we're currently using proxies or direct connection
  let currentlyUsingProxy = useProxy === 'y' && proxies.length > 0;

  const startWebSocket = async (retryCount = 0) => {
    let wsOptions = {};
    let proxyUsed = null;
    
    if (currentlyUsingProxy) {
      const proxyAgent = getRandomProxy();
      
      if (proxyAgent) {
        wsOptions = { 
          agent: proxyAgent, 
          handshakeTimeout: 15000 // Increased timeout for proxy connections
        };
        proxyUsed = proxies.find(p => proxyAgent.proxy.href.includes(p.replace('http://', '').replace('https://', '').replace('socks5://', '')));
        console.log(chalk.blue(`🔄 Menggunakan proxy: ${proxyUsed}`));
      } else {
        // If no valid proxy is available, switch to direct connection
        console.log(chalk.yellow('⚠️ Tidak bisa mendapatkan proxy valid, beralih ke koneksi langsung...'));
        currentlyUsingProxy = false;
      }
    } else {
      // When not using proxy, still set a reasonable timeout
      wsOptions = { handshakeTimeout: 10000 };
      console.log(chalk.blue('🔄 Menggunakan koneksi langsung (tanpa proxy)'));
    }

    const ws = new WebSocket('wss://metamask-sdk.api.cx.metamask.io/socket.io/?EIO=4&transport=websocket', wsOptions);

    let isConnected = false;
    let connectionTimer = setTimeout(() => {
      if (!isConnected) {
        console.log(chalk.red('⏱️ Koneksi timeout setelah 15 detik'));
        ws.terminate();
      }
    }, 15000);

    ws.on('open', () => {
      clearTimeout(connectionTimer);
      isConnected = true;
      consecutiveFailures = 0; // Reset failure counter on successful connection
      
      console.log(chalk.green('✅ Terhubung ke websocket!'));
      ws.send('40');
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`420["join_channel",{"channelId":"a75e1ea6-35c5-458b-973e-293f65620790","context":"dapp_connectToChannel","wallet":"${wallet}"}]`);
          console.log(chalk.cyan('🔗 Bergabung dengan channel...'));
        }
      }, 1000);

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`42["ping",{"id":"a75e1ea6-35c5-458b-973e-293f65620790","clientType":"dapp","context":"on_channel_config","wallet":"${wallet}"}]`);
          console.log(chalk.blue(`📡 Ping dikirim untuk wallet: ${wallet}`));
        } else {
          clearInterval(pingInterval);
        }
      }, 10000);

      ws.on('close', () => {
        clearInterval(pingInterval);
        console.log(chalk.red(`🔴 Koneksi websocket ditutup untuk wallet: ${wallet}`));
        
        // If we were connected for a while before closing, don't count as failure
        if (isConnected) {
          retryCount++;
          console.log(chalk.cyan(`🔄 Mencoba ulang (Percobaan ke-${retryCount})...`));
          setTimeout(() => startWebSocket(retryCount), 2000);
        }
      });

      ws.on('message', (data) => {
        const message = data.toString();
        if (message.startsWith('0')) console.log(chalk.magenta('📩 Session dimulai'));
        else if (message.startsWith('40')) console.log(chalk.magenta('📩 Channel bergabung'));
        else if (message.startsWith('2')) console.log(chalk.magenta('📩 Ping diterima'));
      });
    });

    ws.on('error', (err) => {
      clearTimeout(connectionTimer);
      console.log(chalk.red(`❌ Error websocket: ${err.message}`));
      
      if (!isConnected) {
        consecutiveFailures++;
        
        // If using a proxy and it failed, mark it as failed
        if (currentlyUsingProxy && proxyUsed) {
          console.log(chalk.red(`❌ Proxy gagal: ${proxyUsed}`));
          failedProxies.add(proxyUsed);
        }
        
        // If too many consecutive failures, try switching connection method
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          consecutiveFailures = 0;
          
          if (currentlyUsingProxy) {
            console.log(chalk.yellow('⚠️ Terlalu banyak kegagalan dengan proxy, beralih ke koneksi langsung...'));
            currentlyUsingProxy = false;
          } else if (useProxy === 'y' && proxies.length > 0) {
            console.log(chalk.yellow('⚠️ Terlalu banyak kegagalan dengan koneksi langsung, beralih ke proxy...'));
            currentlyUsingProxy = true;
            // Reset failed proxies to try them all again
            failedProxies.clear();
          }
        }
        
        retryCount++;
        const delay = Math.min(2000 + (retryCount * 500), 10000); // Increasing delay with max 10 seconds
        console.log(chalk.cyan(`🔄 Koneksi gagal, mencoba ulang dalam ${delay/1000} detik (Percobaan ke-${retryCount})...`));
        setTimeout(() => startWebSocket(retryCount), delay);
      }
      
      ws.terminate();
    });
  };

  startWebSocket();
};

console.log(chalk.green('\n🚀 Mulai Ping untuk Semua Wallet...'));
wallets.forEach(wallet => pingWallet(wallet));