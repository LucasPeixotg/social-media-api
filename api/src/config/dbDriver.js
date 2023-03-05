const neo4j = require('neo4j-driver')

let _driver
module.exports = {
    connect: (uri, user, password) => {
        _driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    },
    getConnection: () => _driver
}