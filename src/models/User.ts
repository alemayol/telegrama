import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import { USERNAME_EXP } from '../types/RegExp'
import { User, UserMethods, UserModel } from '../types/Types'
import { ContactSchema } from './Contact'

const UserSchema = new Schema<User, UserModel, UserMethods>({
  username: {
    type: String,
    required: [true, 'Please provide an username'],
    match: [
      USERNAME_EXP,
      '4 to 32 characters. Must begin with a letter. Letters, numbers, underscores hyphens allowed.'
    ],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8
  },
  contacts: {
    type: [ContactSchema],
    default: []
  }
}, {
  timestamps: true
})

UserSchema.methods.comparePassword = function (pass: string) {
  return bcrypt.compareSync(pass, this.password)
}

export default mongoose.model('User', UserSchema)
