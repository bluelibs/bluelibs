import { Constructor, ContainerInstance, Inject } from "@bluelibs/core";
import { Smart } from "@bluelibs/smart";
import {
  MongoFilterQuery,
  IQueryOptions,
  QueryBodyType,
  Collection,
} from "../../graphql";

//
// The initial filters need to be kept
// Only options juggle should be sort order?
export type SortOptions = {
  [field: string]: 1 | -1;
};

export type ListState<T = any> = {
  isLoading: boolean;
  isError: boolean;
  isCountLoading: boolean;
  isCountError: boolean;
  documents: T[];
  filters: MongoFilterQuery<T>;
  options: IQueryOptions<T>;
  currentPage: number;
  perPage: null | number;
  totalCount: number;
  errorMessage: string;
  countErrorMessage: string;
};

export type ListConfig<T = any> = {
  collectionClass?: Constructor<Collection<T>>;
  body?: QueryBodyType<T>;
  /**
   * These filters are always going to be applied regardless of what you apply later on, use `initialFilters` if you plan on overriding them
   */
  filters?: MongoFilterQuery<T>;
  /**
   * These filters are applied initially on the list, they can be overriden later on.
   */
  initialFilters?: MongoFilterQuery<T>;
  initialOptions?: IQueryOptions<T>;
  sort?: SortOptions;
  perPage?: null | number;
};

type LoadOptions = {
  /**
   * When page changes or when sort filters are applied, the count doesn't change
   * This is why we only count when filters change and initially
   */
  count?: boolean;
};

export abstract class ListSmart<T = any> extends Smart<
  ListState<T>,
  ListConfig<T>
> {
  @Inject(() => ContainerInstance)
  protected readonly container: ContainerInstance;

  body: QueryBodyType<T>;
  collectionClass: Constructor<Collection<T>>;
  protected collection: Collection<T>;
  protected alwaysOnFilters: MongoFilterQuery<T>;

  state = {
    isLoading: true,
    isError: false,
    documents: [],
    filters: {},
    options: {},
    isCountLoading: true,
    isCountError: false,
    errorMessage: "",
    countErrorMessage: "",
    totalCount: 0,
    currentPage: 1,
    // What if I want to pass it through config? Maybe update it there.
    perPage: 20,
  };

  setConfig(config?: ListConfig<T>) {
    if (!config) {
      config = {};
    }

    if (config.collectionClass) {
      this.collectionClass = config.collectionClass;
    }
    if (config.body) {
      this.body = Object.assign({}, config.body);
    }

    if (config.initialFilters) {
      this.state.filters = Object.assign({}, config.initialFilters);
    }
    if (config.initialOptions) {
      this.state.options = Object.assign({}, config.initialOptions);
    }

    if (config.filters) {
      this.alwaysOnFilters = Object.assign({}, config.filters);
    } else {
      this.alwaysOnFilters = Object.assign({}, this.body?.$?.filters || {});
    }

    this.config = config;
    if (config.perPage) {
      this.state.perPage = config.perPage;
    }
  }

  async init() {
    this.collection = this.container.get(this.collectionClass);
    this.load({
      count: true,
    });
  }

  load(loadOptions: LoadOptions = {}) {
    if (this.state.isLoading === false) {
      this.updateState({ isLoading: true });
    }

    if (loadOptions.count) {
      // We count silently without dispatching change events
      this.count(true);
    }

    this.collection
      .find(
        {
          filters: {
            ...this.state.filters,
            ...this.alwaysOnFilters,
          },
          options: {
            ...this.getSortOptions(),
            ...this.state.options,
            ...this.getPaginationOptions(),
          },
        },
        this.getBody()
      )
      .then((documents) => {
        this.updateState(
          {
            isLoading: false,
            isError: false,
            documents,
          },
          {
            silent: true,
          }
        );
        this.inform();
      })
      .catch((err) => {
        this.updateState(
          {
            isLoading: false,
            isError: true,
            errorMessage: err.toString(),
          },
          {
            silent: true,
          }
        );
        this.inform();
      });
  }

  /**
   * Sets the new sort and requeries
   * @param sort
   */
  setSort(sort: SortOptions) {
    this.config.sort = sort;
    this.setCurrentPage(1, { load: false });
    this.load();
  }

  /**
   * Performs count and updates the state
   * Use silent true if you don't want too many state changes.
   */
  count(silent = false) {
    this.updateState(
      {
        isCountLoading: true,
      },
      {
        silent,
      }
    );
    this.collection
      .count({
        ...this.state.filters,
        ...this.alwaysOnFilters,
      })
      .then((count) => {
        this.updateState(
          {
            isCountLoading: false,
            isCountError: false,
            totalCount: count,
          },
          {
            silent,
          }
        );
      })
      .catch((err) => {
        this.updateState(
          {
            isCountLoading: false,
            isCountError: true,
            countErrorMessage: err.toString(),
          },
          {
            silent,
          }
        );
      });
  }

  setCurrentPage(page: number, options: { load?: boolean } = { load: true }) {
    this.updateState({ currentPage: page });
    if (options.load) {
      this.load();
    }
  }

  extendFilters(filters: MongoFilterQuery<T>) {
    this.updateState({
      filters: {
        ...this.state.filters,
        ...filters,
        ...this.alwaysOnFilters,
      },
    });
    this.load({
      count: true,
    });
  }

  /**
   * Updates the current filters. Does not override the initial filters set in this smart.
   * @param filters
   */
  setFilters(filters: MongoFilterQuery<T>) {
    this.updateState({
      filters,
    });
    // We ensure that the first page is displayed, this is done because if he is on page 5
    // And the filters only have 2 pages. It will display no data.
    this.setCurrentPage(1, { load: false });
    this.load({
      count: true,
    });
  }

  updateSort(name: T extends null ? string : keyof T, order: 1 | -1) {
    this.updateState({
      options: {
        ...this.state.options,
        sort: {
          [name]: order,
        },
      },
    });
    this.load();
  }

  getBody(): QueryBodyType<T> {
    return this.body;
  }

  /**
   * Gets options for pagination if pagination exists
   */
  protected getPaginationOptions(): IQueryOptions<T> {
    const options: IQueryOptions = {};
    if (this.state.perPage > 0) {
      options.limit = this.state.perPage;
      options.skip = (this.state.currentPage - 1) * options.limit;
    }

    return options;
  }

  /**
   * Retrieves the current sort options
   */
  protected getSortOptions() {
    if (this.config.sort) {
      return {
        sort: this.config.sort,
      };
    }
  }

  get pageCount() {
    if (!this.state.perPage) {
      return 1;
    }

    return Math.ceil(this.state.totalCount / this.state.perPage);
  }
}
