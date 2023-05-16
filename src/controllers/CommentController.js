const driver = require("../config/dbDriver").getConnection()
require('dotenv').config
const DATABASE = process.env.DATABASE

/*
	TODO: 
	[ ] 
*/

// the CommentController is a class that allows multiple actions on the database
// it only has comment related actions
class CommentController {
	constructor() {
		this.session = driver.session({ database: DATABASE })
	}


	async insert(comment) {
		const session = driver.session({ database: "neo4j" })

		console.log("ok")
		const query = `
            MATCH (user:USER) WHERE ID(user)=$userId
            MATCH (post:POST) WHERE ID(post)=$postId
            MERGE (user)-[publish:PUBLISH]->(comment:COMMENT)-[:COMMENTS]->(post)
            SET publish.date=$date
            SET comment.content=$content
            RETURN comment
        `

		const queryOptions = {
			userId: parseInt(userId),
			postId: parseInt(postId),
			content,
			date: Date.now(),
		}

		let result
		try {
			const queryResponse = await session.run(query, queryOptions)
			result = queryResponse.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
			return result
		}
	}

	async commentComment(userId, commentId, content) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (user:USER) WHERE ID(user)=$userId
            MATCH (c:COMMENT) WHERE ID(c)=$commentId
            CREATE (user)-[publish:PUBLISH]->(comment:COMMENT)-[:COMMENTS]->(c)
            SET publish.date=$date
            SET comment.content=$content
            RETURN comment
        `

		const queryOptions = {
			userId: parseInt(userId),
			commentId: parseInt(commentId),
			content,
			date: Date.now(),
		}

		let result
		try {
			const queryResponse = await session.run(query, queryOptions)
			result = queryResponse.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
			return result
		}
	}

	async getComments(postId) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (user:USER) -[:PUBLISH] -> (comment:COMMENT) -[:COMMENTS]-> (post:POST)
            WHERE ID(post)=$postId
            RETURN { id: ID(comment), content: comment.content, author: user.username, authorId: ID(user)} 
        `

		const queryOptions = {
			postId: parseInt(postId),
		}

		let result
		try {
			const response = await session.run(query, queryOptions)

			result = response.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					author: record._fields[0].author,
					authorId: record._fields[0].authorId.low,
					content: record._fields[0].content,
				}
			})
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
			return result
		}
	}
}

// Exports an instance of CommentController so that it's not created multiple times
// For a better understand about this search for "singleton pattern"
module.exports = new CommentController()
