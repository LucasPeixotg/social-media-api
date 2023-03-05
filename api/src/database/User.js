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
                RETURN user`

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
        try {
            const query = `MATCH (user:USER)
                WHERE user.username = $username
                RETURN user LIMIT 1
            `

            const queryResult = await session.run(query, { username })

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

        let result
        try {
            const queryTargetUserPrivacyStatus = `
                MATCH (u:USER) 
                RETURN u
            `

            const queryPrivacyResult = await session.run(queryTargetUserPrivacyStatus)
            const privacyStatus = queryPrivacyResult.records[0]._fields[0].properties.privacyStatus

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

        let result
        try {
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

        try {
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

            await session.run(removeQuery, removeQueryOptions)
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
        }
    }
}

module.exports = User

/*
(async() => {
    const neo4j = require('neo4j-driver');

    const uri = 'neo4j+s://0ddbde06.databases.neo4j.io';
    const user = '<Username for Neo4j Aura instance>';
    const password = '<Password for Neo4j Aura instance>';
    
    // To learn more about the driver: https://neo4j.com/docs/javascript-manual/current/client-applications/#js-driver-driver-object
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    try {
        const person1Name = 'Alice';
        const person2Name = 'David';

        await createFriendship(driver, person1Name, person2Name);

        await findPerson(driver, person1Name);
        await findPerson(driver, person2Name);
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
    } finally {
        // Don't forget to close the driver connection when you're finished with it.
        await driver.close();
    }

    async function createFriendship (driver, person1Name, person2Name) {

        // To learn more about sessions: https://neo4j.com/docs/javascript-manual/current/session-api/
        const session = driver.session({ database: 'neo4j' });

        try {
            // To learn more about the Cypher syntax, see: https://neo4j.com/docs/cypher-manual/current/
            // The Reference Card is also a good resource for keywords: https://neo4j.com/docs/cypher-refcard/current/
            const writeQuery = `MERGE (p1:Person { name: $person1Name })
                                MERGE (p2:Person { name: $person2Name })
                                MERGE (p1)-[:KNOWS]->(p2)
                                RETURN p1, p2`;

            // Write transactions allow the driver to handle retries and transient errors.
            const writeResult = await session.executeWrite(tx =>
                tx.run(writeQuery, { person1Name, person2Name })
            );

            // Check the write results.
            writeResult.records.forEach(record => {
                const person1Node = record.get('p1');
                const person2Node = record.get('p2');
                console.info(`Created friendship between: ${person1Node.properties.name}, ${person2Node.properties.name}`);
            });

        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            // Close down the session if you're not using it anymore.
            await session.close();
        }
    }

    async function findPerson(driver, personName) {

        const session = driver.session({ database: 'neo4j' });

        try {
            const readQuery = `MATCH (p:Person)
                            WHERE p.name = $personName
                            RETURN p.name AS name`;
            
            const readResult = await session.executeRead(tx =>
                tx.run(readQuery, { personName })
            );

            readResult.records.forEach(record => {
                console.log(`Found person: ${record.get('name')}`)
            });
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }
})();
*/