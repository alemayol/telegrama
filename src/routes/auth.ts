import express, { RequestHandler } from 'express'
import { guestLogin, logout, register, login } from '../controllers/auth'

const router = express.Router()

router.post('/signup', (register) as RequestHandler)
router.post('/login', (login) as RequestHandler)
router.post('/logout', (logout) as RequestHandler)
router.post('/guest', (guestLogin) as RequestHandler)

export default router
