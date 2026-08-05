export function detectPipelineInSideBody(body: unknown) {
  if (!body) {
    return;
  }

  const bodyObject = body as Record<string, unknown> & {
    $?: { pipeline?: unknown };
  };

  if (bodyObject.$) {
    if (bodyObject.$.pipeline) {
      throw new Error(
        `Pipeline option not allowed in the specified sideBody. Allowing it would be dangerous and can result to a malicious injection.`
      );
    }
  }

  for (const key in bodyObject) {
    if (key !== "$" && typeof bodyObject[key] === "object") {
      detectPipelineInSideBody(bodyObject[key]);
    }
  }
}
