import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { JWT, JWK } from 'jose';

function generateAccessToken(user, key) {
  return JWT.sign({
    username: user.uuid,
    email_verified: user.emailVerified,
  }, key, {
    issuer: 'https://promo.polymtl.ca',
    expiresIn: '15 minutes',
    header: {
      typ: 'JWT',
    },
  });
}

function generateIdToken(user, key) {
  return JWT.sign({
    user_uuid: user.uuid,
    roles: user.roles,
    email: user.email,
    email_verified: user.emailVerified,
  }, key, {
    issuer: 'https://promo.polymtl.ca',
    expiresIn: '30 minutes',
    header: {
      typ: 'JWT',
    },
  });
}

export function generateRefreshToken(app, user, createdByIp) {
  return {
    user: user.id,
    app: app.id,
    token: crypto.randomBytes(40).toString('hex'),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    createdByIp,
  };
}

export async function authenticate(app, user, password) {
  const key = JWK.asKey(app.key.n, {
    kid: app.key.kid,
    use: 'sig',
  });
  if (!await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('invalid password');
  }

  return {
    idToken: generateIdToken(user, key),
    accessToken: generateAccessToken(user, key),
  };
}

export async function refreshToken(token, ipAddress) {
  // const refreshToken = await getRefreshToken(token);
  // const { user } = refreshToken;
  //
  // // replace old refresh token with a new one and save
  // const newRefreshToken = generateRefreshToken(user, ipAddress);
  // refreshToken.revoked = Date.now();
  // refreshToken.revokedByIp = ipAddress;
  // refreshToken.replacedByToken = newRefreshToken.token;
  // await refreshToken.save();
  // await newRefreshToken.save();
  //
  // // generate new jwt
  // const jwtToken = generateJwtToken(user);
  //
  // // return basic details and tokens
  // return {
  //     ...basicDetails(user),
  //     jwtToken,
  //     refreshToken: newRefreshToken.token
  // };
}

// async function refreshToken({ token, ipAddress }) {
//     const refreshToken = await getRefreshToken(token);
//     const { user } = refreshToken;
//
//     // replace old refresh token with a new one and save
//     const newRefreshToken = generateRefreshToken(user, ipAddress);
//     refreshToken.revoked = Date.now();
//     refreshToken.revokedByIp = ipAddress;
//     refreshToken.replacedByToken = newRefreshToken.token;
//     await refreshToken.save();
//     await newRefreshToken.save();
//
//     // generate new jwt
//     const jwtToken = generateJwtToken(user);
//
//     // return basic details and tokens
//     return {
//         ...basicDetails(user),
//         jwtToken,
//         refreshToken: newRefreshToken.token
//     };
// }

// async function revokeToken({ token, ipAddress }) {
//     const refreshToken = await getRefreshToken(token);
//
//     // revoke token and save
//     refreshToken.revoked = Date.now();
//     refreshToken.revokedByIp = ipAddress;
//     await refreshToken.save();
// }
