export default /* GraphQL */`
  type Query {
    {{ crudName }}FindOne(query: QueryInput): {{ entityType }}
    {{ crudName }}Find(query: QueryInput): [{{ entityType }}]!
    {{ crudName }}Count(query: QueryInput): Int!
  }

  type Mutation {
    {{# if hasCustomInputs }}
      {{ crudName }}InsertOne(document: {{ insertInputName }}Input!): {{ entityType }}
      {{ crudName }}UpdateOne(_id: ObjectId!, document: {{ updateInputName }}Input!): {{ entityType }}!
    {{ else }}
      {{ crudName }}InsertOne(document: EJSON!): {{ entityType }}
      {{ crudName }}UpdateOne(_id: ObjectId!, modifier: EJSON!): {{ entityType }}!
    {{/ if }}
    {{ crudName }}DeleteOne(_id: ObjectId!): Boolean
  }

  {{# if hasSubscriptions }}
    type Subscription {
      {{ crudName }}Subscription(body: EJSON): SubscriptionEvent
      {{ crudName }}SubscriptionCount(filters: EJSON): SubscriptionCountEvent
    }
  {{/ if }}
`