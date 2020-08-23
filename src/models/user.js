/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';


export const UserSchema = mongoose.Schema({
  uuid: { type: String, index: true },
  name: String,
  email: { type: String, required: true, unique: true },
  emailVerified: Boolean,
  apps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AppClient' }],
  passwordHash: { type: String, required: true },
  roles: [mongoose.Schema({ role: String, promo: Number }, { _id: false })],
});

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.id;
    delete ret._id;
    delete ret.salt;
    delete ret.passwordHash;
  },
});

UserSchema.plugin(timestamps);

export default mongoose.model('User', UserSchema);
