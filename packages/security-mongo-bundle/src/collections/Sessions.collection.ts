import { randomInt } from "crypto";
import {
  ISession,
  ISessionData,
  ISessionPersistance,
  UserId,
} from "@bluelibs/security-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
// The type parameter is retained for consumer compatibility: callers use
// `SessionsCollection<ISession>` and the published signature declares it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class SessionsCollection<T extends ISession>
  extends Collection<ISession>
  implements ISessionPersistance
{
  static collectionName = "sessions";

  static indexes = [
    {
      key: {
        token: 1,
      },
    },
  ];

  /**
   * Creates the session with the token and returns the token
   * @param userId
   * @param expiresAt
   * @param data
   */
  async newSession(
    userId: UserId,
    expiresAt: Date,
    data?: ISessionData
  ): Promise<string> {
    const session = {
      token: generateToken(64),
      userId,
      expiresAt,
    };

    if (data) {
      Object.assign(session, { data });
    }

    await this.insertOne(session);

    return session.token;
  }

  async getSession(token: string): Promise<ISession> {
    return this.findOne({
      token,
    });
  }

  async deleteSession(token: string): Promise<void> {
    await this.deleteOne({
      token,
    });
  }

  async deleteAllSessionsForUser(userId: UserId): Promise<void> {
    await this.deleteMany({
      userId,
    });
  }

  async cleanExpiredTokens(): Promise<void> {
    await this.deleteMany({
      expiresAt: {
        $lt: new Date(),
      },
    });
  }

  async findSession(
    userId: UserId,
    data: Partial<ISessionData>
  ): Promise<ISession> {
    const sessionData = data as Record<string, unknown>;

    return this.findOne({
      userId,
      expiresAt: {
        $gte: new Date(),
      },
      ...Object.keys(sessionData).reduce(
        (prev, key) => {
          prev["data." + key] = sessionData[key];
          return prev;
        },
        {} as Record<string, unknown>
      ),
    });
  }
}

const ALLOWED_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
function generateToken(length: number): string {
  const b = [];
  for (let i = 0; i < length; i++) {
    b[i] = ALLOWED_CHARS[randomInt(0, ALLOWED_CHARS.length)];
  }
  return b.join("");
}
