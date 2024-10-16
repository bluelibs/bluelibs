// CounterSmart.tsx
import React, { createContext } from "react";
import { Smart } from "../";

type CounterState = {
  count: number;
};

export class CounterSmart extends Smart<CounterState> {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  increment() {
    this.updateState({ count: this.state.count + 1 });
  }

  decrement() {
    this.updateState({ count: this.state.count - 1 });
  }
}
