# Multi-Bot eBay Scraper Management System - User Manual

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation & Setup](#installation--setup)
4. [Getting Started](#getting-started)
5. [Creating Your First Bot](#creating-your-first-bot)
6. [Managing Bots](#managing-bots)
7. [Understanding Bot Data](#understanding-bot-data)
8. [Telegram Integration](#telegram-integration)
9. [Data Export & Analysis](#data-export--analysis)
10. [Command Line Usage](#command-line-usage)
11. [Troubleshooting](#troubleshooting)
12. [Advanced Features](#advanced-features)

---

## 🔍 Overview

The Multi-Bot eBay Scraper Management System allows you to run multiple independent eBay scrapers simultaneously. Each bot can monitor different eBay searches, send notifications to different Telegram chats, and maintain separate data collections.

### Key Features:
- **Multiple Independent Bots**: Run several scrapers simultaneously
- **Individual Data Isolation**: Each bot maintains its own data files
- **Real-time Web Interface**: Modern React-based dashboard
- **Telegram Notifications**: Get instant alerts for new findings
- **Data Export**: Export findings in various formats
- **Live Statistics**: Monitor bot performance in real-time

---

## 💻 System Requirements

- **Node.js**: Version 18 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: At least 4GB RAM recommended
- **Storage**: 1GB free space for data files
- **Network**: Stable internet connection

---

## 🚀 Installation & Setup

### 1. Download the System
```bash
# If you received this as a ZIP file, extract it
# If from Git, clone the repository
git clone <repository-url>
cd magnolia
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Start the System
```bash
# Start the management interface
npm run server
```

The system will start on:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000 (if running client separately)

---

## 🎯 Getting Started

### 1. Open the Web Interface
Navigate to `http://localhost:4000` in your web browser. You'll see the Bot Management Dashboard.

### 2. Check Connection Status
Look for the connection indicator in the top-right corner:
- 🟢 **Connected**: System is ready
- 🔴 **Disconnected**: Check if the server is running

### 3. Understand the Interface
- **Top Section**: Create new bots
- **Bottom Section**: Manage existing bots
- **Status Messages**: Success/error notifications

---

## 🤖 Creating Your First Bot

### Step 1: Prepare Your Telegram Bot
1. **Create a Telegram Bot**:
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow prompts to create your bot
   - Copy the **Bot Token** (e.g., `1234567890:AAHWrewbsMzl4L9r_T5IdFOeQUQZm0RPhbE`)

2. **Get Your Chat ID**:
   - Search for `@userinfobot` on Telegram
   - Send any message to get your **Chat ID** (e.g., `7180625231`)

### Step 2: Find Your eBay Search URL
1. Go to eBay.com
2. Search for items you want to monitor
3. Apply filters (price range, condition, etc.)
4. Copy the URL from your browser

**Example URL**:
```
https://www.ebay.com/sch/i.html?_nkw=nintendo+switch&_sacat=0&_udhi=200&_sop=10
```

### Step 3: Create the Bot
1. In the web interface, fill out the form:
   - **Bot Name**: A descriptive name (e.g., "Nintendo Switch Under $200")
   - **eBay Search URL**: Your copied URL
   - **Description**: Optional details about what this bot monitors
   - **Telegram Bot Token**: Your bot token from BotFather
   - **Telegram Chat ID**: Your chat ID from userinfobot

2. Click **"Create Bot"**

### Step 4: Verify Bot Creation
- You should see a success message
- Your bot appears in the bots list below
- Status should show as "starting" then "running"
- Check Telegram for a test message

---

## 📊 Managing Bots

### Bot Status Indicators
- **🟢 Running**: Bot is actively scraping
- **🔴 Stopped**: Bot is not running
- **🔵 Starting**: Bot is initializing
- **🔴 Error**: Bot encountered an issue

### Bot Actions

#### Stop a Bot
1. Find your running bot in the list
2. Click the **"Stop Bot"** button
3. Bot will safely shut down

#### Remove a Bot
1. Ensure the bot is stopped
2. Click the **"Remove Bot"** button
3. Confirm deletion in the popup
4. Bot and its data will be permanently deleted

#### Download Bot Data
1. Click the **"Download Data"** button on any bot
2. A JSON file will download with the bot's findings
3. Use this data for analysis or Label Studio training

### Bot Information Display
Each bot shows:
- **Basic Info**: Name, URL, creation date
- **Runtime Info**: Start/stop times, last activity
- **Statistics**: Items found, requests made, errors
- **Recent Activity**: Latest log entries

---

## 📁 Understanding Bot Data

### Data Structure
Each bot maintains three separate data files:

1. **`data.json`**: Tracking file (prevents duplicate notifications)
2. **`ml_data.json`**: Rich data for machine learning
3. **`notifications.json`**: Log of all notifications sent

### Data Location
```
data/
├── bots/
│   ├── bot_1672531200000_abc123def/
│   │   ├── data.json
│   │   ├── ml_data.json
│   │   └── notifications.json
│   └── bot_1672531200001_xyz789ghi/
│       ├── data.json
│       ├── ml_data.json
│       └── notifications.json
```

### Data Isolation Benefits
- **No Interference**: Bots don't affect each other's data
- **Individual Analysis**: Analyze each bot's performance separately
- **Targeted Exports**: Export specific bot data
- **Independent Statistics**: Each bot tracks its own metrics

---

## 💬 Telegram Integration

### Notification Format
When a bot finds a new item, you'll receive:
```
https://www.ebay.com/itm/123456789
Nintendo Switch Console - Excellent Condition
$185.00 + Free shipping
```

### Telegram Commands
- Send any message to your bot to test connectivity
- Your bot will respond to confirm it's working

### Managing Multiple Bots
- Each bot can use a different Telegram bot token
- Send notifications to different chats
- Organize by topic or price range

---

## 📈 Data Export & Analysis

### Export Options
1. **Label Studio Format**: Machine learning ready
2. **Raw JSON**: Full data access
3. **CSV**: Spreadsheet analysis (future feature)

### Label Studio Integration
The exported data includes:
- **Item Details**: Title, price, condition, seller
- **Images**: URLs to item photos
- **Metadata**: Discovery time, bot information
- **Annotations**: Ready for ML training

### Analysis Tips
- Track price trends over time
- Identify best-performing search terms
- Monitor seller patterns
- Analyze item conditions and pricing

---

## 🖥️ Command Line Usage

### Running Individual Bots
```bash
# With bot-specific data isolation
node scraper-only.js "https://ebay.com/search-url" --bot-token <token> --chat-id <id> --bot-id <bot_id>

# Legacy mode (uses shared data files)
node scraper-only.js "https://ebay.com/search-url" --bot-token <token> --chat-id <id>
```

### Starting the Management Server
```bash
# Start web interface server
npm run server

# Start both server and client development
npm run dev
```

### Server-Only Mode
```bash
# Start backend API only
node interface-server.js
```

---

## 🔧 Troubleshooting

### Common Issues

#### Bot Won't Start
**Symptoms**: Bot status shows "error" or doesn't start
**Solutions**:
1. Verify Telegram bot token is correct
2. Check chat ID format (should be numbers only)
3. Ensure eBay URL is accessible
4. Check server logs for specific errors

#### No Telegram Notifications
**Symptoms**: Bot is running but no messages received
**Solutions**:
1. Test bot token with @BotFather
2. Verify chat ID is correct
3. Check if bot is blocked in Telegram
4. Ensure bot has permission to send messages

#### Memory Issues
**Symptoms**: System crashes or becomes slow
**Solutions**:
1. Reduce number of concurrent bots
2. Increase system memory allocation
3. Clear old data files
4. Restart the system

#### Connection Problems
**Symptoms**: "Disconnected" status in web interface
**Solutions**:
1. Refresh the browser page
2. Check if server is running
3. Verify port 4000 is available
4. Check firewall settings

### Log Files
- **Browser Console**: Open Developer Tools → Console
- **Server Logs**: Check terminal where server is running
- **Bot Logs**: Available in web interface for each bot

---

## 🚀 Advanced Features

### API Endpoints
Access bot data programmatically:

```bash
# Get all bots
GET http://localhost:4000/api/bots

# Get specific bot data
GET http://localhost:4000/api/bots/{botId}/data

# Export bot data
GET http://localhost:4000/api/bots/{botId}/export-labelstudio
```

### WebSocket Integration
Real-time updates via WebSocket connection:
- Bot status changes
- New item discoveries
- Log updates
- Error notifications

### Custom Data Processing
Modify `src/scraper/index.js` to:
- Add custom data extraction
- Implement different notification formats
- Add new data storage options
- Integrate with other services

### Configuration Files
- **`package.json`**: Dependencies and scripts
- **`client/tailwind.config.js`**: UI styling
- **`client/vite.config.js`**: Frontend build settings

---

## 📞 Support & Resources

### File Structure
```
magnolia/
├── client/                 # Frontend React app
├── src/
│   ├── scraper/           # Scraping logic
│   ├── server/            # Backend API
│   └── shared/            # Shared utilities
├── data/                  # Bot data files
├── package.json           # Dependencies
└── README.md             # Basic info
```

### Best Practices
1. **Naming**: Use descriptive bot names
2. **URLs**: Test eBay URLs before creating bots
3. **Monitoring**: Check bot status regularly
4. **Data**: Export data regularly for backup
5. **Resources**: Don't run too many bots simultaneously

### Getting Help
1. Check this manual first
2. Review error messages carefully
3. Check browser console for frontend issues
4. Examine server logs for backend problems
5. Test with simple configurations first

---

## 📝 Quick Reference

### Essential Commands
```bash
# Start system
npm run server

# Create bot via CLI
node scraper-only.js "url" --bot-token <token> --chat-id <id>

# Access web interface
http://localhost:4000
```

### Key Files
- **Main Config**: `package.json`
- **Bot Data**: `data/bots/{bot-id}/`
- **Logs**: Browser console & terminal
- **Manual**: This file

### Common URLs
- **Web Interface**: http://localhost:4000
- **API Base**: http://localhost:4000/api
- **WebSocket**: ws://localhost:4000

---

*This manual covers the Multi-Bot eBay Scraper Management System. For technical issues or feature requests, refer to the system documentation or contact the developer.*

**Version**: 2.0  
**Last Updated**: July 2025  
**Created by**: Carson Chang
