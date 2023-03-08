require('dotenv').config()
const cors = require('cors')
const express = require('express')
const app = express()

const passport = require('passport')

/*
configuration middlewares
*/
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())


/*
initialize database
*/
const NEO4J_URI = process.env.NEO4J_URI
const NEO4J_USERNAME = process.env.NEO4J_USERNAME
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD
require('./config/dbDriver').connect(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)


/*
initialize passport
*/
require('./config/passport')
app.use(passport.initialize())


/*
routes setup
*/
const authRouter = require('./routes/auth')
const followRouter = require('./routes/follow')
const postRouter = require('./routes/post')
const commentRouter = require('./routes/comment')

app.use(authRouter)

// secure routes
app.use('/follow', passport.authenticate('jwt', { session: false }), followRouter)
app.use('/post', passport.authenticate('jwt', { session: false }), postRouter)
app.use('/comment', passport.authenticate('jwt', { session: false }), commentRouter)


/*
start server
*/
app.listen(5000, () => {
    console.log('server started. listenig on port 5000')
})