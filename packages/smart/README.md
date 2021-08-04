<h1 align="center">BlueLibs SMART</h1>

<p align="center">
  <a href="https://travis-ci.org/bluelibs/smart">
    <img src="https://api.travis-ci.org/bluelibs/smart.svg?branch=master" />
  </a>
  
  <a href="https://coveralls.io/github/bluelibs/smart?branch=master">
    <img src="https://coveralls.io/repos/github/bluelibs/smart/badge.svg?branch=master" />
  </a>
</p>

Smart is a simple tool which allows you to decouple state and logic from your components.

Goodies:

- ✅ Uses React Hooks behind the scenes
- ✅ Manage state and actions separately from your components
- ✅ TypeScript auto-completion at every step
- ✅ Ultra light-weight
- ✅ Integration with Redux DevTools

## Install

```bash
npm install --save @bluelibs/smart
```

```tsx
import { Smart, smart } from "@bluelibs/smart";

// This is where you make api queries and this is where you set or update the state
class Counter extends Smart {
  state = {
    count: 0,
  };

  increment() {
    this.setState({ count: this.state.count + 1 });
  }
}

// Components just call the Counter and use `counter.state`
function Component() {
  const counter = useSmart(Counter);

  // Access to api.state
  // Ability to trigger api.increment()
}

smart(Counter)(Component);
```

## [Documentation](./DOCUMENTATION.md)

[Click here to go to the documentation](./DOCUMENTATION.md)

## Support

This package is part of [BlueLibs](https://www.bluelibs.com) family. If you enjoy this work please show your support by starring [the main package](https://github.com/bluelibs/bluelibs). If not, let us know what can we do to deserve it, [our feedback form is here](https://forms.gle/DTMg5Urgqey9QqLFA)
