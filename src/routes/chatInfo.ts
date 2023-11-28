import express, { RequestHandler } from 'express'
import { getUserConctacts, getUserConversations } from '../controllers/userInformation'

const router = express.Router()

router.get('/conversations', (getUserConversations) as RequestHandler)
router.get('/contacts', (getUserConctacts) as RequestHandler)

export default router
