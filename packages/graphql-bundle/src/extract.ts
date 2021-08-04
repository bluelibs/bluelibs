import { loadFilesSync } from "@graphql-tools/load-files";
import { ILoadOptions } from "./defs";
import * as path from "path";

/**
 * You extract files within the current folder that end in .graphql, User.resolvers.ts and resolvers.ts
 * extract(__dirname) should be used.
 */
export function extract(dir): ILoadOptions {
  const EXT = "!(.d).(ts|js|tsx|jsx)";

  const resolversArray = loadFilesSync(
    path.join(dir, `./**/*.resolvers${EXT}`)
  );

  const resolversTopArray = loadFilesSync(
    path.join(dir, `./**/resolvers${EXT}`)
  );
  const typesArray = loadFilesSync(path.join(dir, `./**/*.graphql${EXT}`), {});
  const modulesArray = loadFilesSync(
    path.join(dir, `./**/*.graphql-module${EXT}`)
  );

  const typesFromModule = modulesArray
    .map((m) => m.typeDefs)
    .filter((e) => Boolean(e));

  const resolversFromModule = modulesArray
    .map((m) => m.resolvers)
    .filter((e) => Boolean(e));

  return {
    resolvers: [
      ...resolversArray,
      ...resolversTopArray,
      ...resolversFromModule,
    ],
    typeDefs: [...typesArray, ...typesFromModule],
  };
}
