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
        
        const { content, imageUrls } = post
        const options = {
            date: Date.now(),
            content,
            imageUrls,
            userId: parseInt(userId)
        }

        let result
        try {


            const response = await session.run(query, options)

            result = response.records[0]._fields[0].properties
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

        const options = {
            userId: parseInt(userId),
            postId: parseInt(postId),
            date: Date.now()
        }

        let result
        try {
            const response = await session.run(query, options)

            result = response.records[0]._fields[0].properties
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
            const response = await session.run(query, queryOptions)

            result = response.records[0]._fields[0].properties
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
            const response = await session.run(query, queryOptions)

            if(!response.records[0]) return undefined

            result = response.records[0]._fields[0].low
        } catch(error) {
            console.error(error)
            return undefined
        } finally {
            await session.close()
            return result
        }
    }

    static async getById(postId) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            MATCH (author:USER) -[publish:PUBLISH]-> (post:POST)
            WHERE ID(post)=$postId
            OPTIONAL MATCH (user:USER) -[like:LIKES]-> (post)
            OPTIONAL MATCH (post) -[:CONTAINS]-> (image:IMAGE)
            WITH author, post, publish, collect(image.url) AS images, collect(user) AS likes
            RETURN {
                id: ID(post),
                date: publish.date,
                content: post.content,
                images: images,
                likes: likes,
                author: author.username,
                authorId: ID(author)
            }
        `

        const options = {
            postId: parseInt(postId)
        }

        let result
        try {
            const response = await session.run(query, options)

            result = response.records.map(record => {
                const likes = record._fields[0].likes.map(like => {
                    return {
                        id: like.identity.low,
                        username: like.properties.username
                    }
                })

                return {
                    id: record._fields[0].id.low,
                    date: record._fields[0].date,
                    content: record._fields[0].content,
                    author: record._fields[0].author,
                    authorId: record._fields[0].authorId.low,
                    likes: likes,
                    images: record._fields[0].images
                }
            })

        } catch(error) {
            console.error(error)
            return null
        } finally {
            await session.close()
            return result
        }
    }

}

module.exports = Post