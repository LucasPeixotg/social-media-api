const SESSION = require("../config/dbDriver").getConnection()

/*
	TODO: 
	[ ] ADD THE METHOD createLikeRelationship
	[ ] ADD THE METHOD removeLikeRelationship
*/

// the CommentController is a class that allows multiple actions on the database
// it only has comment related actions
class CommentController {
	static async insert(comment) {
		console.log("ok")
		const query = `
            MATCH (user:USER) WHERE ID(user)=$userId
            MATCH (post:POST) WHERE ID(post)=$postId
            MERGE (user)-[publish:PUBLISH]->(comment:COMMENT)-[:COMMENTS]->(post)
            SET publish.date=$date
            SET comment.content=$content
            RETURN comment
        `

		const options = {
			userId: comment.author,
			postId: comment.post,
			content: comment.content,
			date: Date.now(),
		}

		let result
		try {
			const rawResult = await SESSION.run(query, options)
			result = rawResult.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	// FOR NOW THERE WILL BE NO WAY TO COMMENT A COMMENT
	/*
	static async commentComment(userId, commentId, content) {
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
			return result
		}
	}*/

	static async get(postId) {
		const query = `
            MATCH (user:USER) -[:PUBLISH] -> (comment:COMMENT) -[:COMMENTS]-> (post:POST)
            WHERE ID(post)=$postId
            RETURN { id: ID(comment), content: comment.content, author: user.username, authorId: ID(user)} 
        `

		const options = {
			postId: parseInt(postId),
		}

		let result
		try {
			const rawResult = await SESSION.run(query, options)

			result = rawResult.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					author: record._fields[0].author,
					authorId: record._fields[0].authorId.low,
					content: record._fields[0].content,
				}
			})
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}
}

module.exports = CommentController
