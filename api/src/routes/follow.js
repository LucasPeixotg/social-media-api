const router = require('express').Router()
const User = require('../database/User')


/*
GET routes
*/
router.get('/', (req, res) => { })


/*
POST routes
*/
// block user
router.post('/block', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await User.block(req.user._id, id)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not block user' })
    }
})

// accept follow request
router.post('/accept', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await User.acceptFollow(req.user._id, id)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not accept follower' })
    }
})

// follow user or send follow request, depending on user privacy status
router.post('/', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const relation = await User.follow(req.user._id, id)
        return res.status(200).json(relation)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not create relationship' })
    }
})


/*
DELETE routes
*/
// stop following
router.delete('/unfollow', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        await User.removeFollower(id, req.user._id)
        return res.status(200).json({ message: 'User unfollowed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not unfollow user' })
    }
})

// remove follower
router.delete('/follower', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        await User.removeFollower(req.user._id, id)
        return res.status(200).json({ message: 'Follower removed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not remove follower' })
    }
})

// unblock user
router.delete('/block', async (req, res) => {
    const { id } = req.body

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        await User.unblock(req.user._id, id)
        return res.status(200).json({ message: 'User unblocked'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not unblock user' })
    }
})


module.exports = router