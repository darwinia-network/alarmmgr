import pino from "pino";

export const logger: pino.BaseLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      crlf: false,
    }
  }
});
