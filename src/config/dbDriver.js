const neo4j = require('neo4j-driver')

let _driverSession
module.exports = {
    connect: (uri, user, password, database) => {
        _driverSession = neo4j.driver(uri, neo4j.auth.basic(user, password)).session({ database })
    },
    getConnection: () => _driverSession,
    close: () => {
        _driverSession.close()
    }
}