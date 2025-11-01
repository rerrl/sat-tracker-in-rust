# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Setup

### install dependencies and start desktop development

```bash
yarn
yarn seed
yarn start:dev
```

**Common Issue:** The Tauri window may open blank initially while Vite finishes compiling. Simply right-click in the window and select "Reload" to refresh the page and the app will load properly. This is normal Tauri development behavior.

## Database Encryption Implementation Plan

### Current Status
The encryption feature is partially implemented but has issues. Here's how it should work:

### Architecture Overview
1. **Database Detection**: Check if database exists and if it's encrypted
2. **Password Prompt**: Show modal if password needed
3. **Database Initialization**: Initialize with or without password
4. **Encryption Management**: Allow encrypting unencrypted databases and changing passwords

### Implementation Steps

#### 1. Database Status Detection
- Use `rusqlite` to test database accessibility
- Try opening without password first
- If fails with "file is not a database" or similar, assume encrypted
- Return status: `{ is_encrypted: bool, needs_password: bool }`

#### 2. Password Validation
- For encrypted databases, test password by:
  - Opening connection with `rusqlite`
  - Setting `PRAGMA key = 'password'`
  - Attempting simple query like `SELECT COUNT(*) FROM sqlite_master`
  - Return validation result with error message if invalid

#### 3. Database Initialization
- **Unencrypted**: Use standard SQLx connection
- **Encrypted**: Use SQLx with `after_connect` hook to set `PRAGMA key`
- Run migrations after successful connection
- Store pool in Tauri state for app use

#### 4. Encryption Operations
- **Encrypt existing database**:
  1. Backup original database
  2. Create new encrypted database with password
  3. Copy all data from backup to encrypted version
  4. Replace original with encrypted version
  5. Clean up backup

- **Change password**:
  1. Open with current password
  2. Use `PRAGMA rekey = 'new_password'` to change
  3. Verify new password works

#### 5. Frontend Flow
1. App starts → Check database status
2. If needs password → Show password modal
3. User enters password → Validate and initialize
4. If successful → Hide modal and load app
5. If failed → Show error and retry

### Key Technical Details

#### SQLCipher Integration
- Add `sqlcipher` feature to `rusqlite` dependency
- Use `PRAGMA key` to set encryption password
- Use `PRAGMA rekey` to change passwords
- Handle SQLCipher-specific error messages

#### Error Handling
- Distinguish between "wrong password" and "database corrupt"
- Provide clear error messages to user
- Handle edge cases like database file permissions

### Files to Modify
- `src-tauri/Cargo.toml`: Add sqlcipher feature
- `src-tauri/src/commands/encryption.rs`: Fix implementation
- `src-tauri/src/database/mod.rs`: Handle encrypted connections
- `src/components/PasswordPromptModal.tsx`: Improve UX
- `src/App.tsx`: Fix initialization flow

- TODO: btc <-> sats in events/charts
- TODO: add ability to manually set the bitcoin price to see how the metrics change
- TODO: csv importing. (no duplicates - coinbase, river)

## Chart Ideas & Features

### FREE Charts (No External Data Required)
- **Interactive Sat Balance Chart Enhancements:**
  - Hover tooltips showing exact date, sat balance
  - Zoom and pan functionality for different time ranges
  - Highlight buy/sell events as dots on the line with different colors
  - Time range selectors (7D, 30D, 90D, 1Y, All)
  - Toggle between sat balance and event count views

- **Buy/Sell Activity Chart:**
  - Bar chart showing buy vs sell volume over time
  - Color-coded bars (green for buys, red for sells)
  - Shows trading frequency and patterns

- **Monthly Stacking Summary:**
  - Bar chart of sats accumulated per month
  - Shows consistency of stacking habits
  - Could include event count per month as secondary bars

- **Stacking Frequency Heatmap:**
  - Calendar-style heatmap showing buy frequency
  - Darker colors = more activity that day/week
  - Great for visualizing DCA consistency

- **Event Type Distribution:**
  - Pie chart showing percentage of buys vs sells vs fees
  - Bar chart of total sats by event type

### PREMIUM Charts (Requires External/Historical Price Data)
- **Dollar Cost Average Performance:**
  - Line showing your average buy price over time
  - Compare against Bitcoin's actual price at those times
  - Shows if you're buying the dips or peaks

- **Price vs Your Buys Scatter Plot:**
  - Each buy plotted as a dot (Bitcoin price vs date)
  - Shows if you tend to buy at high or low prices
  - Bitcoin price line in background

- **Profit/Loss Timeline:**
  - Shows unrealized gains/losses over time
  - Based on your average cost basis vs historical Bitcoin prices
  - Color-coded areas (green for profit, red for loss)

- **USD Value Chart:**
  - Toggle between sat balance and USD value views
  - Requires historical Bitcoin price data for accurate USD values at each point

- **Performance vs Bitcoin:**
  - Compare your portfolio growth vs just holding Bitcoin
  - Show if your DCA strategy outperformed lump sum buying

### android development (no focus on mobile, keeping this for future reference)

```bash
yarn tauri android init
yarn tauri android dev
```
