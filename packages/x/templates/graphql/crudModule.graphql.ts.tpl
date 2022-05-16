export default /* GraphQL */`

  type Query {
     {{# if crudOperations.findOne }}
      {{ crudName }}FindOne(query: QueryInput): {{ entityType }}
     {{/ if }}
     {{# if crudOperations.find }}
      {{ crudName }}Find(query: QueryInput): [{{ entityType }}]!
      {{/ if }}
     {{# if crudOperations.count }}
      {{ crudName }}Count(query: QueryInput): Int!
      {{/ if }}
  }

  type Mutation {
    {{# if hasCustomInputs }}
      {{# if crudOperations.insertOne }}
        {{ crudName }}InsertOne(document: {{ insertInputName }}Input!): {{ entityType }}
      {{/ if }}
      {{# if crudOperations.updateOne }}
        {{ crudName }}UpdateOne(_id: ObjectId!, document: {{ updateInputName }}Input!): {{ entityType }}!
      {{/ if }}
    {{ else }}
      {{# if crudOperations.insertOne }}
        {{ crudName }}InsertOne(document: EJSON!): {{ entityType }}
      {{/ if }}
      {{# if crudOperations.updateOne }}
        {{ crudName }}UpdateOne(_id: ObjectId!, modifier: EJSON!): {{ entityType }}!
      {{/ if }}
    {{/ if }}
    {{# if crudOperations.deleteOne }}
      {{ crudName }}DeleteOne(_id: ObjectId!): Boolean
    {{/ if }}
  }

  {{# if hasSubscriptions }}
    type Subscription {
       {{# if crudOperations.subscription }}
        {{ crudName }}Subscription(body: EJSON): SubscriptionEvent
      {{/ if }}
       {{# if crudOperations.subscriptionCount }}
        {{ crudName }}SubscriptionCount(filters: EJSON): SubscriptionCountEvent
      {{/ if }}
    }
  {{/ if }}
`