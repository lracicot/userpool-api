/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';


export const AppClientSchema = mongoose.Schema({
  uuid: { type: String, index: true, required: true },
  name: { type: String, unique: true, required: true },
  isRoot: { type: Boolean, default: false },
  key: { type: Object, required: true },
});

AppClientSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.id;
    delete ret._id;
    delete ret.key;
  },
});

AppClientSchema.plugin(timestamps);

export default mongoose.model('AppClient', AppClientSchema);
