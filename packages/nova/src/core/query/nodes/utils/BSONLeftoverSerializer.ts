import { Serializer } from "@deepkit/type";
import { ObjectId } from "mongodb";

export const BSONLeftoverSerializer = new Serializer("custom serializer");
BSONLeftoverSerializer.toClass.register("date", (property, compiler) => {
  compiler.addSetter(`new Date(${compiler.accessor})`);
});
BSONLeftoverSerializer.toClass.register("objectId", (property, compiler) => {
  compiler.setContext({
    ObjectId,
  });
  // compiler.addCodeForSetter('const ObjectId = require("mongodb").ObjectId');
  compiler.addSetter(`new ObjectId(${compiler.accessor})`);
});
