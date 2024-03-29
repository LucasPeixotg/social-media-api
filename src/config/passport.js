require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JWTStrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt

const UserController = require('../controllers/UserController')
const { comparePassword } = require('../utils/auth')
const User = require('../models/User')

passport.use('register', new LocalStrategy(
    {
        'usernameField': 'username',
        'passwordField': 'password'
    }, async (username, password, done) => {
        try {
            // check if username is already in use
            if (await UserController.getByUsername(username)) {
                return done(null, false)
            }

            const user = new User(username, password, '')
            const response = await UserController.insert(user)
            return done(null, response)

        } catch (error) {
            console.error(error)
            return done(error)
        }
    }
))

passport.use('login', new LocalStrategy(
    {
        'usernameField': 'username',
        'passwordField': 'password'
    }, async (username, password, done) => {
        try {
            const user = await UserController.getByUsername(username)

            // check if user doesn't exist
            if (!user) {
                return done(null, false)
            }

            // check if the password is incorrect
            if (!comparePassword(password, user.hash)) {
                return done(null, false)
            }

            // login successful
            return done(null, user)
        } catch (error) {
            console.error(error)
            done(error)
        }
    }
))

passport.use(new JWTStrategy(
    {
        secretOrKey: JWT_SECRET,
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
    },
    async (token, done) => {
        try {
            return done(null, token.user)
        } catch (error) {
            console.error(error)
            done(error)
        }
    }
))