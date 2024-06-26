const config = require('./config/config')
const actualService = require('./services/actualService')
const monobankService = require('./services/monobankService')
const logger = require('./utils/logger')

async function syncTransactions() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    logger.info(
      `Syncing transactions from ${thirtyDaysAgo.toISOString()} to ${now.toISOString()}`
    )

    const transactions = await monobankService.getTransactionsForAllAccounts(
      thirtyDaysAgo,
      now
    )

    if (transactions.length > 0) {
      await actualService.importTransactions(
        transactions,
        config.monoToActualMappings
      )
    } else {
      logger.info('No transactions to import')
    }

    logger.info('Sync completed successfully')
  } catch (error) {
    logger.error('Sync failed', error)
  }
}

async function main() {
  try {
    await actualService.init()
    logger.info('Actual Finance API initialized')

    await monobankService.initialize()
    logger.info('Monobank service initialized')

    await syncTransactions()

    // Run sync periodically
    setInterval(syncTransactions, config.syncInterval)
  } catch (error) {
    logger.error('Application failed to start', error)
    // Don't exit the process, just log the error
  }
}

main().catch((error) => {
  logger.error('An unexpected error occurred', error)
  // Don't exit the process, just log the error
})

process.on('SIGINT', async () => {
  logger.info('Shutting down...')
  await actualService.shutdown()
  process.exit(0)
})
