import * as passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { PassportAuthenticator } from "../models/PassportAuthenticator";

export class FacebookAuthenticator extends PassportAuthenticator {
  route() {
    this.app.get("/auth/facebook", passport.authenticate("facebook"));
    this.get(
      "/auth/facebook/callback",
      {},
      async (err, user, req, res, next) => {
        // create the token using the user._id
        const token = await this.getToken(user._id);
        res.cookie("bluelibs-login-token", token);
        res.json({ hello: "goodbye ", token });
      }
    );
  }

  createStrategy() {
    return new FacebookStrategy(
      {
        clientID: "XXX",
        clientSecret: "XXX",
        callbackURL: "http://localhost:4000/auth/facebook/callback",
      },
      async (accesstoken, refreshToken, profile, done) => {
        try {
          const { isNew, user } = await this.findOrCreate(profile.id);

          // If the user is newly created, `isNew` will be true, so you can adapt the profile
          // By default we store the "profile.id" inside "facebookId" which is derived from strategy name
          // You can customise the name by overriding get name()

          if (isNew) {
            this.securityService.updateUser(user._id, {
              // other things
            });
          }

          // Now return the authentication token
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    );
  }
}
