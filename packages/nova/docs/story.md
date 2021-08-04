# Story

Everything started late-2015 when we adopted Meteor in our company [Cult of Coders](https://www.cultofcoders.com).

One of our first Meteor projects was a [social network for artwork collectors](https://www.collecteurs.com) and as Meteor was bound to MongoDB we had to find a way to retrieve related data without writing a bunch of code.

We started developing an internal framework that exposed an API to allow GraphQL like queries, by using a simple, straight forward recursive algorithm:

```js
Users.query({
  stuff: 1,
  comments: {
    // <- This is a collection
    name: 1,
  },
});
```

And it worked like a charm. However, a year later, we had to abandon our internal framework as Meteor evolved and exposed `npm` and other development patterns emerged. However, from that framework alone, Nova was decoupled and published on GitHub https://github.com/cult-of-coders/grapher and became available inside Meteor.

We started getting adoption in the community, but we were bound to Meteor, while something like this could be done using `mongodb` native Node drivers, and allow the whole world feast on it. This library has been battle-tested across the years, and it's a pillar of in**nova**tion.

I hope you will enjoy this work!

Coded with love,
Theo.
