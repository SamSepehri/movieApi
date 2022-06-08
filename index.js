// Load express framework
const express = require('express');
const app = express();

// Import middleware libraries: Morgan, body-parser, and uuid
const morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

// Use body-parser middleware function
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import Mongoose, models.js and respective models defined in model.js
const mongoose = require('mongoose');
Models = require('./models.js');
Movies = Models.Movie;
Users = Models.User;

// Import and use CORS, set allowed origins
const cors = require('cors');

/* ******* UNCOMMENT TO SET CORS POLICY!! *******
************************************************
//let allowedOrigins = ['http://localhost:8000', 'http://testsite.com', 'https://herokuapp.com', 'http://localhost:1234'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // origin is not included in list of allowedOrigins
      let message = 'The CORS policy for this application doesn\'t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));
************************************************
******* UNCOMMENT TO SET CORS POLICY *******
*/

// DELETE this when uncommenting CORS POLICY!!
app.use(cors({
    origin: '*'
}));

// Import express-validator to validate input fields
const { check, validationResult } = require('express-validator');

// Import auth.js file
let auth = require('./auth')(app);

// Require passport module & import passport.js file 
const passport = require('passport');
require('./passport');

/* Connecting to MongoDB Movies */
// a) Connect to Local DB
//mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

// b) Connect to Hosted DB
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * Logs basic request data in terminal using Morgan middleware library
 */
app.use(morgan('common'));



/* ******* START OF ENDPOINT DEFINITION ******* 
************************************************
************************************************
*/

/**
 * GET: Returns a list of ALL movies to the user
 * Request body: Bearer token
 * @returns array of movie objects
 * @requires passport
 */
app.get('/movies',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.find()
            .then((movies) => {
                res.status(200).json(movies);
            })
            .catch((err) => {
                res.status(500).send('Error: ' + err);
            });
    });


/**
 * GET: Returns data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
 * Request body: Bearer token
 * @param movieId
 * @returns movie object
 * @requires passport
 */
app.get('/movies/:movieId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ _id: req.params.movieId }) // Find the movie by title
        .then((movie) => {
            // If movie was found, return json, else throw error
            if (movie) {
                res.status(200).json(movie);
            } else {
                res.status(400).send('Movie not found');
            };
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});


/**
 * GET: Returns data about a genre (description) by name/title (e.g., “Fantasy”)
 * Request body: Bearer token
 * @param Name (of genre)
 * @returns genre object
 * @requires passport
 */
app.get('/movies/genre/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name }) // Find one movie with the genre by genre name
        .then((movie) => {
            // If a movie with the genre was found, return json of genre info, else throw error
            if (movie) {
                res.status(200).json(movie.Genre);
            } else {
                res.status(400).send('Genre not found');
            };
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});


/**
 * GET: Returns data about a director (bio, birth year, death year) by name
 * Request body: Bearer token
 * @param Name (of director)
 * @returns director object
 * @requires passport
 */
app.get('/movies/director/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name }) // Find one movie with the director by name
        .then((movie) => {
            if (movie) { // If a movie with the director was found, return json of director info, else throw error
                res.status(200).json(movie.Director);
            } else {
                res.status(400).send('Director not found');
            };
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});


/**
 * POST: Allows new users to register; Username, Password & Email are required fields!
 * Request body: Bearer token, JSON with user information
 * @returns user object
 */
app.post('/users',
    // Validation logic
    [
        check('Username', 'Username is required (min 3 characters).').isLength({ min: 3 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required.').not().isEmpty(),
        check('Email', 'Email does not appear to be valid.').isEmail()
    ], (req, res) => {

        // Check validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password); // Create hashedPassword from given Password

        // Create new user
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) { // If the same username already exists, throw an error
                    return res.status(400).send('User with the Username ' + req.body.Username + ' already exists!')
                } else { // If the username is unique, create a new user with the given parameters from the request body
                    Users
                        .create({
                            Username: req.body.Username,
                            Password: hashedPassword, // Store only hashed password
                            Email: req.body.Email,
                            Birthday: req.body.Birthday
                        })
                        .then((user) => { res.status(201).json(user) })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).send('Error: ' + err);
                        })
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });


/** 
 * GET: Returns a list of ALL users
 * Request body: Bearer token
 * @returns array of user objects
 * @requires passport
 */
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(200).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


/**
 * GET: Returns data on a single user (user object) by username
 * Request body: Bearer token
 * @param Username
 * @returns user object
 * @requires passport
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            if (user) { // If a user with the corresponding username was found, return user info
                res.status(200).json(user);
            } else {
                res.status(400).send('User with the username ' + req.params.Username + ' was not found');
            };
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


/**
 * PUT: Allow users to update their user info (find by username)
 * Request body: Bearer token, updated user info
 * @param Username
 * @returns user object with updates
 * @requires passport
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    // Validation logic
    [
        check('Username', 'Username is required (min 3 characters).').isLength({ min: 3 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric()
    ], (req, res) => {
        // Check validation object for errors
        let errors = validationResult(req);
        let hashedPassword = undefined;

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        // If Password is given in request body, create hashedPassword from given Password
        if (req.body.hasOwnProperty('Password')) {
            hashedPassword = Users.hashPassword(req.body.Password);
        }

        Users.findOneAndUpdate({ Username: req.params.Username }, // Find user by existing username
            {
                $set: { // Info from request body that can be updated
                    Username: req.body.Username,
                    Password: hashedPassword, // Store only hashed password
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                }
            },
            { new: true }) // Return the updated document
            .then((updatedUser) => {
                res.json(updatedUser); // Return json object of updatedUser
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });


/**
 * POST: Allows users to add a movie to their list of favorites
 * Request body: Bearer token
 * @param username
 * @param movieId
 * @returns user object
 * @requires passport
 */
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, // Find user by username
        { $push: { FavoriteMovies: req.params.MovieID } }, // Add movie to the list
        { new: true }) // Return the updated document
        .then((updatedUser) => {
            res.json(updatedUser); // Return json object of updatedUser
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


/**
 * GET: Returns a list of favorite movies from the user
 * Request body: Bearer token
 * @param Username
 * @returns array of favorite movies
 * @requires passport
 */
app.get('/users/:Username/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            if (user) { // If a user with the corresponding username was found, return user info
                res.status(200).json(user.FavoriteMovies);
            } else {
                res.status(400).send('Could not find favorite movies for this user');
            };
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


/**
 * DELETE: Allows users to remove a movie from their list of favorites
 * Request body: Bearer token
 * @param Username
 * @param movieId
 * @returns user object
 * @requires passport
 */
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, // Find user by username
        { $pull: { FavoriteMovies: req.params.MovieID } }, // Remove movie from the list
        { new: true }) // Return the updated document
        .then((updatedUser) => {
            res.json(updatedUser); // Return json object of updatedUser
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


/**
 * DELETE: Allows existing users to deregister
 * Request body: Bearer token
 * @param Username
 * @returns success message
 * @requires passport
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username }) // Find user by username
        .then((user) => {
            if (user) { // If user was found, return success message, else return error
                res.status(200).send('User with the Username ' + req.params.Username + ' was sucessfully deleted.');
            } else {
                res.status(400).send('User with the Username ' + req.params.Username + ' was not found.');
            };
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


/**
 * GET: Returns welcome message for '/' request URL
 * @returns Welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to the myMovies App!');
});

/* ******* END OF ENDPOINT DEFINITION ******* 
************************************************
************************************************
*/


/**
 * Serves sstatic content for the app from the 'public' directory
 */
app.use(express.static('public'));


/**
 * handles errors
 */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


/**
 * defines port, listening to port 8000
 */
const port = process.env.PORT || 8000;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});