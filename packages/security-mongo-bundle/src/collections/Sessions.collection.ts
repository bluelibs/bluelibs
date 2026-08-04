import { randomInt } from "crypto";
import {
  ISession,
  ISessionPersistance,
  UserId,
} from "@bluelibs/security-bundle";
import { Collection } from "@bluelibs/mongo-bundle";
export class SessionsCollection
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
    data?: any
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

  async findSession(userId: UserId, data: any): Promise<ISession> {
    return this.findOne({
      userId,
      expiresAt: {
        $gte: new Date(),
      },
      ...Object.keys(data).reduce((prev, key) => {
        prev["data." + key] = data[key];
        return prev;
      }, {}),
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
