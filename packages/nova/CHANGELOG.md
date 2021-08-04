# Change Log

## 1.8.0

- Added concurrent request mechanisms for deeper queries in hypernova
- Improved projection by marking fields for deletion, thus improving memory consumption and processing speed
- Introduced `$all: true` special field, which gets all the fields and does no projection
- Added opt-in for fetchOne to use `findOne()` from MongoDB Collection as it is faster than aggregate with `limit: 1`

## 1.7.0

- Added high-performance query-ing via JIT BSON decoding techniques

## 1.6.0

- Hardwired filters, allowing links to be configured with "always on" filters

## 1.5.0

- Improvements fixes, over 10x in some cases with large data sets
- Moved to mongodb Collection, deprecated ICollection interface
- Added extensive benchmark tests

## 1.4.0

- Added context into query, allowing reducers to have a context
- Added sideBody into AstToQueryOptions allowing merge between graphs
- Exported intersectDeep and mergeDeep as they may be useful outside

## 1.3.1

- Added ability to have type-safety for your request body with nesting support

## 1.3.0

- All interfaces now start with I
- Easier filtering added for GraphQL queries

## 1.2.0

- Dropped "index" utility, developers should implement their own
- Removed mongodb dependency and added aggregable interface

## 1.1.0

- Relational filtering and sorting
- Smart aggregable reducers
- Collection aliasing

## 1.0.0

- The standard features including hypernova
