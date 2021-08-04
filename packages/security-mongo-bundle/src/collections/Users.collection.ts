import {
  IUserPersistance,
  IFieldMap,
  IUser,
  FindAuthenticationStrategyResponse,
  UserId,
} from "@bluelibs/security-bundle";
import { Collection, Behaviors } from "@bluelibs/mongo-bundle";

export class UsersCollection<T extends IUser>
  extends Collection<IUser>
  implements IUserPersistance
{
  static collectionName = "users";

  static behaviors = [Behaviors.Timestampable()];

  async insertUser(data: object): Promise<UserId> {
    const result = await this.insertOne(data);

    return result.insertedId;
  }

  async updateUser(userId: UserId, data: any): Promise<void> {
    await this.updateOne(
      {
        _id: userId,
      },
      {
        $set: data,
      }
    );
  }

  async deleteUser(userId: UserId): Promise<void> {
    await this.deleteOne({ _id: userId });
  }

  async findUser(filters: any, projection?: IFieldMap): Promise<IUser> {
    const options: any = {};
    if (projection) {
      options.projection = projection;
    }

    return this.findOne(filters, options);
  }

  async findUserById(userId: UserId, projection?: IFieldMap): Promise<IUser> {
    const options: any = {};
    if (projection) {
      options.projection = projection;
      if (!options.projection._id) {
        options.projection._id = 1;
      }
    }

    return this.findOne({ _id: userId }, options);
  }

  async updateAuthenticationStrategyData<T = any>(
    userId: UserId,
    methodName: string,
    data: null | Partial<T>
  ): Promise<void> {
    // TODO: more efficiently via $set directly
    const authMethod = await this.getAuthenticationStrategyData(
      userId,
      methodName
    );

    const current = authMethod ? authMethod : {};

    Object.assign(current, data);

    await this.updateOne({ _id: userId }, {
      $set: {
        [methodName]: current,
      },
    } as any);
  }

  async findThroughAuthenticationStrategy<T = any>(
    strategyName: string,
    filters: any,
    fields?: IFieldMap
  ): Promise<FindAuthenticationStrategyResponse<T> | null> {
    const methodFilters = {};
    for (const key in filters) {
      methodFilters[`${strategyName}.${key}`] = filters[key];
    }

    // TODO: projection
    const result = await this.findOne(methodFilters);

    if (!result) {
      return null;
    }

    return {
      userId: result._id,
      strategy: result[strategyName],
    };
  }

  async getAuthenticationStrategyData<T = any>(
    userId: UserId,
    strategyName: string
  ): Promise<T> {
    // TODO: implement projection
    const user = await this.findOne(
      { _id: userId },
      {
        projection: {
          [strategyName]: 1,
        },
      }
    );

    return user ? user[strategyName] : null;
  }

  async removeAuthenticationStrategyData(
    userId: UserId,
    methodName: string
  ): Promise<void> {
    await this.updateOne({ _id: userId }, {
      $unset: {
        [methodName]: 1,
      },
    } as any);
  }
}
