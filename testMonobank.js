const axios = require('axios')
const config = require('./src/config/config')

async function testMonobankConnection() {
  try {
    console.log('Attempting to get user info...')
    const response = await axios.get(
      'https://api.monobank.ua/personal/client-info',
      {
        headers: {
          'X-Token': config.monobank.token,
        },
      }
    )
    console.log(
      'User info retrieved successfully:',
      JSON.stringify(response.data, null, 2)
    )
  } catch (error) {
    console.error('Error getting user info:')
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status)
      console.error('Data:', JSON.stringify(error.response.data, null, 2))
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2))
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Error details:', error.message)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error details:', error.message)
    }
  }
}

testMonobankConnection()
