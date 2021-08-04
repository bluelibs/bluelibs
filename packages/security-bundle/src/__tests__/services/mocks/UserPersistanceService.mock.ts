import { UserNotFoundException } from "../../../exceptions";
import {
  IUserPersistance,
  IUser,
  IFieldMap,
  FindAuthenticationStrategyResponse,
  UserId,
} from "../../../defs";

export class UserPersistanceService implements IUserPersistance {
  db: any[] = [];

  async deleteUser(userId: UserId): Promise<void> {
    this.db = this.db.filter((u) => u._id === userId);
  }

  async insertUser(data: any) {
    const _id = this.db.length + 1;
    this.db.push({
      _id,
      createdAt: new Date(),
      isEnabled: true,
      services: {},
      ...data,
    });

    return _id;
  }
  async updateUser(userId: UserId, data: any) {
    const user = this.db.find((u) => u._id === userId);
    if (!userId) {
      throw new UserNotFoundException();
    }

    Object.assign(user, data);
  }

  async findUser<IUser>(filters, fields?: any): Promise<IUser> {
    return this.db.find((u) => {
      const user = this.db.find((u) => {
        let allOk = true;
        for (const key in filters) {
          if (u[key] !== filters[key]) {
            allOk = false;
          }
        }

        return allOk;
      });
    });
  }

  async findUserById<IUser>(userId, fields?: any): Promise<IUser> {
    return this.db.find((u) => u._id === userId);
  }

  async findThroughAuthenticationStrategy<T = any>(
    methodName: string,
    filters: any,
    fields?: IFieldMap
  ): Promise<null | FindAuthenticationStrategyResponse<T>> {
    const user = this.db.find((u) => {
      if (!u.services[methodName]) {
        return;
      }

      let allOk = true;
      for (const key in filters) {
        if (u.services[methodName][key] !== filters[key]) {
          allOk = false;
        }
      }

      return allOk;
    });

    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      strategy: user[methodName],
    };
  }

  async updateAuthenticationStrategyData(
    userId: UserId,
    authenticationStrategyName: string,
    data: any
  ): Promise<void> {
    const user = this.db.find((u) => u._id === userId);

    if (!user.services[authenticationStrategyName]) {
      user.services[authenticationStrategyName] = {};
    }

    Object.assign(user.services[authenticationStrategyName], data);
  }

  async getAuthenticationStrategyData(
    userId: UserId,
    authenticationStrategyName: string
  ) {
    const user = this.db.find((u) => u._id === userId);

    return user.services[authenticationStrategyName] || null;
  }

  async removeAuthenticationStrategyData(
    userId: UserId,
    authenticationStrategyName: string
  ): Promise<void> {
    const user = this.db.find((u) => u._id === userId);

    delete user.services[authenticationStrategyName];
  }
}
