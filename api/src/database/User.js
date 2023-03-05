const driver = require('../config/dbDriver').getConnection()

class User {
    static async insert(user) {
        const session = driver.session({ database: 'neo4j' })

        let result
        try {
            const { username, hash } = user

            const query = `
                CREATE (user:USER {
                    date: $date,
                    privacyStatus: 'private',
                    dateOfBirth: $dateOfBirth,
                    username: $username,
                    hash: $hash
                })
                RETURN user
            `

            await session.executeWrite(tx => {
                result = tx.run(
                    query,
                    {
                        date: Date.now(),
                        dateOfBirth: '',
                        username,
                        hash
                    }
                )
            })
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
            return result
        }
    }

    static async findByUsername(username) {
        const session = driver.session({ database: 'neo4j' })

        let result
        const findQuery = `
            MATCH (user:USER)
            WHERE user.username = $username
            RETURN user LIMIT 1
        `

        try {
            const queryResult = await session.run(findQuery, { username })

            result = {
                _id: queryResult.records[0]._fields[0].identity.low,
                ...queryResult.records[0]._fields[0].properties
            }

        } catch (error) {
            console.error(error)
            return null
        } finally {
            await session.close()
            return result
        }
    }

    static async follow(followerId, targetUserId) {
        const session = driver.session({ database: 'neo4j' })

        const queryTargetUserPrivacyStatus = `
            MATCH (u:USER) 
            RETURN u
        `

        const followQuery = `
            MATCH (follower:USER)
            WHERE ID(follower) = $followerId 
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            CREATE (follower)-[relation:FOLLOWS { accepted: $accepted, date: $date }]->(targetUser)
            RETURN { relation: type(relation), accepted: relation.accepted }
        `

        const followQueryOptions = {
            followerId: parseInt(followerId),
            targetUserId: parseInt(targetUserId),
            date: Date.now()
        }

        let result
        try {
            const queryPrivacyResult = await session.run(queryTargetUserPrivacyStatus)
            const privacyStatus = queryPrivacyResult.records[0]._fields[0].properties.privacyStatus

            if (privacyStatus == 'private') {
                followQueryOptions.accepted = false
            } else {
                followQueryOptions.accepted = true
            }

            result = await session.run(followQuery, followQueryOptions)
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
            return result.records[0]._fields[0]
        }
    }

    static async acceptFollow(userId, followerId) {
        const session = driver.session({ database: 'neo4j' })

        const acceptQuery = `
            MATCH (user:USER)
            WHERE ID(user) = $userId 
            MATCH (follower:USER)
            WHERE ID(follower) = $followerId
            MATCH (follower) -[relation:FOLLOWS]-> (user)
            SET relation.accepted = true
            SET relation.date = $date
            RETURN { relation: type(relation), accepted: relation.accepted }
        `

        const acceptQueryOptions = {
            userId: parseInt(userId),
            followerId: parseInt(followerId),
            date: Date.now()
        }

        let result
        try {
            result = await session.run(acceptQuery, acceptQueryOptions)
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
            return result.records[0]._fields[0]
        }
    }

    static async removeFollow(userId, followerId) {
        const session = driver.session({ database: 'neo4j' })

        const removeQuery = `
            MATCH (user:USER)
            WHERE  ID(user) = $userId
            MATCH (follower:USER)
            WHERE ID(follower) = $followerId
            MATCH (follower) -[relation:FOLLOWS]-> (user)
            DELETE relation
        `

        const removeQueryOptions = {
            userId: parseInt(userId),
            followerId: parseInt(followerId)
        }

        try {
            await session.run(removeQuery, removeQueryOptions)
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
        }
    }

    static async block(userId, targetUserId) {
        const session = driver.session({ database: 'neo4j' })

        const blockQuery = `
            MATCH (user:USER)
            WHERE ID(user) = $userId
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            MERGE (user)-[relation:BLOCK]->(targetUser)
            SET relation.date = $date
            RETURN relation
        `

        const blockQueryOptions = {
            userId: parseInt(userId),
            targetUserId: parseInt(targetUserId),
            date: Date.now()
        }

        let result
        try {
            const queryResponse = await session.run(blockQuery, blockQueryOptions)
            result = queryResponse.records[0]._fields[0].properties
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
            return result
        }
    }

    static async unblock(userId, targetUserId) {
        const session = driver.session({ database: 'neo4j' })

        const blockQuery = `
            MATCH (user:USER)
            WHERE ID(user) = $userId
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            MATCH (user)-[relation:BLOCK]->(targetUser)
            DELETE relation
        `

        const blockQueryOptions = {
            userId: parseInt(userId),
            targetUserId: parseInt(targetUserId)
        }

        try {
            await session.run(blockQuery, blockQueryOptions)
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
        }
    }
}

module.exports = User