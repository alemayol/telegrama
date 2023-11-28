
// import { SessionData } from 'express-session'
import session, { Session } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import mongoose, { Model, Schema } from 'mongoose'

export interface ErrorHandler {
  ok: boolean
  status: StatusCodes
  message: string | string[]
}

/* Extending express session data interfaceto add custom properties */
declare module 'express-session' {
  interface SessionData {
    isAuth: boolean
    isGuest: boolean
    user: {
      _id: string
      name: string
    }
  }
}

declare module 'http' {
  interface IncomingMessage {
    cookieHolder?: string
    session: Session & Partial<session.SessionData>
  }
}

// export type ExtendedSessionOptions = SessionData & {
//   isAuth?: boolean
//   isGuest?: boolean
//   user?: {
//     username: string
//     id: Types.ObjectId
//   }
// }

// export type RegisterUser = {
//   ok: boolean
//   username: string
// }

export interface Contact {
  _id: string
  name: string
}

/* Create an interface that imitates the Mongoose Schema so I can add instance methods */
export interface User {
  username: string
  password: string
  contacts: Contact[]
}

export interface UserMethods {
  comparePassword: (pass: string) => boolean
}

export type UserModel = Model<User, {}, UserMethods>

/* Messages */

export interface Message {
  message: string
  read: boolean
  sentBy: string
  participants: mongoose.Schema.Types.ObjectId[]
}

export interface Conversation {
  createdBy: Schema.Types.ObjectId
  messages: Message[]
  participants: Contact[]
  groupName?: string
}

export interface GuestContact {
  _id: string
  name: string
}

export interface GuestMessage {
  _id: string
  message: string
  read: boolean
  sentBy: string
  partipants: Contact[]
}
