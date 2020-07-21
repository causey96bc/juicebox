//file that will make paths/functions for your front end to request from 
// the backend and then the backend/this folder to go to the database.


const { Client } = require('pg') // imports nodes postgresql adapter
const client = new Client('postgres://localhost:5432/juicebox-dev');//suuplies location of the database and the server for the localhost.
module.exports = { client, } //exports the client to a different file.





// defines a path for your front end to get all users that are created.
async function getAllUsers() {
    const { rows } = await client.query(
        `SELECT id, username 
      FROM users;
    `);

    return rows;
}
async function createUser({ username, password }) {
    try {
        const { rows } = await client.query(`
        INSERT INTO users(username, password) VALUES ($1, $2)
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, ["some_name", "some_password"]);
        return rows
    } catch (error) {
        throw error;
    }

}

//exports
module.exports = { client, getAllUsers, createUser } //exports the client to a different file along with the users.