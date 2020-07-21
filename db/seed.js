// makes client from database to the backend/node
//should provide utility functions that the rest of our app will use.
//this is where we will listen for front end ajax reuest that are defined paths
//inside of index.js
// this file can directly manipulate our database instead of going to postgress
// to do so. 
//GLOBAL VARIABLES.
const { client, getAllUsers, createUser } = require('./index'); // grabs our client and all the users from the export inside index.js and destructures it.

//server request.
async function testDB() {
    try {
        console.log("starting test")
        //queries are another form of promises just like fetch 
        const { rows } = await client.query(`SELECT * FROM users;`)
        const users = await getAllUsers()
        //also the rows deconstructed will give us the appropriate data return.
        // the rows should show a selection from the users already created in the
        //database.
        console.log(rows);
        console.log("getAllUsers:", users)
        console.log("Finished database tests!");
    } catch (error) {
        console.error("Error testing database!");
        throw error
    }
}
// this function will initiate a query which drops all tables from the 
//current database
// it does this by setting the client query to an empty string.
async function dropTables() {
    try {
        console.log('starting to drop tables..')
        // this runs the psql command
        // if users exist in data base
        await client.query('DROP TABLE IF EXISTS users;');
        console.log("finished dropping")
    } catch (error) {
        console.error("error dropping tables..", error);
        throw error; // throws the error to the func that calls droptables
    }
}
//this func should create a query that creates all tables inside the database.
//
async function createTables() {
    try {
        console.log('starting build...')
        //this creates the appropriate query when a user is put into the database.
        await client.query(` CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL
          );`);
        console.log("Finished building tables!");
    } catch (error) {
        console.error("Error building tables!");
        throw error;

        // passes the error to the create tables function. 
    }

}
async function createInitialUsers() {
    try {
        console.log("starting to create users")
        const albert = await createUser({ username: 'albert', password: 'bertie99' })
        const sandra = await createUser({ username: 'sandra', password: 'sandra123' });
        const sasha = await createUser({ username: 'sasha', password: 'sasha123' });
        console.log('myuser', albert)
        console.log('myuser', sandra)
        console.log(sasha)
        console.log("user created.")
    } catch (error) {
        console.error("Error creating users!");
        throw error;
    }
}
async function rebuildDB() {
    try {
        client.connect();
        await dropTables();
        await createTables();
        await createInitialUsers();
    } catch (error) {

        throw error

    }
}
rebuildDB().then(testDB)
    .catch(console.error)
    .finally(() => client.end())
