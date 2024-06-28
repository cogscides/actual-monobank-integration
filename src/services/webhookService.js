const express = require('express')
const bodyParser = require('body-parser')
const actualService = require('./actualService')
const logger = require('../utils/logger')

class WebhookService {
  constructor() {
    this.app = express()
    this.app.use(bodyParser.json())
    this.setupRoutes()
  }

  setupRoutes() {
    this.app.post('/webhook', this.handleWebhook.bind(this))
  }

  async handleWebhook(req, res) {
    try {
      const { type, data } = req.body
      if (type === 'StatementItem') {
        const transaction = this.formatTransaction(data.statementItem)
        await actualService.importTransactions(
          [transaction],
          config.monoToActualMappings
        )
        logger.info('Webhook transaction processed successfully')
      }
      res.sendStatus(200)
    } catch (error) {
      logger.error('Error processing webhook', error)
      res.sendStatus(500)
    }
  }

  // monobankService.formatTransaction example:
  // formatTransaction(transaction, accountId) {
  //   const account = this.accounts.find((acc) => acc.id === accountId)
  //   const lastDigits = account
  //     ? account.maskedPan[account.maskedPan.length - 1].slice(-4)
  //     : 'unknown'
  //   let notes = `${transaction.description}`

  //   if (transaction.mcc) {
  //     notes += ` _${transaction.mcc}`
  //   }
  //   if (
  //     transaction.originalMcc &&
  //     transaction.originalMcc !== transaction.mcc
  //   ) {
  //     notes += `->${transaction.originalMcc}`
  //   }
  //     notes += ` | Counter: ${transaction.counterName}`
  //   }
  //   if (transaction.counterIban) {
  //     notes += ` | IBAN: ${transaction.counterIban}`
  //   }

  //   return {
  //     date: new Date(transaction.time * 1000),
  //     amount: transaction.amount / 100,
  //     payee: transaction.description,
  //     notes: notes,
  //     imported_id: transaction.id,
  //     account: lastDigits,
  //   }
  // }

  formatTransaction(statementItem) {
    // Format the transaction similar to monobankService.formatTransaction
    // You may need to adjust this based on the webhook payload structure
    // POST request body example: {type:"StatementItem", data:{account:"...", statementItem:{#StatementItem}}}
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
    if (transaction.counterIban) {
      notes += ` | IBAN: ${transaction.counterIban}`
    }

    return {
      date: new Date(transaction.time * 1000),
      amount: transaction.amount / 100,
      payee: transaction.description,
      notes: notes,
      imported_id: transaction.id,
      account: lastDigits,
    }
  }

  start(port) {
    this.app.listen(port, () => {
      logger.info(`Webhook server listening on port ${port}`)
    })
  }
}

module.exports = new WebhookService()
