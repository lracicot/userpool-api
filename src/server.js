import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import logger from './logger';
import * as UserController from './controllers/user';
import * as AppClientController from './controllers/appClient';

const app = express();
const PORT = process.env.PORT || 3000;

const errorHandler = (err) => {
  logger.error(err);
  logger.debug(err.stack);
};

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((err, req, res, next) => {
  errorHandler(err);
  next(err);
});

const asyncRoute = route => (req, res, next = errorHandler) => {
  Promise.resolve(route(req, res)).catch(next);
};

app.get('/healthcheck', (req, res) => res.json({ status: 'ok' }));
app.post('/user/login', asyncRoute(UserController.login));
app.put('/user', asyncRoute(UserController.create));
app.get('/user/:uuid', asyncRoute(UserController.details));
app.get('/users', asyncRoute(UserController.list));
app.post('/user/:uuid', asyncRoute(UserController.update));
app.delete('/user/:uuid', asyncRoute(UserController.remove));
app.put('/app', asyncRoute(AppClientController.create));
app.get('/app/:uuid', asyncRoute(AppClientController.details));
app.get('/apps', asyncRoute(AppClientController.list));
app.delete('/app/:uuid', asyncRoute(AppClientController.remove));


const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }, (err) => {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err); // eslint-disable-line no-console
      setTimeout(connectWithRetry, 5000);
    } else {
      // Start the API
      const server = app.listen(PORT, () => {
        logger.info(`Membership API is running on ${PORT}`);
      });
      server.timeout = 0;
    }
  });
};
connectWithRetry();
