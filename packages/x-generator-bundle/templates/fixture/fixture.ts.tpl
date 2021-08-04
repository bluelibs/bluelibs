import { Service, Inject, ContainerInstance } from "@bluelibs/core";
{{ importCollectionLine }}

const COUNT = 20;

@Service()
export class {{ fixtureClass }} {
  @Inject()
  container: ContainerInstance;

  async init() {
    if (!await this.shouldRun()) {
      return;
    }

    const {{ collectionVariable }} = this.getCollection();

    console.log(`Running {{ fixtureName }} fixtures.`);

    for (let i = 0; i < COUNT; i++) {
      await {{ collectionVariable }}.insertOne({
        // Enter the details here
      })
    }

    console.log(`Completed {{ fixtureName }} fixtures.`);
  }

  getCollection(): {{ collectionClass }} {
    return this.container.get({{ collectionClass }});
  }

  async shouldRun() {
    return await this.getCollection().find().count() === 0
  }
}