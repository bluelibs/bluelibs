import { useState, useEffect, useMemo } from "react";
import { Constructor } from "@bluelibs/core";
import { Collection } from "../../graphql/Collection";
import { IQueryInput, QueryBodyType } from "../../graphql/defs";

import { use } from "@bluelibs/x-ui-react-bundle";
import { QueryHookOptions } from "@apollo/client";

type RefetchType = () => Promise<void>;

export type UseDataStateType<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: RefetchType;
};

/**
 * Use this when you want to easily fetch data with hooks for multiple documents
 */
export function useData<T>(
  collectionClass: Constructor<Collection<T>>,
  queryOptions: IQueryInput<T> = {},
  body: QueryBodyType<T>
): UseDataStateType<Partial<T>[]> {
  const collection = use(collectionClass);
  const requestSignature = JSON.stringify(queryOptions);

  const fetch = useMemo<RefetchType>(() => {
    return async () =>
      collection
        .find(queryOptions, body)
        .then((documents) => {
          setDataState({
            data: documents,
            isLoading: false,
            error: null,
            refetch: fetch,
          });
        })
        .catch((err) => {
          setDataState({
            data: null,
            isLoading: false,
            error: err,
            refetch: fetch,
          });
        });
  }, [requestSignature]);

  const [dataState, setDataState] = useState<UseDataStateType<Partial<T>[]>>({
    data: null,
    error: null,
    isLoading: true,
    refetch: fetch,
  });

  useEffect(() => {
    fetch();
  }, [requestSignature]);

  return dataState;
}

/**
 * Use this when you want to easily fetch data with hooks for multiple documents
 */
export function useDataOne<T>(
  collectionClass: Constructor<Collection<T>>,
  _id: any,
  body: QueryBodyType<T>
  // options: QueryOp = {},
): UseDataStateType<Partial<T>> {
  const filters = { _id };
  const collection = use(collectionClass);
  const requestSignature = _id.toString() + JSON.stringify(body);

  const fetch = useMemo<RefetchType>(() => {
    return async () =>
      collection
        .findOne({ filters }, body)
        .then((document) => {
          setDataState({
            data: document,
            isLoading: false,
            error: null,
            refetch: fetch,
          });
        })
        .catch((err) => {
          setDataState({
            data: null,
            isLoading: false,
            error: err,
            refetch: fetch,
          });
        });
  }, [requestSignature]);

  const [dataState, setDataState] = useState<UseDataStateType<Partial<T>>>({
    data: null,
    error: null,
    isLoading: true,
    refetch: fetch,
  });

  useEffect(() => {
    fetch();
  }, [requestSignature]);

  return dataState;
}
