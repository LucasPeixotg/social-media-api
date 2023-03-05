const bcrypt = require('bcrypt')

const saltRounds = 11

function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash)
}

function hashPassword(password) {
    return bcrypt.hashSync(password, saltRounds)
}

module.exports = {
    comparePassword,
    hashPassword
}