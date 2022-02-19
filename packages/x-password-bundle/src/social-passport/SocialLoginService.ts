import {
  PASSWORD_STRATEGY,
  SOCIAL_AUTH_STRATEGY,
  X_PASSWORD_SETTINGS,
} from "../constants";
import { IXPasswordBundleConfig } from "../defs";
import { Inject, Service, ContainerInstance } from "@bluelibs/core";
import { HTTPBundle } from "@bluelibs/http-bundle";
import * as passport from "passport";
const bodyParser = require("body-parser");
import {
  SOCIAL_CUSTOM_CONFIG,
  SOCIAL_UNIQUE_IDS,
  STRATEGY_NAME_MAP,
  IMPORT_STRATEGY_MAP,
  FIELD_FETCH_VALUES,
  PROFILE_OBJECT_PATH,
} from "./socialServiceConstants";
import { PasswordService } from "@bluelibs/password-bundle";
import { SecurityService } from "@bluelibs/security-bundle";
import {
  socialArrayPropsTypes,
  socialCustomConfigMapType,
  socialPropsTypes,
} from "./defs";
import { MultipleFactorService } from "../multipleAuthFactor/MultipleFactorService";
@Service()
export class SocialLoginService {
  httpBundle;
  constructor(
    protected readonly container: ContainerInstance,
    @Inject(X_PASSWORD_SETTINGS)
    protected readonly config: IXPasswordBundleConfig,
    protected readonly securityService: SecurityService,
    protected readonly passwordService: PasswordService,
    protected readonly multipleFactorService: MultipleFactorService
  ) {
    this.httpBundle = this.container.get<HTTPBundle>(HTTPBundle);
    this.onSocialAuth =
      this.config.socialAuth.onSocialAuth || this.defaultOnSocialAuth;
    this.url = this.config.socialAuth.url;
    this.socialCustomConfig = {
      ...SOCIAL_CUSTOM_CONFIG,
      ...this.config.socialAuth.socialCustomConfig,
    };
    this.socialUniqueIds = {
      ...SOCIAL_UNIQUE_IDS,
      ...this.config.socialAuth.socialUniqueIds,
    };
    this.strategyNameMap = {
      ...STRATEGY_NAME_MAP,
      ...this.config.socialAuth.strategyNameMap,
    };
    this.importStrategyMap = {
      ...IMPORT_STRATEGY_MAP,
      ...this.config.socialAuth.importStrategyMap,
    };
    this.fieldsValues = {
      ...FIELD_FETCH_VALUES,
      ...this.config.socialAuth.fieldsValues,
    };
    this.profileObjectPath = {
      ...PROFILE_OBJECT_PATH,
      ...this.config.socialAuth.profileObjectPath,
    };

    this.init();
  }
  protected socialCustomConfig: socialCustomConfigMapType =
    SOCIAL_CUSTOM_CONFIG;
  protected socialUniqueIds: socialPropsTypes = SOCIAL_UNIQUE_IDS;
  protected strategyNameMap: socialPropsTypes = STRATEGY_NAME_MAP;
  protected importStrategyMap: socialPropsTypes = IMPORT_STRATEGY_MAP;
  protected fieldsValues: socialArrayPropsTypes = FIELD_FETCH_VALUES;
  protected profileObjectPath: socialArrayPropsTypes = PROFILE_OBJECT_PATH;
  protected returnRawData: boolean;
  protected url: string;
  protected onSocialAuth: (
    req,
    type,
    uniqueProperty,
    accessToken,
    refreshToken,
    profile,
    done
  ) => any;

  init() {
    //prepare the rest app for our passport
    this.httpBundle.app.enable("trust proxy");

    this.httpBundle.app.use(bodyParser.urlencoded({ extended: false }));
    this.httpBundle.app.use(bodyParser.json());
    this.httpBundle.app.use(passport.initialize());
    this.httpBundle.app.use(passport.session());

    passport.serializeUser(function (user, done) {
      done(null, user);
    });
    passport.deserializeUser(function (user, done) {
      done(null, user);
    });

    //loop thourgh the services for setup
    for (let service of Object.keys(this.config.socialAuth.services)) {
      this.setupService(service, this.config.socialAuth.services[service]);
    }
  }

  setupService(service: string, setting: any) {
    let passportSetup = {
      clientID: setting.settings.clientID,
      clientSecret: setting.settings.clientSecret,
      callbackURL: this.url + setting.url.callback,
      passReqToCallback: true,
    };
    //change the input conifg depends on the stratgy
    if (
      this.socialCustomConfig[service] &&
      this.socialCustomConfig[service].varChanges
    ) {
      for (let varname in this.socialCustomConfig[service].varChanges) {
        (function (varname) {
          const buffer = passportSetup[varname];
          passportSetup[this.socialCustomConfig[service].varChanges[varname]] =
            buffer;
          delete passportSetup[varname];
        })(varname);
      }
    }
    // if the strategy requires more variables than cleintId and secretId
    if (
      this.socialCustomConfig[service] &&
      this.socialCustomConfig[service].varAdd
    ) {
      for (let varname in this.socialCustomConfig[service].varAdd) {
        (function (varname) {
          passportSetup[varname] =
            this.socialCustomConfig[service].varAdd[varname](setting);
        })(varname);
      }
    }
    if (
      this.socialCustomConfig[service] &&
      this.socialCustomConfig[service].varAdd
    ) {
      passportSetup = {
        ...passportSetup,
        ...this.socialCustomConfig[service].varAdd,
      };
    }
    // Execute the passport strategy
    passport.use(
      new (this.getStrategy(service))(
        passportSetup,
        (req, accessToken, refreshToken, profile, done) => {
          profile = {
            ...(this.returnRawData
              ? profile
              : this.getProfileFields(
                  this.preparseProfileData(service, profile)
                )),
            [this.socialUniqueIds[service]]:
              profile[this.socialUniqueIds[service]],
          };
          return this.onSocialAuth(
            req,
            service,
            this.socialUniqueIds[service],
            accessToken,
            refreshToken,
            profile,
            done
          );
        }
      )
    );

    let strategyName = service;
    if (this.strategyNameMap[service]) {
      strategyName = this.strategyNameMap[service];
    }

    // Setup the enty point (/auth/:service)
    this.httpBundle.app.get(
      setting.url.auth,
      passport.authenticate(strategyName, setting.settings.authParameters || {})
    );

    // Setup the callback url (/auth/:service/callback)
    this.httpBundle.app.get(
      setting.url.callback,
      passport.authenticate(strategyName, {
        successRedirect: setting.url?.success,
        failureRedirect: setting.url.fail,
        failureFlash: true,
      }),
      (req, res) => {
        //here in our callback method we return return token of teh user
        if (req.user.token) res.status(200).json({ token: req.user?.token });
        else
          res.status(500).json({
            error: true,
            message: "something went wrong with login with your account on: ",
            service,
          });
      }
    );
  }

  preparseProfileData(service, profile) {
    const path =
      this.profileObjectPath[service] || this.profileObjectPath.default;
    const profileData = path.reduce((prev, current) => prev[current], profile);
    return profileData;
  }

  getStrategy(socialServie: string) {
    return require(this.importStrategyMap[socialServie]).Strategy;
  }

  getProfileFields(profile: any) {
    const cleanProfile: any = {};
    const wantedFields = Object.keys(this.fieldsValues);
    for (let wantedField of wantedFields) {
      let fieldValue: any;
      fieldValue = Object.keys(profile).find((profileKey) =>
        this.fieldsValues[wantedField].some((f: string) =>
          profileKey?.toLowerCase().includes(f?.toLowerCase())
        )
      );
      //string
      if (typeof profile[fieldValue] === "string")
        cleanProfile[wantedField] = profile[fieldValue];
      //array
      else if (Array.isArray(profile[fieldValue])) {
        cleanProfile[wantedField] = profile[fieldValue][0];
      }
    }
    return cleanProfile;
  }

  async defaultOnSocialAuth(
    req,
    service,
    uniqueProperty,
    accessToken,
    refreshToken,
    profile,
    done
  ) {
    let userId = await this.passwordService.findUserIdByUsername(profile.email);
    let token;
    let updateBody: any = {
      socialAccounts: [{ service, id: profile[uniqueProperty] }],
    };
    if (!userId) {
      userId = await this.securityService.createUser();
      await this.passwordService.attach(userId, {
        username: profile.email,
        email: profile.email,
        password: profile.password,
        isEmailVerified: true,
      });
      updateBody = {
        ...updateBody,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
        },
      };
    } else {
      const user = await this.securityService.findUserById(userId, {
        socialAccounts: 1,
      });

      if (
        !user.socialAccounts.find(
          (social) =>
            social.id + "" === profile[uniqueProperty] &&
            service === social.service
        )
      )
        updateBody.socialAccounts = [
          ...user.socialAccounts,
          ...updateBody.socialAccounts,
        ];
    }
    await this.securityService.updateUser(userId, updateBody);
    //get token
    const result = await this.multipleFactorService.login(userId, {
      authenticationStrategy: PASSWORD_STRATEGY, //SOCIAL_AUTH_STRATEGY,
    });

    return done(null, result);
  }
}
