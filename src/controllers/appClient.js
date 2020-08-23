import { v4 as uuidv4 } from 'uuid';
import { JWK } from 'jose';
import AppClient from '../models/appClient';

export async function list(req, res) {
  res.json({
    apps: await AppClient.find({}),
  });
}

export async function details(req, res) {
  res.json({
    app: await AppClient.findOne({ uuid: req.params.uuid }),
  });
}

export async function create(req, res) {
  const key = await JWK.generate('RSA', 2048);
  // const publicKey = privateKey.toPEM();
  const app = await AppClient.create({
    uuid: uuidv4(),
    ...req.body,
    key,
  });
  return res.status(201).send({ app });
}


export async function remove(req, res) {
  const app = await AppClient.findOne({ uuid: req.params.uuid });

  if (!app) {
    return res.status(404).send();
  }

  await AppClient.deleteOne({ uuid: req.params.uuid });
  // await AppClient.remove({ });
  return res.status(200).json(app);
}
