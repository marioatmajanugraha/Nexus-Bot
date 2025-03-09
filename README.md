# Nexus Bot - MetaMask SDK Ping Tool

A Node.js application for pinging the MetaMask SDK API to maintain wallet connections.

## Features

- Automatically pings MetaMask SDK API for multiple wallet addresses
- Supports HTTP, HTTPS, and SOCKS5 proxies
- Intelligent proxy rotation and fallback mechanisms
- Detailed logging and error handling

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/nexus-bot.git
   cd nexus-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

### Wallet Addresses

Edit the `accounts.json` file to include your wallet addresses:

```json
[
    "0x1234567890123456789012345678901234567890",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
]
```

### Proxy Configuration (Recommended)

For best results, use proxies from webshare.io or another reliable proxy provider.

Edit the `proxy.txt` file to include your proxies, one per line, in the following formats:

```
# With authentication
http://username:password@host:port
https://username:password@host:port
socks5://username:password@host:port

# Without authentication
http://host:port
https://host:port
socks5://host:port
```

## Usage

Run the application:

```
node index.js
```

The application will ask if you want to use proxies. For best results and to avoid errors, it's recommended to use proxies.

## Troubleshooting

### Common Errors

1. **Connection Errors**:
   - If you see frequent connection errors, try using different proxies
   - Ensure your proxy format is correct
   - Try running without proxies to see if the issue persists

2. **Empty Proxy File**:
   - If your proxy.txt file is empty, the application will warn you
   - You can continue without proxies or add valid proxies to the file

3. **Invalid Wallet Addresses**:
   - Ensure your wallet addresses in accounts.json are valid Ethereum addresses
   - Each address should be a string in the array

### Best Practices

- Use high-quality proxies from webshare.io for best results
- Rotate proxies regularly to avoid rate limiting
- Keep the application running to maintain consistent pings

## License

ISC License






