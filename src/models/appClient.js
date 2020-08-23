/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';


export const AppClientSchema = mongoose.Schema({
  uuid: { type: String, index: true },
  name: String,
  key: Object,
});

AppClientSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.id;
    delete ret._id;
    delete ret.publicKey;
  },
});

AppClientSchema.plugin(timestamps);

export default mongoose.model('AppClient', AppClientSchema);
