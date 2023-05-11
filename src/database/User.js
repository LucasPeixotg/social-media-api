const driver = require("../config/dbDriver").getConnection()

class User {
	static async insert(user) {
		const session = driver.session({ database: "neo4j" })

		let result
		try {
			const { username, hash } = user

			const query = `
                CREATE (user:USER {
                    date: $date,
                    privacyStatus: 'private',
                    birthday: $birthday,
                    username: $username,
                    hash: $hash
                })
                RETURN user
            `

			await session.executeWrite((tx) => {
				result = tx.run(query, {
					date: Date.now(),
					birthday: "",
					username,
					hash,
				})
			})
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
			return result
		}
	}

	static async findByUsername(username) {
		const session = driver.session({ database: "neo4j" })

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
				...queryResult.records[0]._fields[0].properties,
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
		const session = driver.session({ database: "neo4j" })

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
			date: Date.now(),
		}

		let result
		try {
			const queryPrivacyResult = await session.run(queryTargetUserPrivacyStatus)
			const privacyStatus =
				queryPrivacyResult.records[0]._fields[0].properties.privacyStatus

			if (privacyStatus == "private") {
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
		const session = driver.session({ database: "neo4j" })

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
			date: Date.now(),
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

	static async getFollowers(userId) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (follower:USER) -[follow:FOLLOWS]-> (user:USER)
            WHERE ID(user)=$userId
            WITH follower, user, follow
            OPTIONAL MATCH (user) -[relation:FOLLOWS] -> (follower)
            RETURN {
                id: ID(follower),
                username: follower.username,
                accepted: follow.accepted,
                followBack: relation IS NOT NULL
            }
        `

		const queryOptions = {
			userId: parseInt(userId),
		}

		let result
		try {
			const response = await session.run(query, queryOptions)

			result = response.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					accepted: record._fields[0].accepted,
					followBack: record._fields[0].followBack,
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

	static async getFollowing(userId) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (user:USER) -[follow:FOLLOWS]-> (following:USER)
            WHERE ID(user) = $userId
            WITH user, follow, following
            OPTIONAL MATCH (following) -[relation:FOLLOWS]->(user)
            RETURN {
                id: ID(following),
                username: following.username,
                accepted: follow.accepted,
                followBack: relation IS NOT NULL,
                followBackAccepted: relation.accepted
            }
        `

		const queryOptions = {
			userId: parseInt(userId),
		}

		let result
		try {
			const response = await session.run(query, queryOptions)
			console.log("User.js : LINE 198: \n", response.records)
			result = response.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					accepted: record._fields[0].accepted,
					followBack: record._fields[0].followBack,
					followBackAccepted: record._fields[0].followBackAccepted,
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

	static async removeFollower(userId, followerId) {
		const session = driver.session({ database: "neo4j" })

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
			followerId: parseInt(followerId),
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
		const session = driver.session({ database: "neo4j" })

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
			date: Date.now(),
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
		const session = driver.session({ database: "neo4j" })

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
			targetUserId: parseInt(targetUserId),
		}

		try {
			await session.run(blockQuery, blockQueryOptions)
		} catch (error) {
			console.error(error)
		} finally {
			await session.close()
		}
	}

	static async search(username) {
		const session = driver.session({ database: "neo4j" })

		const query = `
            MATCH (user:USER)
            WITH user, apoc.text.levenshteinDistance(user.username, $username) AS score
            RETURN {
                id: ID(user),
                username: user.username,
                privacyStatus: user.privacyStatus
            }
            ORDER BY score
            LIMIT 5
        `

		const options = { username }

		let result
		try {
			const response = await session.run(query, options)
			result = response.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					privacyStatus: record._fields[0].privacyStatus,
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

	static async areFriendsOrPublic(userId, targetId) {
		const session = driver.session({ database: "neo4j" })

		const queryPrivacyStatus = `
            MATCH (user:USER)
            WHERE ID(user)=$targetId
            RETURN user.privacyStatus
        `

		let privacyStatus
		try {
			const queryPrivacyStatusResponse = await session.run(queryPrivacyStatus, {
				targetId: parseInt(targetId),
			})
			privacyStatus = queryPrivacyStatusResponse.records[0]._fields[0]
		} catch (error) {
			console.error(error)
			return false
		} finally {
			if (privacyStatus == "public") {
				await session.close()
				return true
			}
		}

		console.log("privacy status: ", privacyStatus)

		const queryFriends = `
            MATCH (user:USER) -[relation:FOLLOWS]-> (targetUser:USER)
            WHERE ID(user)=$userId AND ID(targetUser)=$targetId
            RETURN relation.accepted
        `

		const queryOptions = {
			userId: parseInt(userId),
			targetId: parseInt(targetId),
		}

		let accepted
		try {
			const queryFriendsResponse = await session.run(queryFriends, queryOptions)

			if (!queryFriendsResponse.records[0]) {
				return false
			}

			accepted = queryFriendsResponse.records[0]._fields[0]
		} catch (error) {
			console.error(error)
			return false
		} finally {
			await session.close()
			return accepted
		}
	}
}

module.exports = User
