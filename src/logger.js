import { createLogger, format, transports } from 'winston';

const {
  combine, timestamp, cli,
} = format;

export default createLogger({
  format: combine(
    timestamp(),
    cli(),
  ),
  transports: [
    new transports.Console(),
  ],
});
