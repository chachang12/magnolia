# Bot Data Management System

## Overview
Each bot now has its own isolated data files to prevent interference between different scraper bots.

## Data Structure

### Global Files (legacy support)
- `data/data.json` - Legacy tracking file
- `data/ml_data.json` - Legacy ML training data  
- `data/notifications.json` - Legacy notifications

### Bot-Specific Files
Each bot creates its own data directory:
```
data/
├── bots/
│   ├── bot_[timestamp]_[randomid]/
│   │   ├── data.json           # Bot's item tracking
│   │   ├── ml_data.json        # Bot's ML training data
│   │   └── notifications.json  # Bot's notifications
│   └── bot_[timestamp]_[randomid]/
│       ├── data.json
│       ├── ml_data.json
│       └── notifications.json
```

## API Endpoints

### Bot-Specific Data Access
- `GET /api/bots/:botId/data` - Get all bot data
- `GET /api/bots/:botId/data?type=data` - Get tracking data only
- `GET /api/bots/:botId/data?type=mlData` - Get ML data only
- `GET /api/bots/:botId/data?type=notifications` - Get notifications only

### Data Export
- `GET /api/bots/:botId/export-labelstudio` - Export bot's ML data in Label Studio format

### All Bots Data
- `GET /api/bots/all-data` - Get all bots with their data

## Frontend Features

### BotList Component
- Each bot shows its own statistics
- Download button for bot-specific data
- Individual bot data management

## Command Line Usage

### Running Individual Bots
```bash
# With bot-specific data isolation
node scraper-only.js "https://ebay.com/search" --bot-token <token> --chat-id <id> --bot-id <bot_id>

# Legacy mode (uses global data files)
node scraper-only.js "https://ebay.com/search" --bot-token <token> --chat-id <id>
```

## Benefits

1. **Data Isolation**: Each bot maintains its own data
2. **No Interference**: Multiple bots don't overwrite each other's data
3. **Individual Analysis**: Can analyze each bot's performance separately
4. **Separate Exports**: Export data per bot for targeted analysis
5. **Independent Statistics**: Each bot tracks its own metrics

## Migration Notes

- Existing global data files remain for backward compatibility
- New bots automatically get isolated data directories
- Legacy scrapers continue to work with global files
- Bot manager automatically creates and manages bot-specific directories
