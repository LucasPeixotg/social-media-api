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

module.exports = {
    isValidPost
}