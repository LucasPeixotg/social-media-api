randomBytes = require('crypto').randomBytes

const isValidPost = (post) => {
    try {
        if(typeof post.content != 'string') return false
        if(typeof post.imageUrls != 'object') return false
        
        console.log("ok")
        return true
    } catch(error) {
        return false
    }
}

const genImageFileName = (postId, ImageId) => randomBytes(10).toString() + '-' + postId + '-' + ImageId

module.exports = {
  isValidPost,
  genImageFileName,
}
