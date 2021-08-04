import { createKernel } from "./ecosystem";
import { MikroORM, ORM } from "../";
import { MikroORMBundle } from "../MikroORMBundle";
import { Bundle } from "@bluelibs/core";
import { Comment } from "./entities/Comment";

test("should instantiate it properly", async () => {
  const kernel = createKernel();

  class MyBundle extends Bundle {
    async prepare() {
      const ormBundle = this.container.get(MikroORMBundle);
      ormBundle.load([Comment]);
    }
  }

  kernel.addBundle(new MyBundle());
  await kernel.init();

  const orm = kernel.container.get(ORM);
  expect(orm).toBeInstanceOf(MikroORM);

  const comment = new Comment();
  comment.text = "hello!!";
  orm.em.persist(comment);
  await orm.em.flush();

  const result = await orm.em.findOne(Comment, {
    _id: comment._id,
  });
  expect(result.text).toBe("hello!!");

  await kernel.shutdown();
});
