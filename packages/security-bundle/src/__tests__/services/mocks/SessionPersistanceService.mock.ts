import { ISessionPersistance, ISession, UserId } from "../../../defs";
export class SessionPersistanceService implements ISessionPersistance {
  public db: ISession[] = [];

  async newSession(userId, expiresAt, data): Promise<string> {
    const token = Math.random().toString();

    const session = {
      userId,
      expiresAt,
      token: token,
    };
    if (data) {
      Object.assign(session, { data });
    }
    this.db.push(session);

    return token;
  }

  async getSession(token: string): Promise<ISession> {
    return this.db.find((s) => s.token === token);
  }

  async deleteSession(token: string): Promise<void> {
    this.db = this.db.filter((s) => s.token !== token);
  }

  async deleteAllSessionsForUser(userId: UserId): Promise<void> {
    this.db = this.db.filter((s) => s.userId !== userId);
  }

  async cleanExpiredTokens(): Promise<void> {
    const now = new Date().getTime();
    this.db = this.db.filter((s) => s.expiresAt.getTime() < now);
  }
}
