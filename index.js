const WebSocket = require('ws');
const axios = require('axios');
const chalk = require('chalk');
const CFonts = require('cfonts');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const readlineSync = require('readline-sync');

// Display Banner
CFonts.say('Gradient Network', {
  font: 'block',
  align: 'center',
  colors: ['cyan', 'magenta'],
});
console.log(chalk.cyan('🚀 Gradient Network Airdrop Bot - Coded by @balveerxyz 🔥\n'));

// Read Wallets
let wallets;
try {
  wallets = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
  if (!Array.isArray(wallets) || wallets.length === 0) throw new Error();
} catch (err) {
  console.log(chalk.red('❌ Failed to read accounts.json or no wallets found!'));
  console.log(chalk.yellow('ℹ️ Please add your wallet addresses to accounts.json in this format:'));
  console.log(chalk.yellow('[\n  "0xWalletAddress1",\n  "0xWalletAddress2"\n]'));
  process.exit(1);
}

// Prompt for Proxy
const useProxy = readlineSync.question('Do you want to use proxies? (y/n): ').toLowerCase();
let proxies = [];
if (useProxy === 'y') {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').map(p => p.trim()).filter(Boolean);
    if (proxies.length === 0) throw new Error();
  } catch (err) {
    console.log(chalk.red('❌ Failed to read proxy.txt or no proxies found!'));
    console.log(chalk.yellow('ℹ️ Continuing without proxies...'));
  }
}

// Get Random Proxy
const getRandomProxy = () => {
  if (proxies.length === 0) return null;
  
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) return new HttpsProxyAgent(proxy);
  if (proxy.startsWith('socks5://')) return new SocksProxyAgent(proxy);
  console.log(chalk.red(`⚠️ Invalid proxy format: ${proxy}`));
  return null;
};

// Format wallet address for display (privacy)
const formatWallet = (wallet) => {
  if (wallet.length < 10) return wallet;
  return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
};

// Gradient Network Airdrop Process
const processAirdrop = async (wallet, index) => {
  console.log(chalk.yellow(`\n[${index + 1}/${wallets.length}] 🔔 Processing airdrop for wallet: ${formatWallet(wallet)}`));
  
  // Setup axios with proxy if needed
  const axiosConfig = {};
  if (useProxy === 'y') {
    const proxyAgent = getRandomProxy();
    if (proxyAgent) {
      axiosConfig.httpsAgent = proxyAgent;
      console.log(chalk.blue('🔒 Using proxy for API requests'));
    }
  }

  try {
    // Step 1: Register wallet with Gradient Network
    console.log(chalk.blue('🔄 Registering wallet with Gradient Network...'));
    const registerResponse = await axios.post('https://api.gradient.network/v1/register', {
      wallet_address: wallet
    }, axiosConfig);
    
    if (registerResponse.data.success) {
      console.log(chalk.green('✅ Wallet registered successfully!'));
      
      // Step 2: Connect to Gradient Network WebSocket
      console.log(chalk.blue('🔄 Connecting to Gradient Network WebSocket...'));
      connectToWebSocket(wallet, axiosConfig.httpsAgent);
      
      // Step 3: Claim airdrop tokens
      console.log(chalk.blue('🔄 Claiming airdrop tokens...'));
      const claimResponse = await axios.post('https://api.gradient.network/v1/claim', {
        wallet_address: wallet
      }, axiosConfig);
      
      if (claimResponse.data.success) {
        console.log(chalk.green('✅ Airdrop tokens claimed successfully!'));
        console.log(chalk.green(`💰 Tokens received: ${claimResponse.data.amount || 'Unknown amount'}`));
      } else {
        console.log(chalk.red(`❌ Failed to claim airdrop tokens: ${claimResponse.data.message || 'Unknown error'}`));
      }
    } else {
      console.log(chalk.red(`❌ Failed to register wallet: ${registerResponse.data.message || 'Unknown error'}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error processing airdrop: ${error.message}`));
    if (error.response) {
      console.log(chalk.red(`📝 Server response: ${JSON.stringify(error.response.data)}`));
    }
  }
  
  // Add delay between wallets to avoid rate limiting
  const delay = Math.floor(Math.random() * 5000) + 3000; // 3-8 seconds
  console.log(chalk.blue(`⏳ Waiting ${delay/1000} seconds before processing next wallet...`));
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Connect to Gradient Network WebSocket
const connectToWebSocket = (wallet, proxyAgent = null) => {
  const wsOptions = proxyAgent ? { agent: proxyAgent, handshakeTimeout: 10000 } : {};
  const ws = new WebSocket('wss://ws.gradient.network/socket', wsOptions);
  
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  
  ws.on('open', () => {
    console.log(chalk.green('✅ Connected to Gradient Network WebSocket!'));
    
    // Send authentication message
    const authMessage = JSON.stringify({
      type: 'auth',
      wallet: wallet
    });
    ws.send(authMessage);
    
    // Setup ping interval
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        console.log(chalk.blue(`📡 Ping sent for wallet: ${formatWallet(wallet)}`));
      }
    }, 30000); // Every 30 seconds
    
    ws.on('close', () => {
      clearInterval(pingInterval);
      console.log(chalk.red(`🔴 WebSocket connection closed for wallet: ${formatWallet(wallet)}`));
      
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = reconnectAttempts * 2000; // Exponential backoff
        console.log(chalk.yellow(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${delay/1000} seconds...`));
        setTimeout(() => connectToWebSocket(wallet, proxyAgent), delay);
      } else {
        console.log(chalk.red(`❌ Maximum reconnect attempts reached for wallet: ${formatWallet(wallet)}`));
      }
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(chalk.magenta(`📩 Received message: ${message.type || 'Unknown type'}`));
        
        if (message.type === 'auth_success') {
          console.log(chalk.green('✅ Authentication successful!'));
        } else if (message.type === 'airdrop_eligible') {
          console.log(chalk.green('🎉 Wallet is eligible for airdrop!'));
        } else if (message.type === 'airdrop_claimed') {
          console.log(chalk.green(`🎁 Airdrop claimed! Amount: ${message.amount || 'Unknown'}`));
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Could not parse message: ${error.message}`));
      }
    });
  });
  
  ws.on('error', (error) => {
    console.log(chalk.red(`❌ WebSocket error: ${error.message}`));
    ws.terminate();
  });
};

// Process all wallets
const processAllWallets = async () => {
  console.log(chalk.green(`\n🚀 Starting Gradient Network Airdrop process for ${wallets.length} wallets...\n`));
  
  for (let i = 0; i < wallets.length; i++) {
    await processAirdrop(wallets[i], i);
  }
  
  console.log(chalk.green('\n✅ All wallets processed!'));
  console.log(chalk.cyan('Thank you for using Gradient Network Airdrop Bot!'));
};

// Start the process
processAllWallets();