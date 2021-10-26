## Purpose

Sometimes our applications are simpli `cli` interfaces, or we need `cli` tooling to perform operations we don't expose as an external-callable API. These type of operations can be "logging all users out", "creating a new user", "dropping a collection", "running fixtures", things that developers use to make their life better.

The cli tooling is beautifully embedded into the BlueLibs ecosystem allowing you to hook it on existing applications or just start new ones.

```bash
npm i -S @bluelibs/terminal-bundle
```

```ts
// file: src/cli.ts
#!/usr/bin/env node
import { TerminalBudle } from "@bluelibs/terminal-bundle";

const kernel = new Kernel({
  bundles: [
    new TerminalBundle({
      // You can also add commands from within your bundles
      // via CommanderService.registerCommand()
      commands: [],
    }),
  ],
});
```

## Command Types

We have several ways of interraction with the person who runs the cli command, you either pass everything in the command (you just execute logic) or you get asked several questions about what you are about to do (you get `Inquired`).

:::note
From the ground-up, `Terminal` has been designed to support extremely adaptable code generation tooling for the cli, this is why we create the distinction between `Executor` and `Writer`. A writer is decorated with some additional logic to support its execution.
:::

### Inquire & Write

- An inquirer, responsible for asking the right questions from you
- A writer, responsible of taking the model extracted by the inquirer and transforming it into files

### Executor

- Simply executes a function with arguments you can pass from command line

:::note
Not to be confused with a GraphQL Executor, which is completely independent from this term from here.
:::

### Inquire & Executor

- An inquirer, responsible for asking the right questions from you
- Simply executes a function with the model from Inquire & Executor

## Creating a command

```typescript
import { Service, Inject, ContainerInstance } from "@bluelibs/core";

type Model = {
  collectionName: string;
}

@Service()
class DropCollectionCommand implements IExecutor<Model> {
  @Inject()
  protected readonly container: ContainerInstance;

  execute(model) {
    // get the db service via injection in constructor
    // drop model.collectionName
  }
}

// In init() phase of your bundle
import { CommanderService } from "@bluelibs/terminal-bundle";

CommanderService.registerCommand({
  id: "app:drop-collection"
  executor: DropCollectionCommand
});
```

## Command Line

You can run `.ts` files directly using `ts-node` package:

```bash
npm i -g ts-node
```

```bash
ts-node src/cli.ts --help
ts-node src/cli.ts run "app:drop-collection"

# Autocompletion for your commands
ts-node src/cli.ts
```

:::note
If you want a native runner without specifying node, the `ts` file must have on the first line: `#!/usr/bin/env node` this will allow execution without `ts-node` simply calling. If you get `permissions denied` try giving it an executable mode `chmod 755 ./dist/cli.ts`
:::

You can also create the model from `JS eval`:

```bash
./cli run app:drop-collection --model "{ collectionName: 'users' }"
```

## App Integration

If you want the cli to work with your app you would have to have 2 kernels, one that contains the bundles which are shared between the cli and the app and the other one with all the bundles.

```ts
export const cliBundles = [new BlaBlaBundle()];
```

Typically we avoid having in our cli things such as `HTTPBundle()` things that start servers or APIs. But if your `AppBundle` is dependent on it to run, you'll have to add it and maybe ensure that the HTTP ports aren't exposed and are different maybe. Sometimes you can elimiante this dependency by adding a kernel parameter:

```ts
const kernel = new Kernel({
  parameters: {
    isCli: true,
  },
  bundles: [...cliBundles],
});
```

And now in your `AppBundle` you do `container.get("%isCli%")` and you make it behave.

## Asking Questions

Let's explore how we can use the inquirer to ask questions.

```typescript
import { Shortcuts, Inquirer } from "@bluelibs/terminal-bundle";

class DropCollectionModel {
  collectionName: string;
}

class DropCollectionInquirer extends Inquirer<DropCollectionModel> {
  model = new DropCollectionModel();

  async inquire() {
    // This will inject the returned value of the inpuit
    await this.prompt(
      "collectionName",
      Shortcuts.input("Enter the collection name")
    );
    // DO: get the db service via injection in constructor and drop it

    // Big version
    await this.prompt("collectionName", {
      question: {
        // things from inquirer.js
        message: "Enter a collection name",
        type: "input",
      },
    });

    // You can re-use inquirers and store it inside this model
    await this.prompt("address", {
      inquirer: AddressInquirer,
    });

    // You can also infinitely ask for stuff and store in an array
    await this.prompt(
      "addresses",
      {
        inquirer: AddressInquirer, // works with questions also!
        default: SomeDefaultAddress,
      },
      {
        many: true,
        // What to ask after an address has been inputted
        continuationMessage: "Add another address?",
      }
    );

    // This will infinitely
  }
}

// Now re-use the same executor
CommanderService.registerCommand({
  id: "app:drop-collection",
  inquirer: DropCollectionInquirer,
  executor: DropCollectionCommand,
});
```

## Writers

:::note
This part is not required for you to learn, there's a small change you are planning on using this for code generators, so feel free to skip it.
:::

Now, we could have used executor to write files, but the problem is that writing files requires additional logic this is why we introduce the "writer":

```typescript
import { BlueprintWriter, IBlueprintWriterSession } from "@bluelibs/terminal-bundle";
import _ from 'lodash';

class CollectionBlueprintWriter extends BlueprintWriter<DropCollectionModel> {
  // Not that you can use Inject and have access to the container via this.container

  async write(model: DropCollectionModel, session: IBlueprintWriterSession) {
    session.append(`src/bundles/core/${model.collectionName}`, renderYourTemplateSomehow(model)));

    // Compose with other writers if you do have them and pass them the current session
    this.getWriter(CollectionHooks).write(model.hooks, session);

    // You just push things to session, you do not commit anything
    session.afterCommit(() => {
      // Your files have been written
    })
  }
}
```

## Meta

### Summary

Terminal allows us to embed the cli into our application and run things in a type-safe and scalable way.

### Boilerplates

- [Terminal](https://stackblitz.com/edit/node-zjpqxy?file=README.md)

### Challenges

- Create a cli command that accepts the command "get:weather" and returns the weather from your city (1p)
- Create an inquirer which asks for "firstName" and "lastName" and the executor prints the google search link for it.
