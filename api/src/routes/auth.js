require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET

const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')

router.post('/register', 
    passport.authenticate('register', { session: false }), 
    (req, res) => {
        res.status(200).send('ok')
    }
)

router.post('/login', 
    async (req, res, next) => {
        passport.authenticate('login', 
            async (error, user, info) => {
                try {
                    if(error || !user) {
                        const error = new Error('Could not login')
    
                        next(error)
                    }
    
                    req.login(
                        user,
                        { session: false },
                        async (error) => {
                            if(error) return next(error)
    
                            console.log('+++++++++++ => \n', user)
                            const body = { _id: user._id, username: user.username }
                            const token = jwt.sign({ user: body }, JWT_SECRET)
    
                            return res.json({ token })
                        }
    
                    )
                } catch(error) {
                    return next(error)
                }
            }
        )(req, res, next)
    }
)

module.exports = router