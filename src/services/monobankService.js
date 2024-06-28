const axios = require('axios')
const config = require('../config/config')
const logger = require('../utils/logger')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class MonobankService {
  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.monobank.ua',
      headers: {
        'X-Token': config.monobank.token,
      },
    })
    this.accounts = []
    this.accountLastDigitsToId = {}
  }

  async initialize() {
    try {
      const response = await this.api.get('/personal/client-info')
      if (!response.data || !Array.isArray(response.data.accounts)) {
        throw new Error('Unexpected response format from Monobank API')
      }
      this.accounts = response.data.accounts
      this.accountLastDigitsToId = this.accounts.reduce((acc, account) => {
        const lastDigits =
          account.maskedPan[account.maskedPan.length - 1].slice(-4)
        acc[lastDigits] = account.id
        return acc
      }, {})
      logger.info(
        'Monobank accounts:',
        this.accounts.map((acc) => ({
          id: acc.id,
          name: acc.maskedPan[acc.maskedPan.length - 1],
          lastDigits: acc.maskedPan[acc.maskedPan.length - 1].slice(-4),
        }))
      )
    } catch (error) {
      logger.error(
        'Failed to initialize Monobank service',
        this.formatError(error)
      )
      throw error
    }
  }

  async getTransactionsForAllAccounts(from, to) {
    const allTransactions = []
    for (const account of this.accounts) {
      const lastDigits =
        account.maskedPan[account.maskedPan.length - 1].slice(-4)
      if (config.syncAllAccounts || config.monoToActualMappings[lastDigits]) {
        try {
          const transactions = await this.getTransactions(account.id, from, to)
          allTransactions.push(...transactions)
          // Add a 5-second delay between requests to different accounts
          await delay(5000)
        } catch (error) {
          logger.error(
            `Failed to get transactions for account ${account.id}`,
            this.formatError(error)
          )
          // If we hit the rate limit, wait for 60 seconds before trying the next account
          if (error.response && error.response.status === 429) {
            logger.info(
              'Rate limit hit. Waiting for 60 seconds before next request.'
            )
            await delay(60000)
          }
        }
      } else {
        logger.info(
          `Skipping account ${lastDigits} as it's not specified in the mappings`
        )
      }
    }
    return allTransactions
  }

  async getTransactions(accountId, from, to) {
    const transactions = []
    let currentFrom = new Date(from)
    const endDate = new Date(to)

    while (currentFrom < endDate) {
      let currentTo = new Date(currentFrom.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days later
      if (currentTo > endDate) {
        currentTo = endDate
      }

      try {
        const fromTimestamp = Math.floor(currentFrom.getTime() / 1000)
        const toTimestamp = Math.floor(currentTo.getTime() / 1000)

        logger.info(
          `Fetching transactions for account ${accountId} from ${currentFrom.toISOString()} to ${currentTo.toISOString()}`
        )

        const response = await this.api.get(
          `/personal/statement/${accountId}/${fromTimestamp}/${toTimestamp}`
        )

        if (Array.isArray(response.data)) {
          logger.info(
            `Retrieved ${response.data.length} transactions for this period`
          )
          transactions.push(
            ...response.data.map((transaction) =>
              this.formatTransaction(transaction, accountId)
            )
          )
        } else {
          logger.warn('Unexpected response format', response.data)
        }

        // Move to the next period
        currentFrom = new Date(currentTo.getTime() + 1000) // Add 1 second to avoid overlap

        // Add a delay to avoid rate limiting
        await delay(5000)
      } catch (error) {
        if (error.response && error.response.status === 429) {
          logger.warn('Rate limit hit. Retrying after 60 seconds.')
          await delay(60000)
          continue
        }
        throw error
      }
    }

    return transactions
  }

  formatTransaction(transaction, accountId) {
    const account = this.accounts.find((acc) => acc.id === accountId)
    const lastDigits = account
      ? account.maskedPan[account.maskedPan.length - 1].slice(-4)
      : 'unknown'

    let notes = `${transaction.description}`

    if (transaction.mcc) {
      notes += ` _${transaction.mcc}`
    }
    if (
      transaction.originalMcc &&
      transaction.originalMcc !== transaction.mcc
    ) {
      notes += `->${transaction.originalMcc}`
    }
    if (transaction.counterName) {
      notes += ` | Counter: ${transaction.counterName}`
    }
    // if (transaction.comment) {
    //   notes += ` | Comment: ${transaction.comment}`
    // }
    if (transaction.counterIban) {
      notes += ` | IBAN: ${transaction.counterIban}`
    }
    // if (transaction.receiptId) {
    //   notes += ` | Receipt ID: ${transaction.receiptId}`
    // }
    // if (transaction.cashbackAmount) {
    //   notes += ` | Cashback: ${transaction.cashbackAmount / 100}`
    // }

    return {
      id: transaction.id,
      date: new Date(transaction.time * 1000),
      amount: transaction.amount / 100,
      payee: transaction.description,
      notes: notes,
      imported_id: transaction.id,
      account: lastDigits,
    }
  }

  formatError(error) {
    return {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            params: error.config.params,
          }
        : undefined,
    }
  }

  async setupWebhook() {
    try {
      const response = await this.api.post('/personal/webhook', {
        webHookUrl: config.webhookUrl,
      })
      logger.info('Webhook set up successfully')
    } catch (error) {
      logger.error('Failed to set up webhook', this.formatError(error))
      throw error
    }
  }
}

module.exports = new MonobankService()
