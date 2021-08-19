import { SecurityService } from "@bluelibs/security-bundle";
import { PasswordService } from "../../services/PasswordService";
import { createEcosystem } from "../ecosystem";
import { assert } from "chai";
import { ContainerInstance } from "@bluelibs/core";
import { UsernameAlreadyExistsException } from "../../exceptions";

describe("PasswordService", () => {
  it("Should allow to create a user with a password and check password validity", async () => {
    const { container } = await createEcosystem();

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@johnny.com",
    });

    assert.isTrue(await passwordService.isPasswordValid(userId, "123456"));
    assert.isFalse(await passwordService.isPasswordValid(userId, "1x23456"));

    await securityService.deleteUser(userId);
  });

  it("Should allow setting new passwords", async () => {
    const { container } = await createEcosystem();

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@john.com",
    });

    await passwordService.setPassword(userId, "123");
    assert.isTrue(await passwordService.isPasswordValid(userId, "123"));

    await securityService.deleteUser(userId);
  });

  it("Should allow resetting passwords with a token", async () => {
    const { container } = await createEcosystem();

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@john.com",
    });

    const token = await passwordService.createTokenForPasswordReset(userId);

    await expect(
      passwordService.resetPassword(userId, "bogus-token", "123")
    ).rejects.toBeInstanceOf(Error);

    assert.isFalse(await passwordService.isPasswordValid(userId, "123"));
    await passwordService.resetPassword(userId, token, "123");

    assert.isTrue(await passwordService.isPasswordValid(userId, "123"));

    // Token should now be invalid.
    await expect(
      passwordService.resetPassword(userId, token, "123")
    ).rejects.toBeInstanceOf(Error);

    await securityService.deleteUser(userId);
  });

  it("Password reset requests should have a cooldown period and should expire after a while", async () => {
    const { container } = await createEcosystem({
      resetPassword: {
        cooldown: "1m",
        expiresAfter: "5m",
      },
    });

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@john.com",
    });

    // So, the cooldown period means that I shouldn't make too many X requests
    // So, if I do one request now, the next one I can do after cooldown.

    // Should be ok
    const passwordRequestToken =
      await passwordService.createTokenForPasswordReset(userId);

    // Now this next one, the cooldown is 1m so we should expect an error, we already requested it few ms ago
    await expect(
      passwordService.createTokenForPasswordReset(userId)
    ).rejects.toBeInstanceOf(Error);

    // Let's move forward in time and make sure it works this time.
    const somePastDate = new Date();
    somePastDate.setFullYear(2000); // The ol' 00s
    passwordService.updateData(userId, {
      resetPasswordRequestedAt: somePastDate,
    });

    const lastToken = await passwordService.createTokenForPasswordReset(userId);

    // Ok now that we passed without errors we need to ensure that if the time has expired, you can no longer use the token
    await passwordService.resetPassword(userId, lastToken, "somepw");

    // Now that everything should be cleaned let's try again
    const newToken = await passwordService.createTokenForPasswordReset(userId);

    // Now we need to emulate the time passing, so what we do. You got it, we set time in the past and we try to reset our pw
    passwordService.updateData(userId, {
      resetPasswordRequestedAt: somePastDate,
    });

    await expect(
      passwordService.resetPassword(userId, lastToken, "somepw")
    ).rejects.toBeInstanceOf(Error);

    await securityService.deleteUser(userId);
  });

  it("Should allow changing username, emails", async () => {
    const { container } = await createEcosystem();

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@john.com",
    });

    await passwordService.setUsername(userId, "12345");

    const data = await passwordService.getData(userId);
    assert.equal("12345", data.username);

    let foundUserId = await passwordService.findUserIdByUsername("12345");
    assert.deepEqual(foundUserId, userId);

    foundUserId = await passwordService.findUserIdByUsername("123456");
    assert.isUndefined(foundUserId);

    await securityService.deleteUser(userId);
  });

  // it("Should properly dispatch the events of invalid password, locking user attempts ", () => {
  //   // TODO: maybe this should be done in another bundle
  // });

  it("It should limit and lock the user after certain invalid attempts, but unlock after some time", async () => {
    const { container } = await createEcosystem({
      failedAuthenticationAttempts: {
        cooldown: "5m",
        lockAfter: 3,
      },
    });

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@john.com",
    });

    // We do 3 checks
    await passwordService.isPasswordValid(userId, "123");
    await passwordService.isPasswordValid(userId, "123");
    await passwordService.isPasswordValid(userId, "123");

    // Now we expect an error to be thrown
    await expect(
      passwordService.isPasswordValid(userId, "123")
    ).rejects.toBeInstanceOf(Error);

    // Cool cool, now let's ensure cooldown works and we're back to zero
    const somePastDate = new Date();
    somePastDate.setFullYear(2000); // The ol' 00s

    passwordService.updateData(userId, {
      lastFailedLoginAttemptAt: somePastDate,
    });

    expect(await passwordService.isPasswordValid(userId, "123")).toBe(false);
    expect(await passwordService.isPasswordValid(userId, "123")).toBe(false);
    expect(await passwordService.isPasswordValid(userId, "123")).toBe(false);
    await expect(
      passwordService.isPasswordValid(userId, "123")
    ).rejects.toBeInstanceOf(Error);

    await securityService.deleteUser(userId);
  });

  it("Should check whether the username already exists and disallow creation", async () => {
    const { container } = await createEcosystem();

    const securityService = container.get(SecurityService);
    const passwordService = container.get(PasswordService);

    const userId = await securityService.createUser();
    await passwordService.attach(userId, {
      password: "123456",
      username: "john@john.com",
    });

    const userId2 = await securityService.createUser();
    expect(
      passwordService.attach(userId2, {
        password: "123456",
        username: "john@john.com",
      })
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsException);

    await passwordService.setUsername(userId, "johnny@johnny.com");

    const userIdFound = await passwordService.findUserIdByUsername(
      "johnny@johnny.com"
    );
    expect(userIdFound).toEqual(userId);
    await passwordService.attach(userId2, {
      password: "123456",
      username: "john@john.com",
    });

    expect(
      passwordService.setUsername(userId, "john@john.com")
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsException);

    await securityService.deleteUser(userId);
    await securityService.deleteUser(userId2);
  });
});
