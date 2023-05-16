const { hashPassword } = require("../utils/auth")

class User {
    constructor(username, password, birthday, privacyStatus = 'private') {
        this.username = username
        this.hash = hashPassword(password)
        this.birthday = birthday
        this.privacyStatus = privacyStatus
    }
}

module.exports = User