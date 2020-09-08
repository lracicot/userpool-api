import { JWT, JWK } from 'jose';
import UserPool from '../models/userPool';
import AppClient from '../models/appClient';

const decodeToken = (app, token) => JWT.verify(token, JWK.asKey(app.key), {
  audience: app.uuid,
  issuer: 'https://promo.polymtl.ca',
  clockTolerance: '1 min',
});

const authorize = (app, authorization, role = null) => {
  if (!authorization) {
    throw new Error('Unauthorized');
  }

  const token = authorization.replace('Bearer ', '');
  const jws = decodeToken(app, token);

  if (role && !jws.roles.find(r => r.name === role)) {
    throw new Error('Unauthorized');
  }

  return jws;
};

export function authorizeUser() {
  return [
    async (req, res, next) => {
      const app = await AppClient.findOne({ uuid: req.query.appId });

      try {
        req.jws = authorize(app, req.headers.authorization);
        return next();
      } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    },
  ];
}

export function authorizeAdmin(role = null) {
  return [
    async (req, res, next) => {
      const app = await UserPool.findOne({ isRoot: true })
        .then(userPool => userPool.apps.find(a => a.isRoot));

      try {
        req.jws = authorize(app, req.headers.authorization, role);
        return next();
      } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    },
  ];
}
