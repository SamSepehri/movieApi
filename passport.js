const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./models.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

// Strategy to define basic HTTP authentication for login requests
passport.use(new LocalStrategy({
    // Take username and password from request body
    usernameField: 'Username',
    passwordField: 'Password'
}, (username, password, callback) => {
    console.log(username + ' ' + password);
    // Use mongoose to check database for user with same username
    Users.findOne({ Username: username }, (err, user) => {
        // Error handling
        if (err) {
            console.log(err);
            return callback(err);
        }
        // No user matches username
        if (!user) {
            console.log('incorrect username');
            return callback(null, false, { message: 'Incorrect username.' });
        }
        // Password wrong (use validatePassword to compare to hashed password stored in DB)
        if (!user.validatePassword(password)) {
            console.log('incorrent password');
            return callback(null, false, { message: 'Incorrent password.' });
        }
        // Username and password match - Execute callback
        console.log('finished');
        return callback(null, user);
    });
}));

// Strategy to authenticate users based on JWT
passport.use(new JWTStrategy({
    // Extract JWT from header of HTTP request
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, (jwtPayload, callback) => {
    // Return the user by userID
    return Users.findById(jwtPayload._id)
        .then((user) => {
            return callback(null, user);
        })
        .catch((err) => {
            return callback(err);
        });
}));