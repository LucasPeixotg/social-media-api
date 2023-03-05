const driver = require('../config/dbDriver').getConnection()

class Post {
    static async insert(post) {
        console.log(post)
    }
}

module.exports = Post