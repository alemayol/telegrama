import express, { type Request } from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import MongoDBStore from 'connect-mongodb-session'
import { connectDB } from './db/connectDB'
import { errorHandlerMiddleware } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import 'express-async-errors'
import cors from 'cors'
import { Server, Socket } from 'socket.io'
import { createServer } from 'http'

/* Routes */
import AuthRouter from './routes/auth'
import UserInfoRouter from './routes/chatInfo'

/* Schema Types */
import {
  Contact,
  Conversation,
  GuestContact,
  GuestMessage,
  Message
} from './types/Types'
import { corsCredentials } from './middleware/corsCredentials'
import { corsOptions } from './config/corsOptions'
import { checkActiveSession } from './controllers/checkActiveSession'
import { HydratedDocument } from 'mongoose'
import MessageModel from './models/Message'
import Conversations from './models/Conversations'
import ContactModel from './models/Contact'
import User from './models/User'
import { StatusCodes } from 'http-status-codes'

dotenv.config()
const app = express()
app.set('trust proxy', 1)
app.use(corsCredentials)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors(corsOptions))

const MongoStore = MongoDBStore(session)

const storeDB = new MongoStore({
  uri: process.env.MONGO_URI as string,
  collection: 'userSessions'
})

// Create a string with the session secrets separated by a space in your enviroment file, these will be used to sign the session cookie. I'm using an array to rotate the secret without invalidating the last one.
const SECRETS = process.env.SESSION_SECRETS_ARRAY?.split(' ') as string[]

// Cookie session options
const sessionMiddleware = session({
  secret: SECRETS,
  resave: true,
  rolling: true,
  saveUninitialized: false,
  store: storeDB,
  cookie: {
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes,
    sameSite: 'none',
    secure: false
  }
})

app.use(sessionMiddleware)

// Creating http server for socket io
const socketServer = createServer(app)

export const io = new Server(socketServer, {
  cors: corsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 60000
  }
})

app.use('/api', AuthRouter)
app.use('/user', UserInfoRouter)
app.use('/checkActiveSession', function (req, res, next) {
  checkActiveSession(req, res, next)
    .then((data) => {
      return res.status(StatusCodes.OK).json(data)
    })
    .catch((err) => {
      return next(err)
    })
})

// Sharing the express session context with socket io
io.engine.use(sessionMiddleware)

// Reload express session
function reloadExpressSession (socket: Socket): void {
  socket.request.session.reload((err) => {
    if (err === true) {
      socket.conn.close()
    }
  })
}

// Checking auth through socket and setting the session object
// io.use(socketAuth)
io.on('connection', async (socket) => {
  const req = socket.request as Request

  console.log('SOCKET!')

  const { user, isGuest } = socket.handshake.auth

  const validGuest = Boolean(isGuest)
  const validUser: GuestContact = user

  if (validUser != null && validGuest) {
    await socket.join(validUser._id)

    socket.on('guestMessageSent', (converId: string, message: GuestMessage) => {
      message.partipants.forEach((recipient) => {
        socket.broadcast
          .to(recipient._id)
          .emit('guestMessage', converId, message)
      })
    })
  } else if (req.session.user != null) {
    const user = req.session.user
    const userDoc = await User.findById(user._id)

    if (userDoc === null) {
      return socket.emit('error', {
        ok: false,
        message: 'Unable to verify user'
      })
    }
    const userId = userDoc._id.toString()
    await socket.join(userId)

    socket.on(
      'createConversation',
      async (participants: string[], groupName?: string) => {
        reloadExpressSession(socket)

        const nameOfGroup = groupName ?? ''

        const findExistingConversation = await Conversations.findOne({
          'participants._id': userId,
          participants: { $size: 2 }
        })

        if (findExistingConversation != null) {
          return io.to(userId).emit('error', {
            ok: false,
            message: 'Conversation already exists'
          })
        }

        const newConversation: HydratedDocument<Conversation> =
          await Conversations.create({
            createdBy: user.name,
            groupName: nameOfGroup,
            participants: [
              {
                _id: userId,
                name: user.name
              },
              ...participants
            ]
          })

        // I can't seem to find a method from mongoose, to filter properties.
        //  Will just have to query the db again and filter the document with select

        if (newConversation == null) {
          io.to(userId).emit('error', {
            ok: false,
            message: 'Unable to create conversation'
          })
        } else {
          const getFilteredConversation = await Conversations.findById(
            newConversation._id
          ).select('-createdAt -updatedAt -__v')
          io.to(userId).emit('conversationCreated', getFilteredConversation)
        }
      }
    )

    socket.on('createContact', async (contact: Contact) => {
      reloadExpressSession(socket)
      const { _id, name } = contact

      if (_id != null && name === '') {
        return socket.broadcast.to(userId).emit('error', {
          ok: false,
          message: 'Unable to create contact. Missing parameters'
        })
      }

      const existingContact = userDoc.contacts.find((conc) => conc._id === _id)

      if (existingContact != null) {
        return socket.broadcast.to(userId).emit('error', {
          ok: false,
          message: 'Unable to create contact. Contact already exists'
        })
      }

      const newContact: HydratedDocument<Contact> = await ContactModel.create({
        _id,
        name
      })

      if (newContact == null) {
        socket.broadcast
          .to(userId)
          .emit('error', { ok: false, message: 'Unable to create contact' })
      } else {
        await userDoc.updateOne({ $push: { contacts: newContact } })
        socket.broadcast.to(userId).emit('contactCreated', {
          _id: newContact._id,
          name: newContact.name
        })
      }
    })

    socket.on('messageSent', async (converID: string, message: Message) => {
      reloadExpressSession(socket)
      const newMessage = await MessageModel.create({
        message: message.message,
        participants: message.participants,
        read: message.read,
        sentBy: message.sentBy
      })
      const conversation = await Conversations.findById(converID)

      if (conversation == null) {
        const newConversation: HydratedDocument<Conversation> =
          await Conversations.create({
            createdBy: user.name,
            messages: [newMessage],
            participants: message.participants
          })

        newConversation.participants.forEach((receiver) => {
          io.to(receiver._id).emit(
            'userMessage',
            newConversation._id,
            newMessage
          )
        })
      } else {
        await conversation.updateOne({ $push: { messages: newMessage } })
        conversation.participants.forEach((receiver) => {
          io.to(receiver._id).emit('userMessage', conversation._id, newMessage)
        })
      }
    })
  }

  socket.on('unauthorize', (err) => {
    if (err instanceof Error && err.message === 'No Credentials Provided') {
      socket.emit('unauthorize', {
        ok: false,
        message: 'No Credentials Provided'
      })
      socket.disconnect()
    }
  })

  socket.on('error', (err) => {
    if (err instanceof Error) {
      socket.emit('error', { ok: false, message: err.message })
      socket.disconnect()
    }
  })
})

app.use(notFound)
app.use(errorHandlerMiddleware)

const PORT = process.env.PORT ?? 3000

void (async function start () {
  try {
    await connectDB(process.env.MONGO_URI as string)

    socketServer.listen(PORT)
  } catch (error) {
    socketServer.close()
  }
})()
