import { Service, Inject, ContainerInstance } from "@bluelibs/core";
import { DatabaseService } from "@bluelibs/mongo-bundle";
import { EJSON } from "@bluelibs/ejson";
import { PasswordService } from "@bluelibs/password-bundle";
import { PermissionService, SecurityService } from "@bluelibs/security-bundle";

import dataMap from "./{{ fixtureName }}.dataMap";

@Service()
export class {{ fixtureClass }} {
  @Inject()
  passwordService: PasswordService;

  @Inject()
  permissionService: PermissionService;

  @Inject()
  databaseService: DatabaseService;


  async init() {
    if (!(await this.shouldRun())) {
      return;
    }

    await this.clean();
    console.log(`Running app fixtures.`);
    await this.loadData();
    console.log(`Completed app fixtures.`);
  }

  async loadData() {
    for (const collectionName in dataMap) {
      const collection =
        this.databaseService.getMongoCollection(collectionName);
      const documents = dataMap[collectionName].map((document) =>
        EJSON.fromJSONValue(document)
      );
      if (documents.length) {
        await collection.insertMany(documents);
      }

      console.log(`Added fixtures for ${collectionName}`);
    }

    if (dataMap["Users"]) {
      await this.handleUsers();
    }
  }

  async clean() {
    for (const collectionName in dataMap) {
      const collection = this.databaseService.getMongoCollection(
        collectionName
      );
      await collection.deleteMany({});
    }
    await this.databaseService.getMongoCollection("permissions").deleteMany({});
  }

  async handleUsers() {
    const usersCollection = this.databaseService.getMongoCollection("Users");
    const users = await usersCollection.find({}).toArray();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userId = user._id;
      const email = user.email || `user-${i}@bluelibs.com`;

      await this.passwordService.attach(userId, {
        email,
        username: email,
        isEmailVerified: true,
        password: "bluelibs",
      });

      console.log(`Created new login ${email}:bluelibs`);
    }
  }

  // Runs if all data maps are empty
  async shouldRun() {
    for (const collectionName in dataMap) {
      const collection = this.databaseService.getMongoCollection(
        collectionName
      );
      if ((await collection.find().count()) === 0) {
        return true;
      }
    }

    return false;
  }
}
