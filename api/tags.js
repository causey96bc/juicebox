const tagsRouter = require('express').Router();
const { getAllTags } = require("../db");
const { getPostsByTagName } = require('../db')
tagsRouter.use((req, res, next) => {
    console.log('a request is being made to /tags.');
    next();
})





tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();
    res.send({ tags });
});

tagsRouter.get('/:tagName/post', async (req, res) => {
    try {
        const { tagName } = req.params
        const allPosts = await getPostsByTagName(tagName);
        const posts = allPosts.filter(post => {
            if (!post.active && !req.user) { return true }
        })
        res.send({
            posts
        })

    } catch ({ name, message }) {
        next({ name: 'tagname error', message: 'error retrieving tags or posts' })
    }

});



module.exports = tagsRouter;