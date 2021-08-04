import { QueryBodyType } from "@bluelibs/nova";

export function detectPipelineInSideBody(body: any) {
  if (!body) {
    return;
  }

  if (body.$) {
    if (body.$.pipeline) {
      throw new Error(
        `Pipeline option not allowed in the specified sideBody. Allowing it would be dangerous and can result to a malicious injection.`
      );
    }
  }

  for (const key in body) {
    if (key !== "$" && typeof body[key] === "object") {
      detectPipelineInSideBody(body[key]);
    }
  }
}
