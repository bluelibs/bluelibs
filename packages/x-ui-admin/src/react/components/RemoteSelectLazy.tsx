import * as React from "react";
import { Constructor } from "@bluelibs/core";
import { Collection, use, useData } from "@bluelibs/x-ui";
import { Alert, Select, SelectProps, Spin } from "antd";
import { ObjectId } from "@bluelibs/ejson";
import * as debounce from "lodash.debounce";

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType>, "options" | "children"> {
  fetchOptions: (search: string) => Promise<ValueType[]>;
  debounceTimeout?: number;
}

function DebounceSelect<
  ValueType extends {
    key?: string;
    label: React.ReactNode;
    value: string | number;
  } = any
>({ fetchOptions, debounceTimeout = 250, ...props }: DebounceSelectProps) {
  const [fetching, setFetching] = React.useState(false);
  const [options, setOptions] = React.useState<ValueType[]>([]);
  const fetchRef = React.useRef(0);

  const loadOptions = React.useMemo(() => {
    return (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };
  }, [fetchOptions]);
  const debounceFetcher = React.useMemo(() => {
    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  React.useEffect(() => {
    loadOptions("");
  }, []);

  return (
    <Select<ValueType>
      filterOption={false}
      showSearch={true}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      onChange={(value, option) => {
        props.onChange(value, option);
        loadOptions("");
      }}
    >
      {options.map((option) => (
        <Select.Option key={option.key} value={option.value}>
          {option.label}
        </Select.Option>
      ))}
    </Select>
  );
}

type RemoteSelectFilterResolver = (searchValue) => any;

export type RemoteSelectLazyProps = SelectProps<any> & {
  collectionClass: Constructor<Collection<any>>;
  /**
   * This is recommended to be a reducer or a GraphQL resolver.
   */
  field: string;
  lazy?: boolean | string | string[] | RemoteSelectFilterResolver;
  /**
   * Max limit of elements to search
   * @default 10
   */
  limit?: number;
  idAsString?: boolean;
};

export function RemoteSelectLazy(props: RemoteSelectLazyProps) {
  let {
    field,
    collectionClass,
    idAsString,
    onChange,
    lazy,
    limit,
    value,
    ...rest
  } = props;

  if (value) {
    if (Array.isArray(value)) {
      value = value.map((v) => v.toString());
    } else {
      value = value.toString();
    }
  }

  const collection: Collection<any> = use(collectionClass);

  return (
    <DebounceSelect
      value={value}
      onChange={(value, option) => {
        if (Array.isArray(value)) {
          onChange &&
            onChange(
              !idAsString ? value.map((v) => new ObjectId(v)) : value,
              option
            );
        } else {
          onChange &&
            onChange(!idAsString ? new ObjectId(value) : value, option);
        }
      }}
      placeholder="Select users"
      fetchOptions={(value) => {
        return collection
          .find(
            {
              filters: getLazyFilters(lazy ? lazy : field, field, value),
              options: {
                limit: limit || 10,
              },
            },
            {
              _id: 1,
              [field]: 1,
            }
          )
          .then((result) => {
            return result.map((r) => {
              return {
                key: r._id.toString(),
                value: r._id.toString(),
                label: r[field] ? r[field] : "N/A",
              };
            });
          });
      }}
      style={{ width: "100%" }}
      {...rest}
    />
  );
}

function getDefaultLazyFilters(field, value: string) {
  return {
    [field]: {
      $regex: value,
      $options: "i",
    },
  };
}

/**
 * Extracts the set of filters based on the lazy search configuration
 *
 * @param lazy
 * @param field
 * @param value
 * @returns
 */
function getLazyFilters(
  lazy: string | string[] | boolean | RemoteSelectFilterResolver,
  field: string,
  value: any
) {
  if (lazy === undefined || value === "" || value === undefined) {
    return {};
  }

  if (lazy === true) {
    return getDefaultLazyFilters(field, value);
  } else if (typeof lazy === "function") {
    return lazy(value);
  } else if (typeof lazy === "string") {
    return getDefaultLazyFilters(lazy, value);
  } else if (Array.isArray(lazy)) {
    return {
      $or: lazy.map((field) => {
        return getDefaultLazyFilters(field, value);
      }),
    };
  }
}
