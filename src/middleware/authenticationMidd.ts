// import { CustomError } from '../types/Classes'
// import { StatusCodes } from 'http-status-codes'
// import { io } from '..'
// import { Socket } from 'socket.io'

// io.on('connection', (socket: Socket) => {

// })

// export const authenticationMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
//   const { isAuth, isGuest } = req.session

//   console.log('auth')
//   console.log(req.session.id)

//   const isGuestBool = Boolean(isGuest)

//   if (isAuth != null || isGuestBool) {
//     res.status(StatusCodes.OK).json({ ok: true, isGuest: true })
//     req.session.save()
//     next()
//   } else {
//     throw new CustomError('No Credentials Provided', StatusCodes.IM_A_TEAPOT)
//   }
// }
