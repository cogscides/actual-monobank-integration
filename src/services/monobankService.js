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
    try {
      const fromTimestamp = Math.floor(from.getTime() / 1000)
      const toTimestamp = Math.floor(to.getTime() / 1000)

      logger.info(
        `Fetching transactions for account ${accountId} from ${from.toISOString()} to ${to.toISOString()}`
      )
      logger.info(`Using timestamps: from=${fromTimestamp}, to=${toTimestamp}`)

      const response = await this.api.get(
        `/personal/statement/${accountId}/${fromTimestamp}/${toTimestamp}`
      )

      if (Array.isArray(response.data)) {
        logger.info(
          `Retrieved ${response.data.length} transactions for this period`
        )
        return response.data.map((transaction) =>
          this.formatTransaction(transaction, accountId)
        )
      } else {
        logger.warn('Unexpected response format', response.data)
        return []
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        logger.warn('Rate limit hit. Retrying after 60 seconds.')
        await delay(60000)
        return this.getTransactions(accountId, from, to)
      }
      throw error
    }
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
}

module.exports = new MonobankService()
