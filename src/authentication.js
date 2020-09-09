import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { JWT, JWK } from 'jose';

export const generateAccessToken = (app, pool, user) => {
  const key = JWK.asKey(app.key);
  return JWT.sign({
    username: user.uuid,
    email_verified: user.emailVerified,
  }, key, {
    issuer: pool.uuid,
    expiresIn: '60 minutes',
    audience: [app.uuid],
    header: {
      typ: 'JWT',
    },
  });
};

export const generatePasswordToken = (app, pool, user) => {
  const key = JWK.asKey(app.key);
  return JWT.sign({
    username: user.uuid,
  }, key, {
    issuer: pool.uuid,
    expiresIn: '24 hours',
    audience: [app.uuid],
    header: {
      typ: 'JWT',
    },
  });
};

export const generateIdToken = (app, pool, user) => {
  const key = JWK.asKey(app.key);
  return JWT.sign({
    user_uuid: user.uuid,
    roles: user.roles,
    email: user.email,
    appId: [app.uuid],
    email_verified: user.emailVerified,
    profile: user.profile,
  }, key, {
    issuer: pool.uuid,
    expiresIn: '60 minutes',
    audience: [app.uuid],
    header: {
      typ: 'JWT',
    },
  });
};

export const verifyPasswordToken = (app, pool, token) => {
  const key = JWK.asKey(app.key);

  try {
    JWT.verify(token, key, {
      audience: app.uuid,
      issuer: pool.uuid,
      clockTolerance: '1 min',
    });

    return true;
  } catch (err) {
    return false;
  }
};

export const generateRefreshToken = (app, user, createdByIp) => ({
  user: user.id,
  app: app.id,
  token: crypto.randomBytes(40).toString('hex'),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
  createdByIp,
});

export const authenticate = async (app, pool, user, password) => {
  if (!await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('invalid password');
  }

  return {
    idToken: generateIdToken(app, pool, user),
    accessToken: generateAccessToken(app, pool, user),
  };
};

export const encryptPassword = async user => ({
  ...user,
  passwordHash: user.password
    ? await bcrypt.hash(user.password, await bcrypt.genSalt(10))
    : user.passwordHash || null,
});

export const generatePrivateKeyPair = () => JWK.generate('RSA', 2048).then(keys => keys.toJWK(true));
