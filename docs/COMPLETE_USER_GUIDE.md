# Multi-Bot eBay Scraper Management System
## Complete User Guide

---

## 🎯 Quick Answer: Web Interface vs Command Line

**You do NOT need to use the command line!** 

✅ **Normal Users**: Use the web interface at `http://localhost:3000` to create and manage bots
❌ **Command Line**: Only for advanced users and debugging

The web dashboard provides everything you need:
- Create bots with a simple form
- Monitor all bots in real-time
- Download data exports
- Start/stop/remove bots with buttons

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Creating Your First Bot](#creating-your-first-bot)
4. [Bot Management](#bot-management)
5. [Data Management](#data-management)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## 🔍 System Overview

### What This System Does
The Multi-Bot eBay Scraper Management System lets you:
- **Monitor multiple eBay searches** simultaneously
- **Get Telegram notifications** when new items are found
- **Manage everything through a web browser** - no command line needed
- **Keep data separate** for each bot
- **Download data** for analysis

### How It Works
1. **You create bots** through the web interface
2. **Each bot monitors** a specific eBay search URL
3. **When new items appear**, the bot sends you a Telegram message
4. **All data is saved** in separate files for each bot
5. **You can download** the data for analysis

### Key Features
- 🌐 **Web-based interface** - everything in your browser
- 🤖 **Multiple bots** - run as many as you want
- 📱 **Telegram integration** - get notifications on your phone
- 📊 **Real-time monitoring** - see what's happening live
- 💾 **Data isolation** - each bot has its own data
- 📈 **Statistics** - track performance and finds

---

## 🚀 Prerequisites & Setup

### What You Need
1. **Computer** with Node.js installed
2. **Internet connection** for scraping eBay
3. **Telegram account** for notifications
4. **Web browser** (Chrome, Firefox, Safari, Edge)

### Step 1: Install the System

```bash
# Install main dependencies
npm install

# Install web interface dependencies
cd client
npm install
cd ..
```

### Step 2: Start the System

**Terminal 1 - Start the server:**
```bash
npm run server
```
This starts the backend on port 4000

**Terminal 2 - Start the web interface:**
```bash
cd client
npm run dev
```
This starts the web interface on port 3000

### Step 3: Open Your Browser

Navigate to: `http://localhost:3000`

You should see the "Bot Management Dashboard"

---

## 🎯 Creating Your First Bot

### Before You Start: Set Up Telegram

**Each bot needs its own Telegram configuration:**

#### Step 1: Create a Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send: `/newbot`
3. Choose a name: "My eBay iPhone Scraper"
4. Choose a username: "myebayiphone_bot"
5. **Save the bot token**: `1234567890:AAHWrewbsMzl4L9r_T5IdFOeQUQZm0RPhbE`

#### Step 2: Get Your Chat ID
1. Search for `@userinfobot` on Telegram
2. Send any message
3. **Save your chat ID**: `7180625231`

#### Step 3: Activate Your Bot
1. Search for your bot's username
2. Send: `/start`
3. Ready to use!

### Create Your Bot (Web Interface)

**In the web dashboard, you'll see a "Create New Bot" form:**

#### Required Information
- **Bot Name**: Descriptive name (e.g., "iPhone 14 Scraper")
- **eBay Search URL**: Your search URL from eBay
- **Telegram Bot Token**: From @BotFather
- **Telegram Chat ID**: From @userinfobot

#### Optional Information
- **Description**: What this bot searches for

### Step-by-Step Bot Creation

#### 1. Get Your eBay Search URL
1. Go to eBay.com
2. Search for items (e.g., "iPhone 14")
3. Apply filters (price, condition, etc.)
4. Copy the URL from your browser

**Example URLs:**
```
https://www.ebay.com/sch/i.html?_nkw=iPhone+14&_udhi=800
https://www.ebay.com/sch/i.html?_nkw=Nintendo+Switch&_sacat=0&_udhi=300
```

#### 2. Fill Out the Form
```
Bot Name: iPhone 14 Scraper
eBay Search URL: https://www.ebay.com/sch/i.html?_nkw=iPhone+14&_udhi=800
Description: Monitoring iPhone 14 listings under $800
Telegram Bot Token: 1234567890:AAHWrewbsMzl4L9r_T5IdFOeQUQZm0RPhbE
Telegram Chat ID: 7180625231
```

#### 3. Create the Bot
1. Click "Create Bot"
2. See success message
3. Bot appears in the list below
4. Status changes to "running"

#### 4. Verify It's Working
1. Check bot status is "running"
2. Wait a few minutes
3. Check Telegram for notifications
4. See "Recent Activity" in bot list

---

## 🛠️ Bot Management

### Bot Dashboard Overview

Each bot shows:

#### 📊 Bot Information
- **Name & Status**: What you named it and current state
- **ID**: Unique identifier
- **Created**: When you created it
- **URL**: eBay search being monitored
- **Telegram Info**: Bot token (partial) and chat ID

#### ⏰ Runtime Information
- **Started**: When last started
- **Stopped**: When last stopped
- **Last Activity**: Most recent activity

#### 📈 Statistics
- **Items Found**: New items discovered
- **Requests**: HTTP requests made
- **Errors**: Problems encountered

#### 📝 Recent Activity
- Last 3 log entries
- Timestamps and messages
- Errors shown in red

### Bot Actions

#### ⏹️ Stopping a Bot
1. Find the running bot
2. Click "Stop Bot"
3. Bot shuts down gracefully
4. Status changes to "stopped"

#### ❌ Removing a Bot
1. Ensure bot is stopped
2. Click "Remove Bot"
3. Confirm in popup
4. Bot and data deleted permanently

#### 📥 Downloading Bot Data
1. Click "Download Data"
2. Gets JSON file with bot's data
3. File format: `botname_labelstudio_date.json`
4. Compatible with Label Studio for ML

---

## 💾 Data Management

### How Data Storage Works

**Each bot gets its own isolated data directory:**

```
📁 data/
├── 📁 bots/
│   ├── 📁 bot_1234567890_abc123def/
│   │   ├── 📄 data.json           # Items found
│   │   ├── 📄 ml_data.json        # ML training data
│   │   └── 📄 notifications.json  # Notification history
│   └── 📁 bot_1234567890_xyz789ghi/
│       ├── 📄 data.json           # Items found
│       ├── 📄 ml_data.json        # ML training data
│       └── 📄 notifications.json  # Notification history
```

### What Each File Contains

#### 📄 data.json - Item Tracking
```json
{
  "https://www.ebay.com/itm/123456": "tracked",
  "https://www.ebay.com/itm/789012": "tracked"
}
```

#### 📄 ml_data.json - ML Training Data
```json
[
  {
    "id": "123456",
    "title": "iPhone 14 Pro 128GB",
    "price": "$899.99",
    "url": "https://www.ebay.com/itm/123456",
    "condition": "New",
    "seller": "apple_store",
    "foundAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### 📄 notifications.json - Telegram History
```json
[
  {
    "message": "New iPhone 14 found for $899.99",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
]
```

### Data Benefits

✅ **Isolation**: Each bot's data is completely separate
✅ **No Conflicts**: Multiple bots don't interfere
✅ **Individual Analysis**: Analyze each bot separately
✅ **Separate Exports**: Export data per bot
✅ **Independent Stats**: Each bot tracks its own metrics

---

## 🔧 Advanced Features

### Real-Time Updates

The dashboard provides live updates:

- **🔴/🟢 Connection Status**: Shows WebSocket connection
- **📊 Live Statistics**: Counters update in real-time
- **📝 Real-Time Logs**: See activity as it happens
- **⚡ Instant Status**: Bot changes happen immediately

### API Access (For Developers)

The system exposes REST APIs:

#### Bot Management
```http
GET /api/bots              # List all bots
POST /api/bots             # Create new bot
GET /api/bots/:id          # Get bot details
POST /api/bots/:id/stop    # Stop bot
DELETE /api/bots/:id       # Remove bot
```

#### Data Access
```http
GET /api/bots/:id/data                    # Get bot data
GET /api/bots/:id/data?type=mlData        # ML data only
GET /api/bots/:id/export-labelstudio     # Export for ML
```

### Command Line (Advanced Users Only)

**⚠️ Most users should use the web interface instead!**

For advanced users who need direct access:

```bash
# Run with bot-specific data
node scraper-only.js "https://ebay.com/search" --bot-token <token> --chat-id <id> --bot-id <bot_id>

# Run with global data (legacy)
node scraper-only.js "https://ebay.com/search" --bot-token <token> --chat-id <id>
```

---

## 🔧 Troubleshooting

### Common Issues

#### 🚫 Bot Won't Start
**Symptoms**: Status stuck on "starting" or shows "error"

**Solutions**:
1. ✅ Check bot token format: `1234567890:AAHWrewbsMzl4L9r_T5IdFOeQUQZm0RPhbE`
2. ✅ Verify chat ID is just numbers: `7180625231`
3. ✅ Test eBay URL in browser first
4. ✅ Ensure Telegram bot is active

#### 📱 No Telegram Notifications
**Symptoms**: Bot running but no messages

**Solutions**:
1. ✅ Send `/start` to your bot on Telegram
2. ✅ Double-check bot token and chat ID
3. ✅ Verify bot can send messages
4. ✅ Check if bot is actually finding new items

#### 🌐 Web Interface Won't Load
**Symptoms**: Dashboard doesn't open

**Solutions**:
1. ✅ Ensure backend running: `npm run server`
2. ✅ Ensure frontend running: `npm run dev`
3. ✅ Check ports 3000 and 4000 are free
4. ✅ Try different browser

#### 🔴 Connection Issues
**Symptoms**: Red connection indicator

**Solutions**:
1. ✅ Refresh the page
2. ✅ Check backend server is running
3. ✅ Verify no firewall blocking
4. ✅ Try different browser/incognito mode

### Getting Help

#### 📊 Check Bot Logs
- Look at "Recent Activity" in bot list
- Check timestamps for issues
- Red messages indicate errors

#### 🖥️ Check Server Logs
- Look at terminal where server is running
- Check for error messages
- API logs show communication issues

#### 🔍 Check Browser Console
- Press F12 to open developer tools
- Look in Console tab for errors
- Network tab shows API problems

---

## 🎓 Best Practices

### 🎯 Bot Configuration
- **Use descriptive names**: "iPhone 14 Under $800" vs "Bot1"
- **Be specific**: Target exact items to reduce noise
- **Set reasonable filters**: Use price limits appropriately
- **Monitor performance**: Check stats regularly

### 💾 Data Management
- **Export regularly**: Download data for backup
- **Clean up old bots**: Remove unused ones
- **Monitor disk space**: Data accumulates over time
- **Review statistics**: Watch for errors

### 🔐 Security
- **Keep tokens private**: Don't share publicly
- **Use unique bots**: Don't reuse tokens
- **Monitor access**: Check for unexpected activity
- **Regular maintenance**: Restart system periodically

### ⚡ Performance
- **Start small**: Begin with 2-3 bots
- **Monitor resources**: Check CPU/memory usage
- **Stagger creation**: Don't create many bots at once
- **Regular restarts**: Keep system fresh

---

## 📚 Quick Reference

### Creating a Bot Checklist
- [ ] Have Telegram bot token
- [ ] Have chat ID  
- [ ] Have eBay search URL
- [ ] Web interface is running
- [ ] Fill out form completely
- [ ] Click "Create Bot"
- [ ] Verify status shows "running"
- [ ] Test Telegram notifications

### Managing Bots
- **Stop**: Click "Stop Bot" button
- **Remove**: Click "Remove Bot" (bot must be stopped)
- **Download**: Click "Download Data" button
- **Monitor**: Check statistics and recent activity

### Getting Data
- **Individual bot**: Use "Download Data" button
- **All bots**: Use API endpoint `/api/bots/all-data`
- **Specific data**: Use API with type parameter

---

## 🎉 Conclusion

**You now have everything you need to use the Multi-Bot eBay Scraper Management System!**

### Key Points to Remember:
1. **🌐 Use the web interface** - no command line needed
2. **📱 Each bot needs Telegram setup** - bot token and chat ID
3. **🔄 Real-time monitoring** - see everything live
4. **💾 Data is isolated** - each bot has its own files
5. **📊 Easy exports** - download data anytime

### Getting Started:
1. Set up your first Telegram bot
2. Get your eBay search URL
3. Create your first bot in the web interface
4. Monitor and manage through the dashboard

**Happy scraping!** 🤖💰📱

---

*System created by Carson Chang | 2025*
