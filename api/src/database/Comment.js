const driver = require('../config/dbDriver').getConnection()

class Comment {
    static async commentPost(userId, postId, content) {
        const session = driver.session({ database: 'neo4j' })
    
        const query = `
            MATCH (user:USER)
            WHERE ID(user)=$userId
            MERGE (user)-[publish:PUBLISH]->(comment:COMMENT)
            SET comment.content=$content
            SET publish.date=$date
            WITH comment
            MATCH (post:POST)
            WHERE ID(post)=$postId
            MERGE (comment) -[:COMMENTS]-> (post)
            RETURN comment
        `
    
        const queryOptions = {
            userId: parseInt(userId),
            postId: parseInt(postId),
            content,
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

    static async commentComment(userId, commentId, content) {
        const session = driver.session({ database: 'neo4j' })

        const query = `
            MATCH (user:USER)
            WHERE ID(user)=$userId
            MERGE (user)-[publish:PUBLISH]->(comment:COMMENT)
            SET comment.content=$content
            SET publish.date=$date
            WITH comment
            MATCH (target:COMMENT)
            WHERE ID(target)=$commentId
            MERGE (comment) -[:COMMENTS]-> (target)
            RETURN comment
        `

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
}

module.exports = Comment
