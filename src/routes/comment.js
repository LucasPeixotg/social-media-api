const router = require('express').Router()
const Comment = require('../controllers/CommentController')
const Post = require('../controllers/PostController')
const User = require('../controllers/UserController')


/*
GET routes
*/
//get comments on a comment
router.get('/comment/:id')

// get comments on a post
router.get('/', async (req, res) => {
    const { id } = req.body
    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    let { limit, page } = req.body
    if (!limit || limit > 50) limit = 5
    if (!page) page = 0

    try {
        const postAuthorId = await Post.getAuthorId(id)

        if (postAuthorId === undefined) {
            return res.status(404).json({ message: 'Not found' })
        }

        const authorized = postAuthorId == req.user._id || await User.areFriendsOrPublic(req.user._id, postAuthorId)
        if (!authorized) {
            return res.status(101).json({ message: 'Unauthorized' })
        }

        const comments = await Comment.getComments(id)
        return res.status(200).json(comments)
    } catch (error) {
        console.error(error)
        return res.status(500).json()
    }
})


/*
POST routes
*/
// comment on a comment
router.post('/comment', async (req, res) => {
    const { content, id } = req.body

    if (content === undefined || content === '' || id === undefined) {
        return res.status(400).json({ message: 'Bad request' })
    }

    try {
        const result = await Comment.commentComment(req.user._id, id, content)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not comment on comment' })
    }
})

// comment on a post
router.post('/', async (req, res) => {
    const { content, id } = req.body

    if (content === undefined || content === '' || id === undefined) {
        return res.status(400).json({ message: 'Bad request' })
    }

    try {
        const result = await Comment.commentPost(req.user._id, id, content)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not comment on post' })
    }
})


module.exports = router
