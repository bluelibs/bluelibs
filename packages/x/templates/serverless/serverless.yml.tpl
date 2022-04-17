# serverless.yml

service: {{ service }}
plugins:
  - serverless-plugin-typescript
  - serverless-offline
provider:
  name: {{ provider }}
  runtime: nodejs12.x
functions:
  graphql:
    # this is formatted as <FILENAME>.<HANDLER>
    handler: src/startup/ServerlessHandler.graphqlHandler
    maximumEventAge: 7200
    maximumRetryAttempts: 1
    events:
      - http:
          path: graphql
          method: post
          cors: true
      - http:
          path: graphql
          method: get
          cors: true
