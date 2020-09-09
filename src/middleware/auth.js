import { JWT, JWK } from 'jose';
import UserPool from '../models/userPool';
import AppClient from '../models/appClient';

const decodeToken = (app, pool, token) => JWT.verify(token, JWK.asKey(app.key), {
  audience: app.uuid,
  issuer: pool.uuid,
  clockTolerance: '1 min',
});

const authorize = (app, pool, authorization, role = null) => {
  if (!authorization) {
    throw new Error('Unauthorized');
  }

  const token = authorization.replace('Bearer ', '');
  const jws = decodeToken(app, pool, token);

  if (role && !jws.roles.find(r => r.name === role)) {
    throw new Error('Unauthorized');
  }

  return jws;
};

export function authorizeUser() {
  return [
    async (req, res, next) => {
      const app = await AppClient.findOne({ uuid: req.query.appId });
      const pool = await UserPool.findOne({ apps: app.id });

      try {
        req.jws = authorize(app, pool, req.headers.authorization);
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
      const pool = await UserPool.findOne({ isRoot: true });
      const app = pool.apps.find(a => a.isRoot);

      try {
        req.jws = authorize(app, pool, req.headers.authorization, role);
        return next();
      } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    },
  ];
}
