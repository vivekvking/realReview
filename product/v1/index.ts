import { Router } from 'express'
const router = Router()

router.use('/', (req, res) => {
  res.send("yooo")
})

export default router;