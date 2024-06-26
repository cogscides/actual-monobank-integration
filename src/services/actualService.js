const api = require('@actual-app/api')
const config = require('../config/config')
const logger = require('../utils/logger')

class ActualService {
  async init() {
    try {
      await api.init({
        dataDir: config.actualFinance.dataDir,
        serverURL: config.actualFinance.serverURL,
        password: config.actualFinance.password,
      })

      await api.downloadBudget(config.actualFinance.budgetId, {
        password: config.actualFinance.budgetEncPwd || undefined,
      })
      logger.info('Actual Finance API initialized')
    } catch (error) {
      logger.error('Failed to initialize Actual Finance API', error)
      throw error
    }
  }

  async importTransactions(transactions, accountMapping) {
    try {
      const accounts = await api.getAccounts()
      logger.info(
        'Available Actual accounts:',
        accounts.map((acc) => ({ id: acc.id, name: acc.name }))
      )

      const accountNameToId = accounts.reduce((acc, account) => {
        acc[account.name] = account.id
        return acc
      }, {})

      const groupedTransactions = this.groupTransactionsByAccount(
        transactions,
        accountMapping,
        accountNameToId
      )

      for (const [actualAccountId, accountTransactions] of Object.entries(
        groupedTransactions
      )) {
        const account = accounts.find((acc) => acc.id === actualAccountId)
        if (!account) {
          logger.warn(`Actual account not found for ID: ${actualAccountId}`)
          continue
        }

        logger.info(
          `Importing ${accountTransactions.length} transactions for account: ${account.name}`
        )

        const formattedTransactions = accountTransactions.map(
          (transaction) => ({
            date: transaction.date,
            amount: api.utils.amountToInteger(transaction.amount),
            payee: transaction.payee,
            notes: transaction.notes,
            cleared: true,
            imported_id: transaction.imported_id,
          })
        )

        await api.addTransactions(actualAccountId, formattedTransactions)
        logger.info(
          `Imported ${formattedTransactions.length} transactions for account: ${account.name}`
        )
      }
    } catch (error) {
      logger.error('Failed to import transactions', error)
      throw error
    }
  }

  groupTransactionsByAccount(transactions, accountMapping, accountNameToId) {
    return transactions.reduce((acc, transaction) => {
      const actualAccountName = accountMapping[transaction.account]
      const actualAccountId = accountNameToId[actualAccountName]
      if (actualAccountId) {
        if (!acc[actualAccountId]) {
          acc[actualAccountId] = []
        }
        acc[actualAccountId].push(transaction)
      } else {
        logger.warn(
          `No Actual account mapping found for Monobank account: ${transaction.account}`
        )
      }
      return acc
    }, {})
  }

  async shutdown() {
    await api.shutdown()
    logger.info('Actual Finance API shut down')
  }
}

module.exports = new ActualService()
