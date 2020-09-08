import { v4 as uuidv4 } from 'uuid';
import { JWK } from 'jose';
import AppClient from '../models/appClient';
import { generatePrivateKeyPair } from '../authentication';

export const details = (req, res) => AppClient.findOne({ uuid: req.params.uuid })
  .then(app => res.json(app));

export const exportKeys = (req, res) => AppClient.findOne({ uuid: req.params.uuid })
  .then((app) => {
    const key = JWK.asKey(app.key);
    res.json({
      public: key.toPEM(),
      private: key.toPEM(true),
    });
  });

export const create = ({ body, userPool }, res) => generatePrivateKeyPair()
  .then(key => AppClient.create({
    uuid: uuidv4(), name: body.name, userPool, key, isRoot: false,
  }))
  .then(app => userPool.apps.push(app) && userPool.save())
  .then(() => res.status(201).send(userPool));

export const remove = async (req, res) => {
  const app = await AppClient.findOne({ uuid: req.params.uuid, isRoot: false });

  if (!app) {
    return res.status(404).send();
  }

  await AppClient.deleteOne({ uuid: req.params.uuid });
  return res.status(200).json(app);
};
