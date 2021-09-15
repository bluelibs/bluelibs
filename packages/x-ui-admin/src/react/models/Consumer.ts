export type ConsumerIdableType = {
  id: string;
  order?: number;
  nest?: ConsumerIdableType[];
};

class AlreadyConsumedError extends Error {}
class ElementNotFoundError extends Error {}

export class Consumer<
  T extends ConsumerIdableType = ConsumerIdableType,
  Keys = any[]
> {
  static Errors = {
    AlreadyConsumed: AlreadyConsumedError,
    ElementNotFound: ElementNotFoundError,
  };

  protected totalCount = 0;
  protected consumedCount = 0;
  /**
   * This field represents whether at least one element has been consumed
   */
  protected consumptionStarted = false;

  protected elements: T[] = [];
  protected consumedMap: {
    [id: string]: boolean;
  } = {};

  constructor(elements: T[] = []) {
    this.totalCount = elements.length;
    elements.forEach((element) => {
      this.add(element);
    });
  }

  clone(): Consumer<T> {
    const newElements = this.elements.map((element) =>
      Object.assign({}, element)
    );
    return new Consumer(newElements);
  }

  /**
   * Consumes element and returns it.
   * @throws If element is already consumed
   * @param id
   * @returns
   */
  consume(id: string): T | never {
    this.consumptionStarted = true;
    const element = this.findElement(id);
    if (this.isElementConsumed(id)) {
      throw new Consumer.Errors.AlreadyConsumed(
        `You have tried to consume: ${id} but it was already consumed.`
      );
    }

    this.consumedMap[id] = true;
    this.consumedCount++;

    return element;
  }

  /**
   * This function returns the element without consuming it
   * @param id
   * @returns
   */
  findElement(id: string | string[], throwOnNotFound = true): T | never {
    let element;
    if (Array.isArray(id)) {
      let elements = this.elements;
      for (let i = 0; i < id.length; i++) {
        if (!elements) break;

        element = elements.find((e) => e.id === id[i]);
        elements = element.nest;
      }
    } else {
    }
    element = this.elements.find((e) => e.id === id);
    if (!element && throwOnNotFound) {
      throw new Consumer.Errors.ElementNotFound(
        `You have tried to access: ${id} but the element with that id does not exist`
      );
    }
    return element;
  }

  /**
   * Updates a given consumer element
   * @param id
   * @param data
   */
  update(id: string | string[], data: Partial<T>) {
    this.checkAgainstConsumptionStarted();
    const element = this.findElement(id);

    Object.assign(element, data);
  }

  /**
   *
   * @param id
   */
  remove(id: string) {
    this.checkAgainstConsumptionStarted();
    this.elements = this.elements.filter((e) => e.id !== id);
  }

  /**
   * @param data
   */
  add(data: T | T[]) {
    if (Array.isArray(data)) {
      return data.map((element) => this.add(element));
    }

    this.checkAgainstConsumptionStarted();

    if (this.findElement(data.id, false)) {
      throw new Error(
        `You cannot add the element with id "${data.id}" because another one with the same id already exists.`
      );
    }

    this.elements.push(data);
  }

  /**
   * Returns the rest of unconsumed ids and consumes them
   */
  rest(): T[] {
    this.consumptionStarted = true;
    const consumedIds = Object.keys(this.consumedMap);

    const rest = this.elements.filter(
      (element) => !consumedIds.includes(element.id)
    );

    rest.forEach((r) => {
      this.consumedMap[r.id] = true;
    });

    this.consumedCount = this.totalCount;

    return rest.sort((a, b) => {
      const result = a.order - b.order;
      if (isNaN(result)) {
        return 0;
      }

      return result;
    });
  }

  /**
   * Check if element has been consumed
   * @param id
   * @returns
   */
  isElementConsumed(id: string): boolean {
    return this.consumedMap[id] === true;
  }

  /**
   * Checks if the whole consumer has been consumed
   * @returns
   */
  isConsumed(): boolean {
    return this.consumedCount === this.totalCount;
  }

  /**
   * Throws exception if consumption started
   */
  protected checkAgainstConsumptionStarted() {
    if (this.consumptionStarted) {
      throw new Error("Operation not permitted. Consumption already started.");
    }
  }
}
