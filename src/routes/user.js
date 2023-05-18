const router = require('express').Router()
const UserController = require('../controllers/UserController')


/*
    TODO:
    [ ] ADD HATEOS TO EVERY RESPONSE
*/


/*
BEFRIENDS RELATIONSHIP RELATED
*/
// add friend
router.post('/befriends/:id', async (req, res) => {
    const id = req.params.id

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const relation = await UserController.addBefriendRelationship(req.user._id, id)
        return res.status(200).json(relation)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not befriends user' })
    }
})

// accept friend
router.put('/befriends/:id', async (req, res) => {
    const id = req.params.id

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await UserController.acceptFriendshipRequest(
            parseInt(req.user._id),
            parseInt(id)
        )
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not accept follower' })
    }
})

// remove friend
router.delete('/befriends/:id', async (req, res) => {
    const id = req.params.id

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        await UserController.removeBefriendRelationship(req.user._id, id)
        return res.status(200).json({ message: 'Friend removed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not remove follower' })
    }
})


/*
BLOCKS RELATIONSHIP RELATED
*/
// block user
router.post('/blocks/:id', async (req, res) => {
    const id = req.params.id

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const result = await UserController.addBlockRelationship(req.user._id, id)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not block user' })
    }
})

// unblock user
router.delete('/blocks/:id', async (req, res) => {
    const id = req.params.id

    if (id === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        await UserController.removeBlockRelationship(req.user._id, id)
        return res.status(200).json({ message: 'User unblocked' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not unblock user' })
    }
})


/*
GET USER
*/
// search user by username
router.get('/', async (req, res) => {
    const username = req.body.username

    if (username === undefined) {
        return res.status(400).json({ message: 'Bad request' })
    }

    try {
        const response = await UserController.search(username)

        return res.status(200).json(response)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not search user' })
    }
})

// get user by id
router.get('/:id', async (req, res) => {
    const id = req.params.id

    if (id === undefined) {
        return res.status(400).json({ message: 'Bad request' })
    }

    try {
        const response = await UserController.getById(id)

        return res.status(200).json(response)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not get user' })
    }
})


module.exports = router