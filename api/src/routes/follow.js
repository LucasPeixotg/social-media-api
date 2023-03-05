const router = require('express').Router()

router.get('/', (req, res) => {
    console.log('=1=1=1=1=1  ', req.user)
    const result = { message: 'ok' }
    res.status(200).json(result)
})

module.exports = router