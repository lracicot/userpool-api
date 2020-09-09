import { v4 as uuidv4 } from 'uuid';
import sendMail from '../mailer';
import {
  generatePasswordToken,
  encryptPassword,
} from '../authentication';

import User from '../models/user';
import UserPool from '../models/userPool';


const excludeSaveAttributes = ({
  passwordHash, password, uuid, ...user
}) => user;

export const details = (req, res) => User.findOne({ uuid: req.params.uuid })
  .then(user => res.json(user));

export const remove = async (req, res) => {
  const user = await User.findOne({ uuid: req.params.uuid });

  if (!user) {
    return res.status(404).send();
  }

  if (user.roles.find(role => role.name === 'ROLE_ROOT')) {
    return res.status(400).send();
  }

  await User.deleteOne({ uuid: req.params.uuid });
  return res.status(200).json(user);
};

export async function create(req, res) {
  const { userPool } = req;

  if ((await UserPool.findOne({ uuid: userPool.uuid }).populate('users').then(p => p.users)).find(
    user => user.email === req.body.email,
  )) {
    return res.status(400).json('User already exist in this user pool');
  }

  const user = await User.create({
    ...excludeSaveAttributes(req.body),
    uuid: uuidv4(),
  });

  userPool.users.push(user);
  userPool.save();

  const rootApp = userPool.apps.find(app => app.isRoot);

  const activationToken = generatePasswordToken(rootApp, userPool, user);
  user.resetPasswordToken = activationToken;
  user.save();

  sendMail(req.body.email, 'New account', rootApp.welcomeEmail
    .replace(/\{\{url\}\}/g, rootApp.url)
    .replace(/\{\{username\}\}/g, req.body.email)
    .replace(/\{\{token\}\}/g, Buffer.from(activationToken).toString('base64')));

  return res.status(201).send({ user });
}

export async function update(req, res) {
  const { uuid } = req.params;
  await User.updateOne({ uuid }, excludeSaveAttributes(req.body));

  return res.status(200).json(await User.findOne({ uuid }));
}

export async function resetUserPassword(req, res) {
  const { password } = req.body;
  const { uuid } = req.params;

  try {
    await User.updateOne({ uuid }, await encryptPassword({ password }));
  } catch (err) {
    return res.status(404).send();
  }

  return res.status(200).send();
}
