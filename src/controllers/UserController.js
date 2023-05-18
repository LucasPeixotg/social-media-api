const SESSION = require("../config/dbDriver").getConnection()


/*
	TODO: 
	[ ] REFACTOR addBlockRelationship AND removeBlockRelationship METHOD
	[ ] RETHINK AND REFACTOR areFriendsOrPublic
	[ ] RETHINK AND REFACTOR getRequests
	[ ] SEARCH BETTER ALGORITHMS THAN "levenshteinDistance" ON THE search METHOD

	[ ] REFACTOR insert TO RETURN USER MODEL
*/


// the UserController is a class that allows multiple actions on the database
// it only has user related actions
class UserController {
	// READ METHODS
	static async getByUsername(username) {
		const query = `
			MATCH (user:USER)
			WHERE user.username = $username
			RETURN user LIMIT 1
		`

		let result
		try {
			const rawResult = await SESSION.run(query, { username })

			if (rawResult.records.length != 0)
				result = {
					_id: rawResult.records[0]._fields[0].identity.low,
					...rawResult.records[0]._fields[0].properties,
				}

			return result
		} catch (error) {
			console.error(error)
			return null
		}
	}

	static async getById(id) {
		const query = `
			MATCH (user:USER)
			WHERE ID(user) = $id
			RETURN user
		`

		let result
		try {
			const rawResult = await SESSION.run(query, { id: parseInt(id) })

			if (rawResult.records.length != 0)
				result = {
					_id: rawResult.records[0]._fields[0].identity.low,
					...rawResult.records[0]._fields[0].properties,
				}

			return result
		} catch (error) {
			console.error(error)
			return null
		}
	}

	static async getFriends(userId) {
		const query = `
            MATCH (friend:USER) <-[relation:BEFRIENDS]-> (user:USER)
            WHERE ID(user)=$userId
            RETURN {
                id: ID(friend),
                username: friend.username,
                mutual: relation.mutual,
				sender: relation.sender
            }
        `

		const queryOptions = {
			userId: parseInt(userId),
		}

		let result
		try {
			const response = await SESSION.run(query, queryOptions)

			result = response.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					mutual: record._fields[0].mutual,
					sender: record._fields[0].sender,
				}
			})

			return result
		} catch (error) {
			console.error(error)
			return null
		}
	}

	static async getRequests(userId) {
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
		const options = {
			userId: parseInt(userId),
		}

		let result
		try {
			const rawResult = await SESSION.run(query, options)
			console.log("User.js : LINE 198: \n", rawResult.records)
			result = rawResult.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					accepted: record._fields[0].accepted,
					followBack: record._fields[0].followBack,
					followBackAccepted: record._fields[0].followBackAccepted,
				}
			})

			return result
		} catch (error) {
			console.error(error)
			return null
		}
	}

	static async search(username) {
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
			const rawResult = await SESSION.run(query, options)
			// format result
			result = rawResult.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					privacyStatus: record._fields[0].privacyStatus,
				}
			})

			return result
		} catch (error) {
			console.error(error)
			return null
		}
	}

	static async areFriendsOrPublic(userId, targetId) {
		const queryPrivacyStatus = `
            MATCH (user:USER)
            WHERE ID(user)=$targetId
            RETURN user.privacyStatus
        `

		let privacyStatus
		try {
			const queryPrivacyStatusResponse = await SESSION.run(queryPrivacyStatus, {
				targetId: parseInt(targetId),
			})
			privacyStatus = queryPrivacyStatusResponse.records[0]._fields[0]
		} catch (error) {
			console.error(error)
			return false
		} finally {
			if (privacyStatus == "public") {
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
			const queryFriendsResponse = await SESSION.run(queryFriends, queryOptions)

			if (!queryFriendsResponse.records[0]) {
				return false
			}

			accepted = queryFriendsResponse.records[0]._fields[0]
		} catch (error) {
			console.error(error)
			return false
		} finally {
			return accepted
		}
	}


	// CREATE METHODS
	static async insert(user) {
		const query = `
			CREATE (user:USER {
				username: $username,
				hash: $hash,
				privacyStatus: 'private',
				birthday: $birthday
			})
			RETURN user
		`

		let result
		try {
			const rawResult = await SESSION.run(query, {
				username: user.username,
				hash: user.hash,
				privacyStatus: user.privacyStatus,
				birthday: user.birthday
			})

			result = rawResult
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	static async addBefriendRelationship(userId, friendId, mutual = false) {
		const query = `
            MATCH (user:USER)
            WHERE ID(user) = $userId 
            MATCH (friend:USER)
            WHERE ID(friend) = $friendId
            MERGE (user)-[relation:BEFRIENDS]->(friend)
			SET relation.mutual = $mutual
            RETURN { relation: type(relation), accepted: relation.accepted }
        `

		const options = {
			userId: parseInt(userId),
			friendId: parseInt(friendId),
			mutual: mutual,
		}

		let result
		try {
			result = await SESSION.run(query, options)
		} catch (error) {
			console.error(error)
		} finally {
			return result.records[0]._fields[0]
		}
	}

	static async removeBefriendRelationship(userId, friendsId) {
		const query = `
            MATCH (user:USER)
            WHERE  ID(user) = $userId
            MATCH (friend:USER)
            WHERE ID(friend) = $friendsId
            MATCH (friend) <-[relation:BEFRIENDS]-> (user)
            DELETE relation
        `

		const options = {
			userId: parseInt(userId),
			friendsId: parseInt(friendsId),
		}

		try {
			await SESSION.run(query, options)
		} catch (error) {
			console.error(error)
		}
	}

	static async addBlockRelationship(userId, targetUserId) {
		const query = `
            MATCH (user:USER)
            WHERE ID(user) = $userId
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            MERGE (user)-[relation:BLOCKS]->(targetUser)
            SET relation.date = $date
            RETURN relation
        `

		const options = {
			userId: parseInt(userId),
			targetUserId: parseInt(targetUserId),
			date: Date.now(),
		}

		let result
		try {
			const queryResponse = await SESSION.run(query, options)
			result = queryResponse.records[0]._fields[0].properties

			return result
		} catch (error) {
			console.error(error)
		}
	}

	static async removeBlockRelationship(userId, blockedUser) {
		const query = `
            MATCH (user:USER)
            WHERE ID(user) = $userId
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            MATCH (user)-[relation:BLOCKS]->(targetUser)
            DELETE relation
        `

		const options = {
			userId: parseInt(userId),
			targetUserId: parseInt(blockedUser),
		}

		try {
			await SESSION.run(query, options)
		} catch (error) {
			console.error(error)
		}
	}

	static async acceptFriendshipRequest(userId, friendId) {
		/*
		return true if it's accepted, false if it's not
		*/
		const query = `
			MATCH (friend:USER) -[relation:BEFRIENDS]-> (user:USER)
			WHERE ID(user) = 1 AND ID(friend) = 0
			SET relation.mutual = true
			RETURN friend, user, relation
		`

		const options = {
			userId,
			friendId
		}

		try {
			const rawResult = await SESSION.run(query, options)

			return !!rawResult.records[0]
		} catch (error) {
			console.error(error)
		}
	}
}

module.exports = UserController