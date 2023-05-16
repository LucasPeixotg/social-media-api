const driver = require("../config/dbDriver").getConnection()
require('dotenv').config
const DATABASE = process.env.DATABASE

/*
	TODO: 
	[ ] REFACTOR getById
		* needs to get like messages (liked by user1, user2 and 25 others)
	[ ] CHECK AND ALLOWS ONLY THE CURRENT USER TO INSERT
	[ ] REFACTOR insert SO IT CAN SAVE MEDIA
	[ ] REFACTOR getRelevant, IT SHOULD:
		1 - get friends posts
		2 - get posts liked by friends
		THE QUERY RETURNS ID AND THEN THE METHOD getById IS USED AUTOMATICALLY
*/

// the post controller is a class that allows multiple actions on the database
// it only has post related actions
class PostController {
	constructor() {
		this.session = driver.session({ database: DATABASE })
	}

	// READ METHODS
	async getAuthorId(postId) {
		const query = `
			MATCH (user:USER) -[:PUBLISH]-> (post:POST)
			WHERE ID(post)=$postId
			RETURN ID(user)
		`

		let result
		try {
			const rawResult = await session.run(query, { postId })

			if (!rawResult.records[0]) return null

			result = rawResult.records[0]._fields[0].low
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	async getById(postId) {
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

		let result
		try {
			const rawResult = await session.run(query, { postId })

			result = rawResult.records.map((record) => {
				const likes = record._fields[0].likes.map((like) => {
					return {
						id: like.identity.low,
						username: like.properties.username,
					}
				})

				return {
					id: record._fields[0].id.low,
					date: record._fields[0].date,
					content: record._fields[0].content,
					author: record._fields[0].author,
					authorId: record._fields[0].authorId.low,
					likes: likes,
					images: record._fields[0].images,
				}
			})
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	async getRelevant(userId) {
		const query = `
			MATCH (user:USER) -[relation:FOLLOWS]-> (following:USER)
			WHERE ID(user)=$userId AND (relation.accepted OR following.privacyStatus='public')
			MATCH (following) -[publish:PUBLISH]-> (post) -[:CONTAINS]-> (image:IMAGE)
			WITH following, publish, post, collect(image.url) AS images
			RETURN {
				id: ID(post),
				author: following.username,
				authorId: ID(following),
				date: publish.date,
				content: post.content,
				images: images
			}
			ORDER BY publish.date DESC
			LIMIT 5
		`

		let result
		try {
			const rawResult = await session.run(query, { userId })

			result = rawResult.records.map((record) => {
				return {
					author: record._fields[0].author,
					authorId: record._fields[0].authorId.low,
					id: record._fields[0].id.low,
					content: record._fields[0].content,
					date: record._fields[0].date,
					images: record._fields[0].images,
				}
			})
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	// CREATE METHODS
	async insert(post) {
		const query = `
            MATCH (user:USER) WHERE ID(user) = $userId
            CREATE (user) -[relation:PUBLISH]-> (post:POST)
            SET post.content = $content
            SET relation.date = $date
            WITH post
            UNWIND $mediaUrls AS url
            CALL {
              WITH post
              CREATE (post) -[:CONTAINS]-> (media:MEDIA)
              SET media.url = 'post-' + ID(post) + '-' + ID(media)
              RETURN media.url AS mediaUrl
            } 
            WITH mediaUrl
            RETURN imageUrl
          `

		const options = {
			date: Date.now(),
			content: post.content,
			mediaUrls: [],
			userId: post.author,
		}

		// insert placeholder as image urls
		for (let i = 0; i < imageCount; i++) {
			options.imageUrls.push("a")
		}

		let result
		try {
			const rawResult = await session.run(query, options)

			result = rawResult.records.map((record) => {
				return record._fields[0]
			})
		} catch (error) {
			console.error(error)
		} finally {
			return result
		}
	}

	async createLikeRelationship(userId, postId) {
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
			userId: userId,
			postId: postId,
			date: Date.now(),
		}

		let result
		try {
			const rawResult = await session.run(query, options)

			result = rawResult.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
		} finally {
			return result
		}
	}

	async createDislikeRelationship(userId, postId) {
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

		const options = {
			userId: userId,
			postId: postId,
			date: Date.now(),
		}

		let result
		try {
			const rawResult = await session.run(query, options)

			result = rawResult.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
		} finally {
			return result
		}
	}

}

// Exports an instance of post controller so that it's not created multiple times
// For a better understand about this search for "singleton pattern"
module.exports = new PostController()