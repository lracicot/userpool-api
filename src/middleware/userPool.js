import UserPool from '../models/userPool';

export default async function (req, res, next) {
  const { uuid } = req.params;
  const userPool = await UserPool.findOne({ uuid });

  if (!uuid || !userPool) {
    return res.status(404).json({ message: `User pool ${uuid} not found` });
  }

  req.userPool = userPool;
  return next();
}
