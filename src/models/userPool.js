/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';


export const UserPoolSchema = mongoose.Schema({
  uuid: { type: String, index: true, required: true },
  name: { type: String, required: true },
  isRoot: Boolean,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  apps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AppClient' }],
});

UserPoolSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.id;
    delete ret._id;
  },
});

function autoPopulateApps() {
  this.populate('apps');
}

// Query hooks
UserPoolSchema.pre('find', autoPopulateApps);
UserPoolSchema.pre('findOne', autoPopulateApps);
UserPoolSchema.pre('findBy', autoPopulateApps);

UserPoolSchema.plugin(timestamps);

export default mongoose.model('UserPool', UserPoolSchema);
