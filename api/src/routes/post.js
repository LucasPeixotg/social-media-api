const router = require('express').Router()


/*
GET routes
*/
// get most relevant posts
router.get('/', (req, res) => { })

// get comments
router.get('/comment/:id', (req, res) => { })

// get specific post
router.get('/:id', (req, res) => { })


/*
POST routes
*/
// create post
router.post('/', (req, res) => { })


// like post
router.post('/like', (req, res) => { })

// dislike post
router.post('/dislike', (req, res) => { })

// comment on post
router.post('/comment', (req, res) => { })


/*
DELETE routes
*/
// delete post
router.delete('/', (req, res) => { })

// remove like
router.delete('/like', (req, res) => { })

// remove dislike
router.delete('/dislike', (req, res) => { })

// delete comment
router.delete('/comment')


/*
PUT routes
*/
// edit comment
router.put('/comment', (req, res) => { })

// edit post
router.put('/:id', (req, res) => { })


module.exports = router