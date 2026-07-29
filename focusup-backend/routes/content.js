import express from 'express'
import multer from 'multer'
import path from 'path'
import {
  createContent,
  getContent,
  getSingleContent,
  updateContent,
  deleteContent,
  searchContent,
  uploadContent,
} from '../controllers/contentController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'))
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
    cb(null, safeName)
  }
})
const upload = multer({ storage })

// Search PDFs and YouTube videos by title/keyword
router.get('/search', searchContent)

// Upload endpoint for files (PDFs)
router.post('/upload', upload.single('file'), uploadContent)

router.route('/').post(createContent).get(getContent)
router.route('/:id').get(getSingleContent).put(updateContent).delete(deleteContent)

export default router
