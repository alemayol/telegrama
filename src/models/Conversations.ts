import mongoose, { Schema } from 'mongoose'
import { Conversation } from '../types/Types'
import { MessageSchema } from './Message'
import { ContactSchema } from './Contact'

const ConversationSchema = new Schema<Conversation>({
  createdBy: {
    type: String,
    ref: 'User'
  },
  messages: {
    type: [MessageSchema],
    default: []
  },
  participants: {
    type: [ContactSchema]
  },
  groupName: String
}, {
  timestamps: true
})

export default mongoose.model('Conversations', ConversationSchema)
