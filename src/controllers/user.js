import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import logger from '../logger';
import User from '../models/user';
import AppClient from '../models/appClient';
import RefreshToken from '../models/refreshToken';
import { authenticate, generateRefreshToken } from '../security/authentication';

export async function list(req, res) {
  res.json({
    users: await User.find({}),
  });
}

export async function details(req, res) {
  res.json({
    user: await User.findOne({ uuid: req.params.uuid }),
  });
}

export async function create(req, res) {
  const salt = await bcrypt.genSalt(10);
  const user = await User.create({
    uuid: uuidv4(),
    ...req.body,
    emailVerified: false,
    passwordHash: await bcrypt.hash(req.body.password, salt),
  });
  return res.status(201).send({ user });
}

export async function update(req, res) {
  const { uuid } = req.body;
  delete req.body.uuid;

  const user = User.findOne({ uuid });

  if (!user) {
    return res.status(404).send();
  }

  await User.update({
    ...req.body,
    apps: await Promise.all(req.body.apps.map(
      appUuid => AppClient.findOne({ uuid: appUuid }).then(app => app.id),
    )),
  });

  return res.status(200).json({
    uuid,
    emailVerified: user.emailVerified,
    roles: user.roles,
    ...req.body,
  });
}

export async function remove(req, res) {
  const user = await User.findOne({ uuid: req.params.uuid });

  if (!user) {
    return res.status(404).send();
  }

  await User.deleteOne({ uuid: req.params.uuid });
  // await User.remove({ });
  return res.status(200).json(user);
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.username }).populate('apps');
  const app = await AppClient.findOne({ uuid: req.query.appId });
  const clientIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

  if (!user) {
    return res.status(403).send();
  }

  if (user.apps.map(a => a.uuid).indexOf(req.query.appId) < 0) {
    return res.status(403).send();
  }

  try {
    const {
      idToken,
      accessToken,
    } = await authenticate(app, user, req.body.password);

    const refreshToken = generateRefreshToken(app, user, clientIp);
    await RefreshToken.create(refreshToken);

    return res.json({ idToken, accessToken, refreshToken: refreshToken.token });
  } catch (err) {
    logger.error(err);
    return res.status(403).send();
  }
}
