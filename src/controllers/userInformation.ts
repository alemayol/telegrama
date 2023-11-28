import { NextFunction, Request, Response } from 'express'
import Conversations from '../models/Conversations'
import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../types/Classes'
import User from '../models/User'

export async function getUserConversations (req: Request, res: Response, next: NextFunction): Promise<unknown> {
  try {
    const { user } = req.session

    if (user == null) {
      throw new CustomError('Unauthorized Request', StatusCodes.UNAUTHORIZED)
    }

    const userConversations = await Conversations.find({ 'participants._id': user?._id }).select('-__v -updatedAt')

    return res.status(StatusCodes.OK).json(userConversations)
  } catch (err) {
    next(err)
  }
}

export async function getUserConctacts (req: Request, res: Response, next: NextFunction): Promise<unknown> {
  try {
    const { user } = req.session

    if (user == null) {
      throw new CustomError('Unauthorized Request', StatusCodes.UNAUTHORIZED)
    }

    const userContacts = await User.findById(user._id).select('contacts')

    return res.status(StatusCodes.OK).json(userContacts)
  } catch (err) {
    next(err)
  }
}
