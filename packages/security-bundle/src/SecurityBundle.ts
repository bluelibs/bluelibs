import {
  Bundle,
  Token,
  BundlePhase,
  EventManager,
  KernelAfterInitEvent,
  Constructor,
} from "@bluelibs/core";
import {
  IUserPersistance,
  IPermissionPersistance,
  ISecurityBundleConfig,
} from "./defs";
import {
  USER_PERSISTANCE_LAYER,
  PERMISSION_PERSISTANCE_LAYER,
  SESSION_PERSISTANCE_LAYER,
} from "./constants";
import { PermissionGraph } from "./services/PermissionGraph";
import { ISessionPersistance } from "./defs";
import * as ms from "ms";
import { SecurityService } from "./services/SecurityService";
import { UserPersistanceService } from "./__tests__/services/mocks/UserPersistanceService.mock";
import { SessionPersistanceService } from "./__tests__/services/mocks/SessionPersistanceService.mock";
import { PermissionsPersistanceService } from "./__tests__/services/mocks/PermissionsPersistanceService.mock";

export class SecurityBundle extends Bundle<ISecurityBundleConfig> {
  protected defaultConfig = {
    userPersistance: UserPersistanceService,
    sessionPersistance: SessionPersistanceService,
    permissionPersistance: PermissionsPersistanceService,
    session: {
      expiresIn: "14d",
      cleanup: true,
      cleanupInterval: "24h",
    },
    permissionTree: {},
  };

  async hook() {
    const eventManager = this.get<EventManager>(EventManager);

    eventManager.addListener(KernelAfterInitEvent, () => {
      this.setupSessionCleanupInterval();
    });
  }

  async prepare() {
    this.container.set({
      id: SESSION_PERSISTANCE_LAYER,
      type: this.config.sessionPersistance,
    });

    this.container.set({
      id: USER_PERSISTANCE_LAYER,
      type: this.config.userPersistance,
    });

    this.container.set({
      id: PERMISSION_PERSISTANCE_LAYER,
      type: this.config.permissionPersistance,
    });

    this.container.set(
      PermissionGraph,
      new PermissionGraph(this.config.permissionTree)
    );
  }

  /**
   * Must be run before preparation event
   * @param userPersistance
   * @deprecated Please use the one with setUserPersistance (has a) for consistency along everwhere
   */
  setUserPersistence(userPersistance: Constructor<IUserPersistance>) {
    this.setUserPersistance(userPersistance);
  }

  /**
   * Must be run before preparation event
   * @param userPersistance
   */
  setUserPersistance(userPersistance: Constructor<IUserPersistance>) {
    this.config.userPersistance = userPersistance;
  }

  /**
   * Must be run before preparation event
   * @param sessionPersistance
   */
  setSessionPersistance(sessionPersistance: Constructor<ISessionPersistance>) {
    this.config.sessionPersistance = sessionPersistance;
  }

  /**
   * Must be run before preparation event
   * @param permissionPersistance
   */
  setPermissionPersistance(
    permissionPersistance: Constructor<IPermissionPersistance>
  ) {
    this.config.permissionPersistance = permissionPersistance;
  }

  async init() {}

  protected setupSessionCleanupInterval() {
    if (this.config.session?.cleanup) {
      const interval = ms(this.config.session.cleanupInterval);
      const securityService = this.get<SecurityService>(SecurityService);

      setInterval(() => {
        securityService.sessionPersistanceLayer.cleanExpiredTokens();
      }, interval);
    }
  }
}
