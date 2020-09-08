/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const resetEmailTemplate = `
To reinitialize your password, <a href="{{url}}/{{token}}">click here</a> or visit the following address: {{url}}/{{token}}
`;

const welcomeEmailTemplate = `
Welcome! <br /> <br />

Your account has been created with the username: {{username}}. <br />

To enable your account, <a href="{{url}}/{{token}}">click here</a> or visit the following address: {{url}}/{{token}}
`;


export const AppClientSchema = mongoose.Schema({
  uuid: { type: String, index: true, required: true },
  name: { type: String, unique: true, required: true },
  isRoot: { type: Boolean, default: false },
  key: { type: Object, required: true },
  url: String,
  welcomeEmail: { type: String, default: welcomeEmailTemplate },
  resetEmail: { type: String, default: resetEmailTemplate },
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
