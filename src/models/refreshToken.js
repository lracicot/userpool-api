/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';


export const RefreshTokenSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  app: { type: mongoose.Schema.Types.ObjectId, ref: 'AppClient' },
  token: String,
  expires: Date,
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String,
});

RefreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});
RefreshTokenSchema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired;
});

RefreshTokenSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.id;
    delete ret.user;
  },
});

RefreshTokenSchema.plugin(timestamps);

export default mongoose.model('RefreshToken', RefreshTokenSchema);
