const monobankService = require('./services/monobankService')

async function setupWebhook() {
  try {
    await monobankService.initialize()
    await monobankService.setupWebhook()
    console.log('Webhook set up successfully')
  } catch (error) {
    console.error('Failed to set up webhook', error)
  }
}

setupWebhook()
