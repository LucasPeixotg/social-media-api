const router = require('express').Router()
const User = require('../database/User')

/*
GET routes
*/
router.get('/search', async (req, res) => {
    const { username } = req.body

    if (username === undefined) return res.status(400).json({ message: 'Bad request' })

    try {
        const response = await User.search(username)

        return res.status(200).json(response)
    } catch(error) {
        console.error(error)
        return res.status(500).json({ message: 'Could not search user' })
    }
})


module.exports = router