/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';


export const UserSchema = mongoose.Schema({
  uuid: { type: String, index: true, required: true },
  name: String,
  profile: { },
  email: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  passwordHash: { type: String, required: false },
  resetPasswordToken: String,
  roles: [mongoose.Schema({
    name: { type: String, required: true },
    meta: Object,
  }, { _id: false })],
});

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.id;
    delete ret._id;
    delete ret.salt;
    delete ret.passwordHash;
    delete ret.resetPasswordToken;
  },
});

UserSchema.plugin(timestamps);

export default mongoose.model('User', UserSchema);
