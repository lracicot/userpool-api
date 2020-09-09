import User from '../models/user';
import UserPool from '../models/userPool';
import AppClient from '../models/appClient';
import RefreshToken from '../models/refreshToken';
import {
  authenticate,
  generateRefreshToken,
  generateAccessToken,
  generateIdToken,
  verifyPasswordToken,
  generatePasswordToken,
  encryptPassword,
} from '../authentication';
import sendMail from '../mailer';

export async function login(req, res) {
  const { clientIp } = req;
  const app = await AppClient.findOne({ uuid: req.query.appId });
  const user = await UserPool.findOne({ uuid: req.userPool.uuid })
    .populate('users')
    .then(userPool => userPool.users.find(
      u => u.email === req.body.username,
    ));

  if (!user || !app) {
    return res.status(403).send();
  }

  try {
    const {
      idToken,
      accessToken,
    } = await authenticate(app, req.userPool, user, req.body.password);

    // Invalidate past refresh tokens if any
    await RefreshToken.find({ user, revoked: null }).then(tokens => tokens.map((token) => {
      token.revoked = Date.now(); // eslint-disable-line no-param-reassign
      token.revokedByIp = clientIp; // eslint-disable-line no-param-reassign
      return token.save();
    })).then(promises => Promise.all(promises));

    const refreshToken = generateRefreshToken(app, user, clientIp);
    await RefreshToken.create(refreshToken);

    return res.json({ idToken, accessToken, refreshToken: refreshToken.token });
  } catch (err) {
    return res.status(403).send();
  }
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email });
  const app = await AppClient.findOne({ uuid: req.userPool.apps.find(a => a.isRoot).uuid });

  if (user && app) {
    const resetPasswordToken = generatePasswordToken(app, req.userPool, user);
    user.resetPasswordToken = resetPasswordToken;
    user.save();

    sendMail(req.body.email, 'Reset password', app.resetEmail
      .replace(/\{\{url\}\}/g, app.url)
      .replace(/\{\{token\}\}/g, Buffer.from(resetPasswordToken).toString('base64')));

    return res.status(200).send();
  }
  return res.status(403).send();
}

export async function resetPassword(req, res) {
  const resetPasswordToken = Buffer.from(req.params.resetPasswordToken, 'base64').toString('ascii');
  const user = await User.findOne({ resetPasswordToken });
  const app = await AppClient.findOne({ uuid: req.userPool.apps.find(a => a.isRoot).uuid });

  if (user && app && verifyPasswordToken(app, req.userPool, resetPasswordToken)) {
    user.passwordHash = (await encryptPassword(req.body)).passwordHash;
    user.resetPasswordToken = '';
    await user.save();

    return res.status(200).send();
  }
  return res.status(403).send();
}

export async function updateProfile(req, res) {
  const user = await User.findOne({ uuid: req.jws.user_uuid });

  user.profile = req.body;
  await user.save();

  return res.json(user);
}

export async function refresh(req, res) {
  const { clientIp } = req;

  const refreshToken = await RefreshToken.findOne({ token: req.body.refreshToken }).populate(['app', 'user']);

  if (
    refreshToken
      && refreshToken.isActive
      && !refreshToken.isExpired
  ) {
    const { app, user } = refreshToken;
    const newRefreshToken = generateRefreshToken(app, user, clientIp);

    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = clientIp;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await RefreshToken.create(newRefreshToken);

    const accessToken = generateAccessToken(app, req.userPool, user);
    const idToken = generateIdToken(app, req.userPool, user);

    return res.status(200).json({ idToken, accessToken, refreshToken: newRefreshToken.token });
  }
  return res.status(403).send();
}
