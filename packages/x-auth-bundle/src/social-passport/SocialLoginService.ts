import { PASSWORD_STRATEGY, X_AUTH_SETTINGS } from "../constants";
import { IXAuthBundleConfig } from "../defs";
import { Inject, Service, ContainerInstance } from "@bluelibs/core";
import { HTTPBundle } from "@bluelibs/http-bundle";
import passport from "passport";
import * as bodyParser from "body-parser";
import {
  SOCIAL_CUSTOM_CONFIG,
  SOCIAL_UNIQUE_IDS,
  STRATEGY_NAME_MAP,
  IMPORT_STRATEGY_MAP,
  FIELD_FETCH_VALUES,
  PROFILE_OBJECT_PATH,
} from "./socialServiceConstants";
import { PasswordService } from "@bluelibs/password-bundle";
import { SecurityService, IUser } from "@bluelibs/security-bundle";
import {
  socialArrayPropsTypes,
  socialCustomConfigMapType,
  socialPropsTypes,
  SocialAuthCallback,
  SocialProfile,
  SocialServiceConfigType,
  SocialStrategyType,
} from "./defs";
import { MultipleFactorService } from "../multipleAuthFactor/MultipleFactorService";

/**
 * The shape we store on the request when the social login completes.
 */
type SocialAuthUser = { token?: string; redirectUrl?: string };

/**
 * User records may carry strategy-specific fields beyond the known IUser shape.
 */
type SocialUpdateBody = Partial<IUser> & Record<string, unknown>;
@Service()
export class SocialLoginService {
  httpBundle: HTTPBundle;
  constructor(
    protected readonly container: ContainerInstance,
    @Inject(X_AUTH_SETTINGS)
    protected readonly config: IXAuthBundleConfig,
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
  protected passport: typeof passport;
  protected socialCustomConfig: socialCustomConfigMapType =
    SOCIAL_CUSTOM_CONFIG;
  protected socialUniqueIds: socialPropsTypes = SOCIAL_UNIQUE_IDS;
  protected strategyNameMap: socialPropsTypes = STRATEGY_NAME_MAP;
  protected importStrategyMap: Record<string, string | SocialStrategyType> =
    IMPORT_STRATEGY_MAP;
  protected fieldsValues: socialArrayPropsTypes = FIELD_FETCH_VALUES;
  protected profileObjectPath: socialArrayPropsTypes = PROFILE_OBJECT_PATH;
  protected returnRawData: boolean;
  protected url: string;
  protected onSocialAuth: SocialAuthCallback;

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
    for (const service of Object.keys(this.config.socialAuth.services)) {
      this.setupService(service, this.config.socialAuth.services[service]);
    }
  }

  setupService(service: string, setting: SocialServiceConfigType) {
    let passportSetup: Record<string, unknown> = {
      clientID: setting.settings.clientID,
      clientSecret: setting.settings.clientSecret,
      callbackURL: this.url + setting.url.callback,
      passReqToCallback: true,
    };
    //change the input conifg depends on the stratgy
    if (
      this.socialCustomConfig[service] &&
      this.socialCustomConfig[service].credentialsKeys
    ) {
      for (const varname in this.socialCustomConfig[service].credentialsKeys) {
        const buffer = passportSetup[varname];
        passportSetup[
          this.socialCustomConfig[service].credentialsKeys[varname]
        ] = buffer;
        delete passportSetup[varname];
      }
    }
    // if the strategy requires more variables than cleintId and secretId
    const extraCredentialsKeys = this.socialCustomConfig[service]
      ?.extraCredentialsKeys as
      Record<string, (setting: SocialServiceConfigType) => unknown> | undefined;
    if (extraCredentialsKeys) {
      for (const varname in extraCredentialsKeys) {
        passportSetup[varname] = extraCredentialsKeys[varname](setting);
      }
    }
    if (extraCredentialsKeys) {
      passportSetup = {
        ...passportSetup,
        ...extraCredentialsKeys,
      };
    }
    // Execute the passport strategy
    passport.use(
      service,
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
          } as SocialProfile;
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
        //successRedirect: setting.url?.success,
        failureRedirect: setting.url.fail,
        failureFlash: true,
      }),
      (req, res, _next) => {
        //here in our callback method we return return token of teh user
        const user = req.user as SocialAuthUser;
        if (user.token)
          res.redirect(setting.url?.success + "?token=" + user.token);
        else if (user.redirectUrl) {
          res.redirect(user.redirectUrl);
        } else res.redirect(setting.url.fail);
      }
    );
  }

  preparseProfileData(service: string, profile: SocialProfile): SocialProfile {
    const path =
      this.profileObjectPath[service] || this.profileObjectPath.default;
    const profileData = path.reduce(
      (prev, current) => prev[current] as SocialProfile,
      profile
    );
    return profileData;
  }

  getStrategy(socialServie: string): SocialStrategyType {
    if (typeof this.importStrategyMap[socialServie] == "string")
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- strategies are loaded dynamically by name from config
      return require(this.importStrategyMap[socialServie] as string).Strategy;
    return this.importStrategyMap[socialServie] as SocialStrategyType;
  }

  getProfileFields(profile: SocialProfile): Record<string, unknown> {
    const cleanProfile: Record<string, unknown> = {};
    const wantedFields = Object.keys(this.fieldsValues);
    for (const wantedField of wantedFields) {
      const fieldValue = Object.keys(profile).find((profileKey) =>
        this.fieldsValues[wantedField].some((f: string) =>
          profileKey?.toLowerCase().includes(f?.toLowerCase())
        )
      );
      if (fieldValue === undefined) continue;
      const value = profile[fieldValue];
      //string
      if (typeof value === "string") cleanProfile[wantedField] = value;
      //array
      else if (Array.isArray(value)) {
        cleanProfile[wantedField] = value[0];
      }
    }
    return cleanProfile;
  }

  async defaultOnSocialAuth(
    req: unknown,
    service: string,
    uniqueProperty: string,
    accessToken: string,
    refreshToken: string,
    profile: SocialProfile,
    done: (error: unknown, user?: unknown) => void
  ) {
    const email = profile.email;
    let userId = await this.passwordService.findUserIdByUsername(email);
    let updateBody: SocialUpdateBody = {
      socialAccounts: [{ service, id: profile[uniqueProperty] as string }],
    };
    if (!userId) {
      userId = await this.securityService.createUser();
      await this.passwordService.attach(userId, {
        username: email,
        email: email,
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
