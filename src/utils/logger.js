const winston = require('winston')
const { format } = winston
const util = require('util')
require('winston-daily-rotate-file')

// Function to safely stringify objects
const safeStringify = (obj) => {
  return util.inspect(obj, { depth: null, colors: false })
}

// Custom format for console and file output
const customFormat = format.printf(
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
    format.splat(),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: format.combine(format.colorize(), customFormat),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new winston.transports.DailyRotateFile({
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
})

module.exports = logger
