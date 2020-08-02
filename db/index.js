const { Client } = require('pg') // imports the pg module

const client = new Client(process.env.DATABASE_URL || 'postgres://localhost:5432/juicebox-dev');

/**
 * USER Methods
 */
// create user 
// creates a user and inputs it into the database. 
// expects fields to be filled out. 
// VALUES has to match order of the array.
// these return values are then stored into a variable.
async function createUser({
    username,
    password,
    name,
    location
}) {
    try {
        const { rows: [user] } = await client.query(`
      INSERT INTO users(username, password, name, location) 
      VALUES($1, $2, $3, $4) 
      ON CONFLICT (username) DO NOTHING 
      RETURNING *;
    `, [username, password, name, location]);

        return user;
    } catch (error) {
        throw error;
    }
}
// fields is an object that will get updated based on the value that is put inside the test.
//{
//  name: "Newname Sogood",
//  location: "Lesterville, KY"
//}
async function updateUser(id, fields = {}) {
    // build the set string
    // Object.keys(feilds) = [name, location]
    /*
    const setString = [name, location].map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');
    setString = ["name"=1, "location"=2]
    */
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    // return early if this is called without fields
    if (setString.length === 0) {
        return;
    }
    // deconstructs the row array into a user object that can be returned 
    // the "setstring" updates the fields that are mapped above based on
    // the user input.
    try {
        const { rows: [user] } = await client.query(`
      UPDATE users
      SET ${ setString}
      WHERE id=${ id}
      RETURNING *;
    `, Object.values(fields));

        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    // grabs all the users from the database
    try {
        const { rows } = await client.query(`
      SELECT id, username, name, location, active 
      FROM users;
    `);

        return rows;
    } catch (error) {
        throw error;
    }
}
async function getAllTags() {
    try {
        const { rows } = await client.query(`SELECT *
        FROM tags;`);
        return rows;
    } catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    try {
        // grabs the user by the "userId"
        // that is made inside our seed.js/50
        const { rows: [user] } = await client.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${ userId}
    `);
        // if there is no user there will not be a userid so return null
        if (!user) {
            return null
        }
        // sets the userobject to the posts and the call the getpost by the user while passing in userid?
        user.posts = await getPostsByUser(userId);

        return user;
    } catch (error) {
        throw error;
    }
}

/**
 * POST Methods
 */
// creates the post by populating the defined fields and now the tag OBJ
async function createPost({
    authorId,
    title,
    content,
    tags = []
}) {
    try {
        //deconstructs the rows into post creates a query that will inside the values into the database.
        const { rows: [post] } = await client.query(`
      INSERT INTO posts("authorId", title, content) 
      VALUES($1, $2, $3)
      RETURNING *;
    `, [authorId, title, content]);
        //updates the tags defined in create tags it also will assign a tag Id to a post. 
        const taglist = await createTags(tags);
        return await addTagsToPost(post.id, taglist);
    } catch (error) {
        throw error;
    }
}
async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }
    // maps the taglist into an array of items that can be returned with a constantly updating index.
    // inserts the newly mapped/created values into the databse and selects them when a new tag is created. 
    const insertValues = tagList.map(
        (_, index) => `$${index + 1}`).join('), (');
    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`).join(', ');
    try {
        await client.query(`
    INSERT INTO tags(name)
        VALUES (${insertValues})
            ON CONFLICT (name) DO NOTHING;`, tagList);



        const { rows } = await client.query(`  SELECT * FROM tags
        WHERE name
            IN  (${selectValues});
    `, tagList);
        return rows
    } catch (error) {
        throw error;
    }
}
// adds the newly created tag and associated it with the post giving it a postID and a tagID
async function createPostTag(postId, tagId) {
    try {
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
      `, [postId, tagId]);
    } catch (error) {
        throw error;
    }
}



// after associating a tag to a post now we actually attach it to a users post and we give it an id
// we map the taglist into an new array returning by the create posttag function. while also assigning Id's to both.

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );

        await Promise.all(createPostTagPromises);

        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}

async function updatePost(postId, fields = {}) {
    // read off the tags & remove that field 
    // the fields are being updated by previous defined post fields.
    // essentially recreates the functionlaity of update user by creating a new fields array 
    // and inserting those values into the database.
    const { tags } = fields; // might be undefined
    delete fields.tags;

    // build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    try {
        // update any fields that need to be updated
        if (setString.length > 0) {
            await client.query(`
          UPDATE posts
          SET ${ setString}
          WHERE id=${ postId}
          RETURNING *;
        `, Object.values(fields));
        }

        // return early if there's no tags/fields to update
        if (tags === undefined) {
            return await getPostById(postId);
        }

        // make any new tags that need to be made
        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');

        // delete any post_tags from the database which aren't in that tagList
        await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString})
        AND "postId"=$1;
      `, [postId]);

        // and create post_tags as necessary
        await addTagsToPost(postId, tagList);

        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}
// gets all the post that are currently in the database.
//it also  creates a new array from the postId anadds it the the getPostById
// returns the newly adjusted post with a postid
async function getAllPosts() {
    try {
        const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
      `);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

        return posts;
    } catch (error) {
        throw error;
    }
}
// gets post based upon a user created post.
// it does this by using the userId that is defined when we create a user.
// also does the same as the function above and sets the post id to be the userid.
async function getPostsByUser(userId) {
    try {
        const { rows: postIds } = await client.query(`
      SELECT * 
      FROM posts
      WHERE "authorId"=${ userId};
    `);
        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ))

        return posts;
    } catch (error) {
        throw error;
    }
}
// gets a post by the post id variable.
// also joins the post tags table with the tags table giving it a tagID
// it also places into postid
// deletes th author id once the tag and the postid are found.
async function getPostById(postId) {
    try {
        const { rows: [post] } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
        if (!post) {
            throw {
                name: 'postNotFound error',
                message: 'could not find a post with that postId'
            }
        }
        const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])

        const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])

        post.tags = tags;
        post.author = author;

        delete post.authorId;

        return post;
    } catch (error) {
        throw error;
    }
}
// gets a post by a tag nbame 
// joins the postid and the tag id where tags have the first value. 
async function getPostsByTagName(tagName) {
    try {
        const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);

        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
    } catch (error) {
        throw error;
    }
}
async function getUserByUsername(username) {
    try {
        const { rows: [user] } = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1
      `, [username]);

        return user;
    } catch (error) {
        throw error;
    }
}
// getpostbytagname 
//updateposts
//get userbyid
//updateUser
module.exports = {
    client,
    createUser,
    getUserByUsername,
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostById,
    addTagsToPost,
    createTags,
    createPostTag,
    getAllTags,
    getPostsByTagName,
    getPostsByUser
}//ports the client to a different file along with the users.