const router = require("express").Router()
const path = require("path")

const Post = require("../database/Post")
const { isValidPost } = require("../utils/post")

/*
GET routes
*/
// get most relevant posts
router.get("/relevant", async (req, res) => {
	try {
		const posts = await Post.getRelevant(req.user._id)

		return res.status(200).json(posts)
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: "Could not get relevant posts" })
	}
})

// get specific post
router.get("/", async (req, res) => {
	const { id } = req.body

	if (id === undefined) return res.status(400).json({ message: "Bad request" })

	try {
		const post = await Post.getById(id)

		if (!post) return res.status(404).json({ message: "Post don't exist" })

		return res.status(200).json(post)
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: "Could not get post" })
	}
})

/*
POST routes
*/
// create post
router.post("/", async (req, res) => {
	const { content } = req.body
	const { images } = req.files

	console.log("IMAGES - \n", images)

	/*if (!isValidPost({ content })) {
        return res.status(400).json({ message: 'Bad request' })
    }*/

	let result
	try {
		result = await Post.insert(req.user._id, {
			content,
			imageCount: images.length,
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: "Could not create post" })
	} finally {
		for (let i = 0; i < images.length; i++) {
			let filedir = path.normalize(path.join(__dirname, "../../upload/"))
			filedir = path.join(filedir, result[i] + path.extname(images[i].name))
			images[i].mv(filedir)
		}

		res.status(200).json(result)
	}
})

// like post
router.post("/like", async (req, res) => {
	const { id } = req.body

	if (id === undefined) return res.status(400).json({ message: "Bad request" })

	try {
		const result = await Post.like(req.user._id, id)
		return res.status(200).json(result)
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: "Could not like post" })
	}
})

// dislike post
router.post("/dislike", async (req, res) => {
	const { id } = req.body

	if (id === undefined) return res.status(400).json({ message: "Bad request" })

	try {
		const result = await Post.dislike(req.user._id, id)
		return res.status(200).json(result)
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: "Could not dislike post" })
	}
})

/*
DELETE routes
*/
// delete post
router.delete("/", (req, res) => {})

// remove like
router.delete("/like", (req, res) => {})

// remove dislike
router.delete("/dislike", (req, res) => {})

/*
PUT routes
*/
// edit comment
router.put("/comment", (req, res) => {})

// edit post
router.put("/:id", (req, res) => {})

module.exports = router
