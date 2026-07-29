import express from 'express'
import {
  createGroup,
  getGroups,
  getGroup,
  addMember,
  removeMember,
  updateGroup,
  deleteGroup,
  joinGroupByCode,
  leaveGroup,
  addResource,
  getGroupResources,
  deleteResource,
} from '../controllers/groupController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.route('/').post(createGroup).get(getGroups)
router.post('/join/code', joinGroupByCode)
router.route('/:id').get(getGroup).put(updateGroup).delete(deleteGroup)
router.post('/:id/leave', leaveGroup)
router.post('/:id/add-member', addMember)
router.post('/:id/remove-member', removeMember)
router.post('/:id/resources', addResource)
router.get('/:id/resources', getGroupResources)
router.delete('/:id/resources/:resourceId', deleteResource)

export default router
