import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import logger from './logger';
import * as AdminUserController from './controllers/user.admin';
import * as UserPoolController from './controllers/userPool.admin';
import * as UserController from './controllers/user';
import * as AppController from './controllers/app.admin';
import { authorizeUser, authorizeAdmin as auth } from './middleware/auth';
import fetchUserPool from './middleware/userPool';

const app = express();
const PORT = process.env.PORT || 3000;

const errorHandler = (err) => {
  logger.error(err);
  logger.debug(err.stack);
};

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  req.clientIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
  next();
});

const asyncRoute = route => (req, res, next = errorHandler) => {
  Promise.resolve(route(req, res)).catch(next);
};

// App management
app.get('/healthcheck', (req, res) => res.json({ status: 'ok' }));
app.post('/start', asyncRoute(UserPoolController.start));

// User endpoints
app.post('/user/:uuid/login', fetchUserPool, asyncRoute(UserController.login));
app.post('/user/:uuid/refresh', fetchUserPool, asyncRoute(UserController.refresh));
app.post('/user/:uuid/forgotPassword', fetchUserPool, asyncRoute(UserController.forgotPassword));
app.post('/user/:uuid/reset/:resetPasswordToken', fetchUserPool, asyncRoute(UserController.resetPassword));
app.post('/user/updateProfile', authorizeUser(), asyncRoute(UserController.updateProfile));

// Admin user endpoints
app.put('/pool/:uuid/addUser', auth('ROLE_ADMIN'), fetchUserPool, asyncRoute(AdminUserController.create));
app.get('/user/:uuid', auth('ROLE_ADMIN'), asyncRoute(AdminUserController.details));
app.post('/user/changePassword/:uuid', auth('ROLE_ADMIN'), asyncRoute(AdminUserController.resetUserPassword));
app.post('/user/:uuid', auth('ROLE_ADMIN'), asyncRoute(AdminUserController.update));
app.delete('/user/:uuid', auth('ROLE_ADMIN'), asyncRoute(AdminUserController.remove));

// Admin app endpoints
app.put('/pool/:uuid/addApp', auth('ROLE_ADMIN'), fetchUserPool, asyncRoute(AppController.create));
app.get('/app/:uuid/exportKeys', auth('ROLE_ADMIN'), asyncRoute(AppController.exportKeys));
app.get('/app/:uuid', auth('ROLE_ADMIN'), asyncRoute(AppController.details));
app.delete('/app/:uuid', auth('ROLE_ADMIN'), asyncRoute(AppController.remove));
app.post('/app/:uuid', auth('ROLE_ADMIN'), asyncRoute(AppController.update));

// Admin user pool endpoints
app.get('/pools', auth('ROLE_ADMIN'), asyncRoute(UserPoolController.list));
app.put('/pool', auth('ROLE_ADMIN'), asyncRoute(UserPoolController.create));
app.get('/pool/:uuid/users', auth('ROLE_ADMIN'), fetchUserPool, asyncRoute(UserPoolController.listUsers));
app.get('/pool/:uuid/apps', auth('ROLE_ADMIN'), fetchUserPool, asyncRoute(UserPoolController.listApps));
app.delete('/pool/:uuid', auth('ROLE_ADMIN'), fetchUserPool, asyncRoute(UserPoolController.remove));

app.use((err, req, res, next) => {
  errorHandler(err);
  next(err);
});


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
