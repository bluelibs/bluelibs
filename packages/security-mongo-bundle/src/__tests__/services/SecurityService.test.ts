import { SecurityService } from "@bluelibs/security-bundle";
import { securityTestDefinitions } from "@bluelibs/security-bundle/dist/__tests__/reusable";
import { ecosystem } from "../ecosystem";

securityTestDefinitions.forEach(({ message, test: testFunction }) => {
  test(`[Security] ${message}`, async () => {
    const { container } = await ecosystem;
    const service = container.get(SecurityService);

    await testFunction(service);
  });
});
