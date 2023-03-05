require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JWTStrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt

const User = require('../database/User')
const { hashPassword, comparePassword } = require('../utils/auth')

passport.use('register', new LocalStrategy(
    {
        'usernameField': 'username',
        'passwordField': 'password'
    }, async (username, password, done) => {
        try {
            const user = await User.findByUsername(username)
            if (user) {
                return done(null, false)
            }

            const response = User.insert({ username, hash: hashPassword(password) })
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
            const user = await User.findByUsername(username)

            console.log('user: ', user)
            if (!user) {
                return done(null, false)
            }

            if (!comparePassword(password, user.hash)) {
                return done(null, false)
            }

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