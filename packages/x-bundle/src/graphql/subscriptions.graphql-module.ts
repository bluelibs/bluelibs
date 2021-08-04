export default {
  typeDefs: /* GraphQL */ `
    type SubscriptionEvent {
      event: SubscriptionEventType!
      document: EJSON
    }

    type SubscriptionCountEvent {
      count: Int
    }

    enum SubscriptionEventType {
      added
      changed
      removed
      ready
    }
  `,
  resolvers: {
    SubscriptionEventType: {
      added: "added",
      changed: "changed",
      removed: "removed",
      ready: "ready",
    },
  },
};
