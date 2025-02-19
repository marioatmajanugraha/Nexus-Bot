const WebSocket = require('ws');
const chalk = require('chalk');
const CFonts = require('cfonts');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');
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
  process.exit(1);
}

// Prompt Proxy
const useProxy = readlineSync.question('Mau menggunakan proxy? (y/n): ').toLowerCase();
let proxies = [];
if (useProxy === 'y') {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').map(p => p.trim()).filter(Boolean);
    if (proxies.length === 0) throw new Error();
  } catch (err) {
    console.log(chalk.red('❌ Gagal membaca proxy.txt atau proxy kosong!'));
    process.exit(1);
  }
}

// Fungsi Ambil Proxy Acak
const getRandomProxy = () => {
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) return new HttpsProxyAgent(proxy);
  if (proxy.startsWith('socks5://')) return new SocksProxyAgent(proxy);
  console.log(chalk.red(`⚠️ Format proxy tidak valid: ${proxy}`));
  return null;
};

// Fungsi Ping dengan Retry
const pingWallet = async (wallet) => {
  console.log(chalk.yellow(`\n🔔 Melakukan ping untuk wallet: ${wallet}`));

  const startWebSocket = async () => {
    const wsOptions = useProxy === 'y' ? { agent: getRandomProxy() } : {};
    const ws = new WebSocket('wss://metamask-sdk.api.cx.metamask.io/socket.io/?EIO=4&transport=websocket', wsOptions);

    ws.on('open', () => {
      console.log(chalk.green('✅ Terhubung ke websocket!'));

      // Kirim Handshake
      ws.send('40');

      // Gabung Channel
      setTimeout(() => {
        ws.send(`420["join_channel",{"channelId":"a75e1ea6-35c5-458b-973e-293f65620790","context":"dapp_connectToChannel","wallet":"${wallet}"}]`);
        console.log(chalk.cyan('🔗 Bergabung dengan channel...'));
      }, 1000);

      // Kirim Ping Setiap 10 Detik
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`42["ping",{"id":"a75e1ea6-35c5-458b-973e-293f65620790","clientType":"dapp","context":"on_channel_config","wallet":"${wallet}"}]`);
          console.log(chalk.blue(`📡 Ping dikirim untuk wallet: ${wallet}`));
        }
      }, 10000);

      // Handle Close
      ws.on('close', () => {
        clearInterval(pingInterval);
        console.log(chalk.red(`🔴 Koneksi websocket ditutup untuk wallet: ${wallet}`));

        // Coba ulang dengan proxy baru jika menggunakan proxy
        if (useProxy === 'y') {
          console.log(chalk.cyan('🔄 Mencoba ulang dengan proxy baru...'));
          startWebSocket();
        }
      });

      // Handle Message
      ws.on('message', (data) => {
        const message = data.toString();
        if (message.startsWith('0')) console.log(chalk.magenta('📩 Session dimulai'));
        else if (message.startsWith('40')) console.log(chalk.magenta('📩 Channel bergabung'));
        else if (message.startsWith('2')) console.log(chalk.magenta('📩 Ping diterima'));
        // Pesan lainnya diabaikan
      });

      // Handle Error
      ws.on('error', (err) => {
        console.log(chalk.red(`❌ Error websocket: ${err.message}`));
        ws.close();
      });
    });
  };

  startWebSocket();
};

// Jalankan Ping untuk Semua Wallet
console.log(chalk.green('\n🚀 Mulai Ping untuk Semua Wallet...'));
wallets.forEach(wallet => pingWallet(wallet));
