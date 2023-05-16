const driver = require("../config/dbDriver").getConnection()
require('dotenv').config
const DATABASE = process.env.DATABASE

/*
	TODO: 
	[ ] REFACTOR addBlockRelationship AND removeBlockRelationship METHOD
	[ ] RETHINK AND REFACTOR areFriendsOrPublic
	[ ] RETHINK AND REFACTOR getRequests
	[ ] SEARCH BETTER ALGORITHMS THAN "levenshteinDistance" ON THE search METHOD
*/

// the UserController is a class that allows multiple actions on the database
// it only has user related actions
class UserController {
	constructor() {
		this.session = driver.session({ database: DATABASE })
	}

	// READ METHODS
	async getByUsername(username) {
		const query = `
		MATCH (user:USER)
		WHERE user.username = $username
		RETURN user LIMIT 1
		`

		let result
		try {
			const rawResult = await this.session.run(query, { username })

			result = {
				_id: rawResult.records[0]._fields[0].identity.low,
				...rawResult.records[0]._fields[0].properties,
			}
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	async getFriends(userId) {
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
			const response = await this.session.run(query, queryOptions)

			result = response.records.map((record) => {
				return {
					id: record._fields[0].id.low,
					username: record._fields[0].username,
					mutual: record._fields[0].mutual,
					sender: record._fields[0].sender,
				}
			})
		} catch (error) {
			console.error(error)
			return null
		} finally {
			return result
		}
	}

	async getRequests(userId) {
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
			const response = await this.session.run(query, queryOptions)
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
			return result
		}
	}

	async search(username) {
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
			const response = await this.session.run(query, options)
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
			return result
		}
	}

	async areFriendsOrPublic(userId, targetId) {
		const queryPrivacyStatus = `
            MATCH (user:USER)
            WHERE ID(user)=$targetId
            RETURN user.privacyStatus
        `

		let privacyStatus
		try {
			const queryPrivacyStatusResponse = await this.session.run(queryPrivacyStatus, {
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
			const queryFriendsResponse = await this.session.run(queryFriends, queryOptions)

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
	async insert(user) {
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
			const rawResult = await this.session.run(query, {
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

	async addBefriendRelationship(userId, friendId, mutual) {
		const query = `
            MATCH (user:USER)
            WHERE ID(user) = $userId 
            MATCH (friend:USER)
            WHERE ID(friend) = $friendId
            MERGE (user)<-[relation:BEFRIENDS]->(friend)
			SET relation.mutual = $mutual
			SET relation.sender = $sender
            RETURN { relation: type(relation), accepted: relation.accepted }
        `

		const options = {
			userId: parseInt(userId),
			friendId: parseInt(friendId),
			mutual: mutual,
			sender: parseInt(userId),
		}

		let result
		try {
			result = await this.session.run(query, options)
		} catch (error) {
			console.error(error)
		} finally {
			return result.records[0]._fields[0]
		}
	}

	async removeBefriendRelationship(userId, friendsId) {
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
			await this.session.run(query, options)
		} catch (error) {
			console.error(error)
		}
	}

	async addBlockRelationship(userId, targetUserId) {
		const blockQuery = `
            MATCH (user:USER)
            WHERE ID(user) = $userId
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            MERGE (user)-[relation:BLOCKS]->(targetUser)
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
			const queryResponse = await this.session.run(blockQuery, blockQueryOptions)
			result = queryResponse.records[0]._fields[0].properties
		} catch (error) {
			console.error(error)
		} finally {
			return result
		}
	}

	async removeBlockRelationship(userId, blockedUser) {
		const blockQuery = `
            MATCH (user:USER)
            WHERE ID(user) = $userId
            MATCH (targetUser:USER)
            WHERE ID(targetUser) = $targetUserId
            MATCH (user)-[relation:BLOCKS]->(targetUser)
            DELETE relation
        `

		const blockQueryOptions = {
			userId: parseInt(userId),
			targetUserId: parseInt(blockedUser),
		}

		try {
			await this.session.run(blockQuery, blockQueryOptions)
		} catch (error) {
			console.error(error)
		}
	}
}

// Exports an instance of the user controller so that it's not created multiple times
// For a better understand about this search for "singleton pattern"
module.exports = new UserController()
