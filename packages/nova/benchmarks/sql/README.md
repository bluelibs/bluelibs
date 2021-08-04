# Setup

```bash
npm install
```

Control the database connections: `src/nova/db.ts` and `src/sql/db.ts`.

When benchmarking run we drop the databases, run fixtures and run the test suites.

The relational structure we have is pretty simple, and mimics a blog with users:

- Posts belong to a user
- Comments belong to a post and a user
- A post can have many tags
- A post can have one category
- A user can belong in multiple groups

We control how many of which we have from here: `src/constants.ts`.

The test suite code is pretty straight forward, we have a map of functions that perform these relational queries stored in `src/nova/tests.ts` and `src/sql/tests.sequelize.ts` and `src/sql/tests.raw.ts`.

We compare `Nova` against `Sequelize` which not only does the query, but also transforms the result into objects which make it usable in real-world applications, but we also want to test how much time the `RAW SQL` queries take so we use `knex` to achieve that.

**It is unfair**, ofcourse, to compare `Nova` against `RAW SQL` as Nova has its own processes of query exection planning, node creation, preparing the result for delivery, cleaning up the results and etc, but it is an interesting comparison to see.

In case of "Nova" we don't actually count these raw queries as they are deeply stored into the hypernova function which does all the magic.

```bash
npm run benchmark:sql
npm run benchmark:sql:raw
npm run benchmark:nova
```

# Results (localhost)

Database is localhost which is in advantage of SQL, because we claim that Nova is bandwidth efficient:

## Sequelize

```
Full Database Dump - Users {
  fastest: '128ms',
  slowest: '180ms',
  mean: '135.32ms',
  firstRun: '169ms',
  iterations: 100
}
Full Database Dump - Comments {
  fastest: '218ms',
  slowest: '271ms',
  mean: '229.19ms',
  firstRun: '242ms',
  iterations: 100
}
Get all posts that belong to users in a specific group {
  fastest: '4ms',
  slowest: '13ms',
  mean: '7.74ms',
  firstRun: '11ms',
  iterations: 100
}
Get all posts sorted by category name {
  fastest: '7ms',
  slowest: '14ms',
  mean: '10.72ms',
  firstRun: '14ms',
  iterations: 100
}
```

## RAW SQL

```
Full Database Dump - Users {
  fastest: '17ms',
  slowest: '30ms',
  mean: '17.52ms',
  firstRun: '30ms',
  iterations: 100
}
Full Database Dump - Comments {
  fastest: '18ms',
  slowest: '21ms',
  mean: '18.91ms',
  firstRun: '20ms',
  iterations: 100
}
Get all posts that belong to users in a specific group {
  fastest: '2ms',
  slowest: '4ms',
  mean: '2.3ms',
  firstRun: '4ms',
  iterations: 100
}
Get all posts sorted by category name {
  fastest: '2ms',
  slowest: '13ms',
  mean: '2.55ms',
  firstRun: '13ms',
  iterations: 100
}
```

## Nova

```
Full Database Dump - Users {
  fastest: '40ms',
  slowest: '62ms',
  mean: '50.9ms',
  firstRun: '54ms',
  iterations: 100
}
Full Database Dump - Comments {
  fastest: '50ms',
  slowest: '72ms',
  mean: '60.37ms',
  firstRun: '50ms',
  iterations: 100
}
Get all posts that belong to users in a specific group {
  fastest: '3ms',
  slowest: '8ms',
  mean: '5.27ms',
  firstRun: '6ms',
  iterations: 100
}
Get all posts sorted by category name {
  fastest: '15ms',
  slowest: '49ms',
  mean: '19.47ms',
  firstRun: '49ms',
  iterations: 100
}
```

# Conclusions

For the queries in `localhost` we have the following means:

Nova, 50.9, 60.37, 6, 19.47
RAW SQL, 17.52, 18.91, 2.3, 2.55
Sequelize, 135.32, 229, 7.74ms, 10.72

It's clear the winner is `RAW SQL` but the results we receive need to be formatted and that formatting takes time, as we can see in `Sequelize`. Where Nova doesn't shine is in the Test #4 which is "Relational Sorting" (Sorting documents by a field in other collection)

So, if we compare it with Sequelize, a real-world sample of ORM we have the following improvements: 2.65x, 3.81x, 1.29x, 0.5x

`Local Network` results can be found here:
https://docs.google.com/spreadsheets/d/1cA2c6e9YvE-fA8LEaDwukgrvYNOIo8RmNjy8cPWby1g/edit#gid=0

Tested with AWS in `eu-central-1` region.
