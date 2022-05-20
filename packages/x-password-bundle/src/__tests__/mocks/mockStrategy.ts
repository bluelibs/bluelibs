import { Strategy } from "passport-strategy";

import userData from "./userData";

export default class StrategyMock extends Strategy {
  name;
  _passAuthentication;
  _passReqToCallback;
  _callbackURL;
  _redirectToCallback;
  _profile;
  verify;
  _accessToken;
  _refreshToken;
  constructor(options, verify) {
    super();
    if (!verify) {
      throw new TypeError("Verify callback is required");
    }

    if (options.redirectToCallback && !options.callbackURL) {
      throw new TypeError(
        "Callback URL is required if redirectToCallback is true "
      );
    }

    this.name = this.name = options.name || "mock-oauth2";
    this._passAuthentication = options.passAuthentication || true;
    this._passReqToCallback = options.passReqToCallback || true;
    this._callbackURL = options.callbackURL || null;
    this._redirectToCallback = options.redirectToCallback || true;
    this.verify = verify;

    Strategy.call(this);
  }
  public _verifyUser(user, done) {
    done(null, user);
  }

  public authenticate(req, options) {
    var _accessToken = this._accessToken || "abcd";
    var _refreshToken = this._refreshToken || "efgh";

    if (
      this._redirectToCallback &&
      !req.query.__mock_strategies &&
      this._callbackURL
    ) {
      console.log(this._callbackURL + "?__mock_strategies=true");
      this.redirect(this._callbackURL + "?__mock_strategies=true");
    } else {
      var _user = userData;
      console.log(this._callbackURL + "?__mock_strategies=true");

      const verified = (err, user, info) => {
        if (err) return this.error(err);
        if (!user) return this.fail(info);
        this.success(user, info);
      };

      if (this._passAuthentication) {
        this._verifyUser(_user, (err, user, info) => {
          if (this._passReqToCallback) {
            this.verify(req, _accessToken, _refreshToken, userData, verified);
          } else {
            this.verify(_accessToken, _refreshToken, userData, verified);
          }
        });
      } else {
        this.fail(403);
      }
    }
  }
}
