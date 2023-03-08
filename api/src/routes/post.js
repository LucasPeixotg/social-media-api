const router = require('express').Router()
const Post = require('../database/Post')

const { isValidPost } = require('../utils/post')

/*
GET routes
*/
// get most relevant posts
router.get('/', (req, res) => { })

// get comments
router.get('/comment/:id', (req, res) => { })

// get specific post
router.get('/:id', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const post = await Post.getById(id)

        if (!post) return res.status(404).json({ message: 'Post dont exist' })

        return res.status(200).json(post)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not get post' })
    }
})


/*
POST routes
*/
// create post
router.post('/', async (req, res) => {
    const post = req.body

    if (!isValidPost(post)) {
        return res.status(400).json({ message: 'Bad request' })
    }

    try {
        const result = await Post.insert(req.user._id, post)
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: 'Could not create post' })
    }
})

// like post
router.post('/like', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await Post.like(req.user._id, id)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not like post' })
    }
})

// dislike post
router.post('/dislike', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await Post.dislike(req.user._id, id)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not dislike post' })
    }
})


/*
DELETE routes
*/
// delete post
router.delete('/', (req, res) => {})

// remove like
router.delete('/like', (req, res) => { })

// remove dislike
router.delete('/dislike', (req, res) => { })


/*
PUT routes
*/
// edit comment
router.put('/comment', (req, res) => { })

// edit post
router.put('/:id', (req, res) => { })


module.exports = router