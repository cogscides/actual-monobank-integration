const winston = require('winston')
const { format } = winston
const util = require('util')

// Function to safely stringify objects
const safeStringify = (obj) => {
  return util.inspect(obj, { depth: null, colors: false })
}

// Custom format for console output
const consoleFormat = format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    if (Object.keys(metadata).length > 0) {
      msg += `\n${safeStringify(metadata)}`
    }
    return msg
  }
)

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat()
  ),
  transports: [
    new winston.transports.Console({
      format: format.combine(format.colorize(), consoleFormat),
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
})

module.exports = logger
