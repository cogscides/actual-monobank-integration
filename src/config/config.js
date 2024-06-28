require('dotenv').config()

const monoToActualMappings = Object.entries(process.env)
  .filter(([key]) => key.startsWith('MONO_TO_ACTUAL_MAPPING_'))
  .reduce((acc, [key, value]) => {
    const monoAccountLastDigits = key.replace('MONO_TO_ACTUAL_MAPPING_', '')
    acc[monoAccountLastDigits] = value
    return acc
  }, {})

module.exports = {
  actualFinance: {
    dataDir: process.env.ACTUAL_DATA_DIR,
    serverURL: process.env.ACTUAL_SERVER_URL,
    password: process.env.ACTUAL_PASSWORD,
    budgetId: process.env.ACTUAL_BUDGET_SYNC_ID,
    budgetEncPwd: process.env.ACTUAL_BUDGET_ENCRYPTED_PASSWORD,
  },
  monobank: {
    token: process.env.MONOBANK_TOKEN,
  },
  syncInterval: parseInt(process.env.SYNC_INTERVAL) || 3600000, // 1 hour in milliseconds
  monoToActualMappings,
  syncAllAccounts: process.env.MONO_TO_ACTUAL_FOR_ALL === 'true',
  syncStartDate: process.env.SYNC_START_DATE
    ? new Date(process.env.SYNC_START_DATE)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
  webhookUrl: process.env.WEBHOOK_URL,
  webhookPort: process.env.WEBHOOK_PORT || 3000,
}
