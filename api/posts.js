const postsRouter = require('express').Router();
const { getAllPosts, createPost } = require('../db');
const { requireUser } = require('./utils');
const { updatePost } = require('../db');
const { getPostById } = require('../db');
postsRouter.use((req, res, next) => {
    console.log('a request is being made to /posts');
    next();
});
postsRouter.get('/', async (req, res) => {
    try {
        const allPosts = await getAllPosts();
        const posts = allPosts.filter(post => {
            if (post.active) {
                return true
            }
            if (req.user && post.authorId === req.user.id) {
                return true
            } else {
                return false
            }
        })
        res.send({
            posts
        })
    } catch ({ name, message }) {

        next({ name: 'postRejection', message: 'an issue with grqbbing post' })

    }
});
postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;

    const tagArr = tags.trim().split(/\s+/)
    const postData = {};

    // only send the tags if there are some to send
    if (tagArr.length) {
        postData.tags = tagArr;
    }

    try {
        postData.authorId = req.user.id
        postData.title = title;
        postData.content = content
        const post = await createPost(postData)
        if (post) {
            res.send(post)
        } else {
            next({ name: 'post creation error', message: 'there was an error creating a post ' });
        }
        // add authorId, title, content to postData object
        // const post = await createPost(postData);
        // this will create the post and the tags for us
        // if the post comes back, res.send({ post });
        // otherwise, next an appropriate error object 
    } catch ({ name, message }) {
        next({ name, message });
    }
});
postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;
    const updateFields = {};
    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }
    if (title) {
        updateFields.title = title;
    }
    if (content) {
        updateFields.content = content;
    }
    try {
        const originalPost = await getPostById(postId);
        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({ post: updatedPost })
        } else {
            next({ name: 'unauthorizedUserError', message: 'you cannot update a post that is not yours' })
        }
    } catch ({ name, message }) {
        next({ name, message })
    }
});
postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const post = await getPostById(req.params.postId);
        if (post && post.author.id === req.user.id) {
            const updatedPost = await updatePost(post.id, { active: false });
            res.send({ post: updatedPost });
        } else {
            next(post ? {
                name: 'unauthorizedUserError',
                Message: ' you cannot delete a post you didnt make.'
            } : {
                    name: 'postNotFoundError',
                    message: 'that post does not exist'
                })
        }
    } catch ({ namne, message }) {
        next({ name, message })
    }
})



module.exports = postsRouter