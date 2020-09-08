import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { JWT, JWK } from 'jose';

export const generateAccessToken = (app, user) => {
  const key = JWK.asKey(app.key);
  return JWT.sign({
    username: user.uuid,
    email_verified: user.emailVerified,
  }, key, {
    issuer: 'https://promo.polymtl.ca',
    expiresIn: '60 minutes',
    audience: [app.uuid],
    header: {
      typ: 'JWT',
    },
  });
};

export const generatePasswordToken = (app, user) => {
  const key = JWK.asKey(app.key);
  return JWT.sign({
    username: user.uuid,
  }, key, {
    issuer: 'https://promo.polymtl.ca',
    expiresIn: '24 hours',
    audience: [app.uuid],
    header: {
      typ: 'JWT',
    },
  });
};

export const generateIdToken = (app, user) => {
  const key = JWK.asKey(app.key);
  return JWT.sign({
    user_uuid: user.uuid,
    roles: user.roles,
    email: user.email,
    appId: [app.uuid],
    email_verified: user.emailVerified,
    profile: user.profile,
  }, key, {
    issuer: 'https://promo.polymtl.ca',
    expiresIn: '60 minutes',
    audience: [app.uuid],
    header: {
      typ: 'JWT',
    },
  });
};

export const verifyPasswordToken = (app, token) => {
  const key = JWK.asKey(app.key);

  try {
    JWT.verify(token, key, {
      audience: app.uuid,
      issuer: 'https://promo.polymtl.ca',
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

export const authenticate = async (app, user, password) => {
  if (!await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('invalid password');
  }

  return {
    idToken: generateIdToken(app, user),
    accessToken: generateAccessToken(app, user),
  };
};

export const encryptPassword = async user => ({
  ...user,
  passwordHash: user.password
    ? await bcrypt.hash(user.password, await bcrypt.genSalt(10))
    : user.passwordHash || null,
});

export const generatePrivateKeyPair = () => JWK.generate('RSA', 2048).then(keys => keys.toJWK(true));
