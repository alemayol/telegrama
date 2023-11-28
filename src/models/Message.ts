import mongoose, { Schema } from 'mongoose'
import { Message } from '../types/Types'

export const MessageSchema = new Schema<Message>({
  message: String,
  read: Boolean,
  sentBy: {
    type: String,
    ref: 'User'
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User'
  }
}, {
  timestamps: true
})

export default mongoose.model('Message', MessageSchema)
