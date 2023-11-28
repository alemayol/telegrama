import UserSchema from '../models/User'
import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../types/Classes'
import { NextFunction, Request, Response } from 'express'
import { PASSWORD_EXP } from '../types/RegExp'
import { HydratedDocument } from 'mongoose'
import { User } from '../types/Types'

export const register = async (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
  const { username, password } = req.body

  const userExists = await UserSchema.findOne({ username })

  if (userExists != null) {
    throw new CustomError('User already exists', StatusCodes.CONFLICT)
  }

  if (!PASSWORD_EXP.test(password)) {
    throw new CustomError('Password must have 8 to 24 characters. 8 to 24 characters. Must include uppercase and lowercase letters, a number and a special character. Allowed special characters: !, @, #, $, %', StatusCodes.BAD_REQUEST)
  }

  const hashPass: string = await bcrypt.hash(password, 10)

  const newUser: HydratedDocument<User> = await UserSchema.create({ username, password: hashPass })

  return res.status(StatusCodes.CREATED).json({ username: newUser.username, ok: true })
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { username, password } = req.body

  const validUsername = Boolean(username)
  const validPassword = Boolean(password)

  if (!validUsername || !validPassword) {
    throw new CustomError('Please provide both an username and a password', StatusCodes.BAD_REQUEST)
  }

  const user = await UserSchema.findOne({ username })

  if (user == null) {
    throw new CustomError('Invalid Credentials', StatusCodes.UNAUTHORIZED)
  }

  const validatePassword: boolean = user.comparePassword(password)

  if (!validatePassword) {
    throw new CustomError('Invalid Credentials', StatusCodes.UNAUTHORIZED)
  }

  req.session.isAuth = true

  req.session.user = {
    _id: user._id.toString(),
    name: user.username
  }

  req.session.save()

  return res.sendStatus(StatusCodes.OK)
}

export const guestLogin = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { isGuest } = req.body

  const validGuest = Boolean(isGuest)

  if (validGuest) {
    return res.status(StatusCodes.OK).json({ ok: true, isGuest: true })
  } else {
    throw new CustomError('Bad Guest User Request', StatusCodes.BAD_REQUEST)
  }
}

export const logout = async (req: Request, res: Response): Promise<unknown> => {
  req.session.destroy((error) => {
    if (error instanceof Error || Boolean(error)) {
      throw new CustomError('Credentials Error on Logout', StatusCodes.NO_CONTENT)
    }
  })

  return res.sendStatus(StatusCodes.NO_CONTENT)
}
