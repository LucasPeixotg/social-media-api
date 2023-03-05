const router = require('express').Router()
const User = require('../database/User')

router.get('/', (req, res) => {
    res.status(200).json(result)
})

router.post('/', async (req, res) => {
    const { id } = req.body

    if (!id) return res.status(400).json({ message: 'Bad request' })

    try {
        const relation = await User.follow(req.user._id, id)

        return res.status(200).json(relation)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not create relationship' })
    }
})

router.put('/accept', async (req, res) => {
    const { id } = req.body

    if (!id) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await User.acceptFollow(req.user._id, id)

        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not accept follower' })
    }
})

router.delete('/', async (req, res) => {
    const { id } = req.body

    if (!id) return res.status(400).json({ message: 'Bad request' })

    try {
        await User.removeFollow(req.user._id, id)
        return res.status(200).json({ message: 'Follower removed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not remove follower' })
    }

})

router.post('/block', async (req, res) => {
    const { id } = req.body

    if (!id) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await User.block(req.user._id, id)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not block user' })
    }
})

router.delete('/block', async (req, res) => {
    const { id } = req.body

    if (!id) return res.status(400).json({ message: 'Bad request' })

    try {
        await User.unblock(req.user._id, id)
        return res.status(200).json({ message: 'User unblocked'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not unblock user' })
    }
})

module.exports = router