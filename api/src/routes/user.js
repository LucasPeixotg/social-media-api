const router = require('express').Router()
const User = require('../database/User')

router.get('/search/username', async (req, res) => {
    let { username, limit, offset } = req.body

    if(!limit) limit = 5
    if(!offset) offset = 0

    try {
        const result = await User.searchByUsername(username, limit, offset)
    
        res.status(200).json({ result })
    } catch(error) {
        res.status(500).json({ message: 'Could not fetch data' })
    }
})

module.exports = router