import { IHasherService } from "../defs";
import { sha512 } from "js-sha512";

export class HasherService implements IHasherService {
  public generateSalt(userId?: any): string {
    return randomString(32);
  }

  public getHashedPassword(plainPassword: any, salt: string = ""): string {
    return sha512(plainPassword + salt);
  }

  public generateToken(userId?: any): string {
    return randomString(16);
  }
}

const SPACE = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomString(length, chars = SPACE) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
