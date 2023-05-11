const driver = require("../config/dbDriver").getConnection()

class Post {
	static async insert(userId, post) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (user:USER) WHERE ID(user) = $userId
            CREATE (user) -[relation:PUBLISH]-> (post:POST)
            SET post.content = $content
            SET relation.date = $date
            WITH post
            UNWIND $imageUrls AS url
            CALL {
              WITH post
              CREATE (post) -[:CONTAINS]-> (image:IMAGE)
              SET image.url = 'post-' + ID(post) + '-' + ID(image)
              RETURN image.url AS image_url
            } 
            WITH image_url
            RETURN image_url
          `

		const { content, imageCount } = post
		const options = {
			date: Date.now(),
			content,
			imageUrls: [],
			userId: parseInt(userId),
		}

		for (let i = 0; i < imageCount; i++) {
			options.imageUrls.push("a")
		}

		let result
		try {
			const response = await session.run(query, options)

			result = response.records.map((record) => {
				return record._fields[0]
			})
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
			return result
		}
	}

	static async getById(id) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (post:POST)
            WHERE ID(post)=$id
        `
	}

	static async like(userId, postId) {
		const session = driver.session({ database: "neo4j" })

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
			date: Date.now(),
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

	static async dislike(userId, postId) {
		const session = driver.session({ database: "neo4j" })

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
			date: Date.now(),
		}

		let result
		try {
			const response = await session.run(query, queryOptions)

			result = response.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
			return result
		}
	}

	static async getAuthorId(postId) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (user:USER) -[:PUBLISH]-> (post:POST)
            WHERE ID(post)=$postId
            RETURN ID(user)
        `

		const queryOptions = {
			postId: parseInt(postId),
		}

		let result
		try {
			const response = await session.run(query, queryOptions)

			if (!response.records[0]) return undefined

			result = response.records[0]._fields[0].low
		} catch (error) {
			console.error(error)
			return undefined
		} finally {
			await session.close()
			return result
		}
	}

	static async getById(postId) {
		const session = driver.session({ database: "neo4j" })

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
			postId: parseInt(postId),
		}

		let result
		try {
			const response = await session.run(query, options)

			result = response.records.map((record) => {
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
			await session.close()
			return result
		}
	}

	static async getRelevant(userId) {
		const session = driver.session({ database: "neo4j" })

		/** TODO:
		 * send posts liked by friends if friends posts were already shown
		 * send like messages (liked by user1, user2 and 25 others)
		 */
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

		const options = {
			userId: parseInt(userId),
		}

		let result
		try {
			const response = await session.run(query, options)

			result = response.records.map((record) => {
				return {
					author: record._fields[0].author,
					authorId: record._fields[0].authorId.low,
					id: record._fields[0].id.low,
					content: record._fields[0].content,
					date: record._fields[0].date,
					images: record._fields[0].images,
				}
			})
			console.log("RESULT l240: ", result)
		} catch (error) {
			console.error(error)
			return null
		} finally {
			await session.close()
			return result
		}
	}
}

module.exports = Post
