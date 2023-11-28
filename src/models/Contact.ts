import { Schema, model } from 'mongoose'
import { Contact } from '../types/Types'

export const ContactSchema = new Schema<Contact>({
  _id: String,
  name: {
    type: String,
    required: [true, 'Please provide a contact name']
  }
}, {
  _id: false
})

export default model('Contact', ContactSchema)
