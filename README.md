# 🚀 **Gradient Network Airdrop Bot** 🔥

An automated bot designed to interact with Gradient Network for airdrop participation. This script handles wallet registration, WebSocket connections, and airdrop token claiming with an attractive interactive display.

## 📌 Key Features  
- 🔄 **Automatic Wallet Registration** with Gradient Network.
- 🌐 **WebSocket Connection** for real-time updates.
- 🎁 **Airdrop Token Claiming** for each wallet.
- ♻️ **Automatic Reconnection** up to 3 times if WebSocket connection is lost.
- 🔌 **Proxy Support**:  
  - `http://`, `https://` using **HttpsProxyAgent**.  
  - `socks5://` using **SocksProxyAgent**.  
- 🔑 **Wallet Privacy** with shortened display format (`0x1234...5678`).
- 🎨 **Attractive Display** with color-coded status messages.

## 🔧 Installation

1. **Clone repository:**
```sh
git clone https://github.com/marioatmajanugraha/Nexus-Bot.git
cd Nexus-Bot
```

2. **Install dependencies:**
```sh
npm install
```

3. **Prepare configuration files:**

   - **accounts.json**: Contains list of wallet addresses in array format
   ```json
   [
     "0xYourWalletAddress1",
     "0xYourWalletAddress2"
   ]
   ```

   - **proxy.txt** (optional): Contains list of proxies in the format
   ```
   http://username:password@proxyhost:port
   https://username:password@proxyhost:port
   socks5://proxyhost:port
   ```

## 🚀 **Usage**

**Run the script:**
```sh
node index.js
```

Follow the prompts:
1. Choose whether to use proxies (y/n).
2. The script will automatically process each wallet:
   - Register the wallet with Gradient Network
   - Connect to WebSocket for real-time updates
   - Claim airdrop tokens
   - Wait a random delay before processing the next wallet

## 📌 Notes
- Ensure your `accounts.json` and `proxy.txt` (if using proxies) are properly formatted.
- The script includes random delays between wallet processing to avoid rate limiting.
- WebSocket connections will automatically attempt to reconnect up to 3 times if disconnected.
- Make sure you have the latest version of Node.js installed.

## 📜 License
MIT License. See LICENSE for more information.

## 📞 Contact
📧 Email: teamproject888official@gmail.com  
📲 Telegram: @balveerxyz

⭐ Donations  
If you find this script useful, consider supporting further development:  
ETH/USDT/BNB: 0x0098628619755e12Ed56E8b81A734b45339857De

## 🤝 **Contributions**
1. Fork this repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Create a Pull Request.

## ⚠️ **Disclaimer**
Use this script responsibly.
Not recommended for illegal activities or those that violate the Terms of Service of related platforms.

## 🎉 **Thank You!**
Gradient Network Airdrop Bot is developed with ❤️ by @balveerxyz.
Good luck with your Gradient Network Airdrop!






