import {Logger} from "winston";

const winston = require('winston');

export const logger: Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.cli(),
  transports: [
    new winston.transports.Console(),
  ]
});
