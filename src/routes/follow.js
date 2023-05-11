const router = require('express').Router()
const User = require('../database/User')


/*
GET routes
*/
// get everyone that is following the logged user
router.get('/followers', async (req, res) => {
    try {
        const followers = await User.getFollowers(req.user._id)

        if(followers === null) return res.status(500).json({ message: 'Could not get followers' })

        return res.status(200).json(followers)
    } catch(error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not get followers' })
    }
})

// get everyone that the logged user is following
router.get('/following', async (req, res) => {
    try {
        const following = await User.getFollowing(req.user._id)

        if(following === null) return res.status(500).json({ message: 'Could not get following' })

        return res.status(200).json(following)
    } catch(error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not get following' })
    }
})

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