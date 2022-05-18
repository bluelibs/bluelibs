"use strict";

var passport = require("passport"),
  util = require("util"),
  Strategy = require("passport-strategy");
const userData = require("./userData");
function StrategyMock(options, verify) {
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
  this._profile = options.profile || userData;
  this.verify = verify;

  Strategy.call(this);
}

util.inherits(StrategyMock, Strategy);

StrategyMock.prototype._verifyUser = function (user, done) {
  done(null, {
    id: 1,
  });
};

StrategyMock.prototype.authenticate = function authenticate(req, options) {
  var self = this;

  var _profile = self._profile || userData;
  var _accessToken = self._accessToken || "abcd";
  var _refreshToken = self._refreshToken || "efgh";

  if (
    self._redirectToCallback &&
    !req.query.__mock_strategies &&
    self._callbackURL
  ) {
    self.redirect(self._callbackURL + "?__mock_strategies=true");
  } else {
    var _user = {
      id: 1,
    };

    function verified(err, user, info) {
      if (err) return self.error(err);
      if (!user) return self.fail(info);
      self.success(user, info);
    }

    if (self._passAuthentication) {
      self._verifyUser(_user, function (err, user, info) {
        if (self._passReqToCallback) {
          self.verify(req, _accessToken, _refreshToken, _profile, verified);
        } else {
          self.verify(_accessToken, _refreshToken, _profile, verified);
        }
      });
    } else {
      self.fail("Unauthorized");
    }
  }
};

module.exports = StrategyMock;
