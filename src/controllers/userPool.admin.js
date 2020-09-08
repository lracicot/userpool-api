import { v4 as uuidv4 } from 'uuid';

import UserPool from '../models/userPool';
import AppClient from '../models/appClient';
import User from '../models/user';
import { encryptPassword, generatePrivateKeyPair } from '../authentication';

export const create = (req, res) => generatePrivateKeyPair()
  .then(key => AppClient.create({
    uuid: uuidv4(),
    name: req.body.appName,
    isRoot: true,
    key,
  }))
  .then(app => UserPool.create({
    uuid: uuidv4(),
    apps: [app],
    isRoot: false,
    name: req.body.name,
  }))
  .then(userPool => res.status(201).send(userPool));

export const list = (req, res) => UserPool.find({}).select('-users').then(
  userPools => res.json(userPools),
);

export const listUsers = (req, res) => UserPool.findOne({ uuid: req.params.uuid })
  .populate('users')
  .then(userPool => res.json(userPool.users));

export const listApps = ({ userPool }, res) => res.json(userPool.apps);

export const remove = (req, res) => UserPool.deleteOne({ uuid: req.userPool.uuid, isRoot: false })
  .then(ret => (ret.deletedCount
    ? res.status(200).json(req.userPool)
    : res.status(400).send()));

export async function start(req, res) {
  const userPools = await UserPool.remove({});
  const apps = await AppClient.remove({});
  const users = await User.remove({});

  if (apps.length || users.length || userPools.length) {
    return res.status(400).send();
  }

  const app = await AppClient.create({
    uuid: uuidv4(),
    name: 'root',
    isRoot: true,
    key: await generatePrivateKeyPair(),
  });

  const { email, name, password } = req.body;

  const user = await User.create(await encryptPassword({
    uuid: uuidv4(),
    emailVerified: false,
    roles: [{ name: 'ROLE_ADMIN' }, { name: 'ROLE_ROOT' }],
    email,
    name,
    password,
  }));

  const userPool = await UserPool.create({
    uuid: uuidv4(),
    name: 'root',
    isRoot: true,
    apps: [app],
    users: [user],
  });

  return res.status(201).send(userPool);
}
