const router = require('express').Router()
const Comment = require('../database/Comment')


/*
GET routes
*/
//get comments on a comment
router.get('/comment/:id')

// get comments on a post
router.get('/:id', (req, res) => { })


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
