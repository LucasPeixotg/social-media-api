const router = require('express').Router()
const Comment = require('../database/Comment')


/*
GET routes
*/
//get comments on a comment
router.get('/comment/:id')

// get comments on a post
router.get('/:id', (req, res) => { })


/*
POST routes
*/
// comment on a comment
router.post('/comment/:id', (req, res) => { })

// comment on a post
router.post('/:id', (req, res) => { })


module.exports = router
