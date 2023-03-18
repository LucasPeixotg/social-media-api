const driver = require('../config/dbDriver').getConnection()

class Post {
    static async insert(userId, post) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            CREATE (post:POST)
            SET post.content = $content
            FOREACH (url in $imageUrls |
                CREATE (image:IMAGE)
                SET image.url = url
                CREATE (post) -[:CONTAINS]-> (image)
            )
            WITH post
            MATCH (user:USER) WHERE ID(user) = $userId
            CREATE (user)-[relation:PUBLISH]->(post)
            SET relation.date = $date
            RETURN post
        `

        let result
        try {
            const { content, imageUrls } = post

            const queryOptions = {
                date: Date.now(),
                content,
                imageUrls,
                userId: parseInt(userId)
            }

            const queryResponse = await session.run(query, queryOptions)

            result = queryResponse.records[0]._fields[0].properties
        } catch (error) {
            console.error(error)
        } finally {
            await session.close()
            return result
        }
    }

    static async getById(id) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            MATCH (post:POST)
            WHERE ID(post)=$id
        `
    }

    static async like(userId, postId) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            MATCH (user:USER)
            WHERE ID(user)=$userId
            MATCH (post:POST)
            WHERE ID(post)=$postId
            MERGE (user)-[like:LIKES]->(post)
            SET like.date=$date
            WITH like, user, post
            MATCH (user)-[dislike:DISLIKES]->(post)
            DELETE dislike
            RETURN like
        `

        const queryOptions = {
            userId: parseInt(userId),
            postId: parseInt(postId),
            date: Date.now()
        }

        let result
        try {
            const queryResponse = await session.run(query, queryOptions)

            result = queryResponse.records[0]._fields[0].properties
        } catch(error) {
            console.error(error)
        } finally {
            await session.close()
            return result
        }
    }

    static async dislike(userId, postId) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            MATCH (user:USER)
            WHERE ID(user)=$userId
            MATCH (post:POST)
            WHERE ID(post)=$postId
            MERGE (user)-[dislike:DISLIKES]->(post)
            SET dislike.date=$date
            WITH dislike, user, post
            MATCH (user)-[like:LIKES]->(post)
            DELETE like
            RETURN dislike
        `

        const queryOptions = {
            userId: parseInt(userId),
            postId: parseInt(postId),
            date: Date.now()
        }

        let result
        try {
            const queryResponse = await session.run(query, queryOptions)

            result = queryResponse.records[0]._fields[0].properties
        } catch(error) {
            console.error(error)
        } finally {
            await session.close()
            return result
        }
    }

    static async getAuthorId(postId) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            MATCH (user:USER) -[:PUBLISH]-> (post:POST)
            WHERE ID(post)=$postId
            RETURN ID(user)
        `

        const queryOptions = {
            postId: parseInt(postId)
        }

        let result
        try {
            const queryResponse = await session.run(query, queryOptions)

            if(!queryResponse.records[0]) return undefined

            result = queryResponse.records[0]._fields[0].low
        } catch(error) {
            console.error(error)
            return undefined
        } finally {
            await session.close()
            return result
        }
    }

}

module.exports = Post