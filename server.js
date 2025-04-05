const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const userService = require('./user-service.js');
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// Configure Passport to use JWT Strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  // Here you could perform additional checks (e.g., verify if the user still exists)
  // For now, we assume that if the token is valid, we pass along the payload.
  return done(null, jwt_payload);
}));

app.use(passport.initialize());

// Registration route
app.post("/api/user/register", (req, res) => {
  userService.registerUser(req.body)
    .then(msg => res.json({ "message": msg }))
    .catch(msg => res.status(422).json({ "message": msg }));
});

// Login route with JWT token generation
app.post("/api/user/login", (req, res) => {
  userService.checkUser(req.body)
    .then(user => {
      // Create a payload with user ID and userName
      const payload = {
        _id: user._id,
        userName: user.userName
      };
      // Sign the payload using the secret from the .env file
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      res.json({ "token": token, "message": "login successful" });
    })
    .catch(msg => {
      res.status(422).json({ "message": msg });
    });
});

// Protected routes using passport.authenticate
app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.getFavourites(req.user._id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.addFavourite(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.removeFavourite(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.get("/api/user/history", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.getHistory(req.user._id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.put("/api/user/history/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.addHistory(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.delete("/api/user/history/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.removeHistory(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

userService.connect()
  .then(() => {
    app.listen(HTTP_PORT, () => { 
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("Unable to start the server: " + err);
    process.exit();
  });
