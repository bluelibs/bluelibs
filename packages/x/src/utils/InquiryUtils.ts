import { IInquirer, Shortcuts } from "@bluelibs/terminal-bundle";
import { FSUtils } from "./FSUtils";
import { XElementType, XElements } from "./XElements";

export class InquiryUtils {
  static async inquireAllBundles(inquirer: IInquirer, field = "bundleName") {
    const microservicePath = FSUtils.getNearest("microservice");
    const allBundles = FSUtils.listBundles(microservicePath);
    let defaultBundle = null;
    if (allBundles.includes("core")) {
      defaultBundle = "core";
    } else {
      defaultBundle = allBundles[0];
    }

    await inquirer.prompt(
      field,
      Shortcuts.autocomplete(
        "Select the bundle",
        FSUtils.listBundles(microservicePath),
        defaultBundle
      )
    );
  }

  static async inquireXElement(
    inquirer: IInquirer,
    field,
    type: XElementType,
    message = null
  ) {
    const microserviceDir = FSUtils.getNearest("microservice");
    const elements = XElements.findElements(type, microserviceDir);

    const list = elements.map((element) => {
      return {
        id: element.bundleName + ":" + element.identityName,
        value: element,
      };
    });

    message = message || `Select the ${type}`;

    await inquirer.prompt(field, Shortcuts.autocomplete(message, list));
  }
}
