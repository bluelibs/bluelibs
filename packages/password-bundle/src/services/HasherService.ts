import { IHasherService } from "../defs";
import { UserId } from "@bluelibs/security-bundle";
import { sha512 } from "js-sha512";
import { randomInt } from "crypto";

export class HasherService implements IHasherService {
  public generateSalt(_userId?: UserId): string {
    return randomString(32);
  }

  public getHashedPassword(plainPassword: string, salt: string = ""): string {
    return sha512(plainPassword + salt);
  }

  public generateToken(_userId?: UserId): string {
    return randomString(16);
  }
}

const SPACE = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomString(length: number, chars = SPACE) {
  let result = "";
  for (let i = length; i > 0; --i) result += chars[randomInt(0, chars.length)];
  return result;
}
