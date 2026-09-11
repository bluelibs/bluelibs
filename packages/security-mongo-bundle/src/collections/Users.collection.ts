import {
  IUserPersistance,
  IFieldMap,
  IUser,
  FindAuthenticationStrategyResponse,
  UserId,
} from "@bluelibs/security-bundle";
import { Collection, Behaviors } from "@bluelibs/mongo-bundle";
import * as MongoDB from "mongodb";

/**
 * User data that can be persisted: known IUser fields plus any extension fields
 * used by authentication strategies.
 */
type UserData = Partial<IUser> & Record<string, unknown>;

export class UsersCollection<K extends IUser>
  extends Collection<K>
  implements IUserPersistance
{
  static collectionName = "users";

  static behaviors = [Behaviors.Timestampable()];

  async insertUser(data: UserData): Promise<UserId> {
    const result = await this.insertOne(data as Partial<K>);
    return result.insertedId;
  }

  async updateUser(userId: UserId, data: UserData): Promise<void> {
    await this.updateOne(
      {
        _id: userId,
      } as MongoDB.Filter<K>,
      {
        $set: data,
      } as MongoDB.UpdateFilter<K>
    );
  }

  async deleteUser(userId: UserId): Promise<void> {
    await this.deleteOne({ _id: userId } as MongoDB.Filter<K>);
  }

  async findUser(
    filters: Record<string, unknown>,
    projection?: IFieldMap
  ): Promise<K> {
    const options: MongoDB.FindOptions<K> = {};
    if (projection) {
      options.projection = projection;
    }

    return this.findOne(filters as MongoDB.Filter<K>, options);
  }

  async findUserById(userId: UserId, projection?: IFieldMap): Promise<K> {
    const options: MongoDB.FindOptions<K> = {};
    if (projection) {
      options.projection = projection;
      if (!options.projection._id) {
        options.projection._id = 1;
      }
    }

    return this.findOne({ _id: userId } as MongoDB.Filter<K>, options);
  }

  async updateAuthenticationStrategyData<T = unknown>(
    userId: UserId,
    methodName: string,
    data: Partial<T>
  ): Promise<void> {
    // TODO: more efficiently via $set directly
    const authMethod = await this.getAuthenticationStrategyData(
      userId,
      methodName
    );

    const current = authMethod ? authMethod : {};

    Object.assign(current, data);

    await this.updateOne(
      { _id: userId } as MongoDB.Filter<K>,
      {
        $set: {
          [methodName]: current,
        },
      } as MongoDB.UpdateFilter<K>
    );
  }

  async findThroughAuthenticationStrategy<T = unknown>(
    strategyName: string,
    filters: Record<string, unknown>,
    _fields?: IFieldMap
  ): Promise<FindAuthenticationStrategyResponse<T> | null> {
    const methodFilters: Record<string, unknown> = {};
    for (const key in filters) {
      methodFilters[`${strategyName}.${key}`] = filters[key];
    }

    // TODO: projection
    const result = await this.findOne(methodFilters as MongoDB.Filter<K>);

    if (!result) {
      return null;
    }

    return {
      userId: result._id,
      strategy: (result as unknown as Record<string, unknown>)[
        strategyName
      ] as T,
    };
  }

  async getAuthenticationStrategyData<T = unknown>(
    userId: UserId,
    strategyName: string,
    _fields?: IFieldMap
  ): Promise<Partial<T>> {
    // TODO: implement projection
    const user = await this.findOne({ _id: userId } as MongoDB.Filter<K>, {
      projection: {
        [strategyName]: 1,
      },
    });

    return user
      ? ((user as unknown as Record<string, unknown>)[
          strategyName
        ] as Partial<T>)
      : null;
  }

  async removeAuthenticationStrategyData(
    userId: UserId,
    methodName: string
  ): Promise<void> {
    await this.updateOne(
      { _id: userId } as MongoDB.Filter<K>,
      {
        $unset: {
          [methodName]: 1,
        },
      } as MongoDB.UpdateFilter<K>
    );
  }
}
