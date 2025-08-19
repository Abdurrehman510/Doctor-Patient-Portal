const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const Patient = require('../models/Patient');
const dotenv = require('dotenv');

dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      let user;
      // ### FIX: Always find the user by the ID in the payload ###
      if (['Doctor', 'Admin'].includes(jwt_payload.role)) {
        user = await User.findById(jwt_payload.id);
      } else {
        // For patients, find the User document via the userId field
        user = await User.findById(jwt_payload.id);
      }

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      console.error('CRITICAL ERROR in JWT Strategy:', err);
      return done(err, false);
    }
  })
);


// ===================================
// 2. Google OAuth Strategy (For Login)
// ===================================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            role: 'Patient', // Default role for Google signups
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);


// ===================================
// Session Management (Used by Google OAuth)
// ===================================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id) || await Patient.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});