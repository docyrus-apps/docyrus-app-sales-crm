// Generated shared types for collections

/**
 * A single filter rule that matches a field against a value using an operator.
 *
 * @example
 * ```ts
 * // Exact match
 * { field: "status", operator: "eq", value: "active" }
 *
 * // Greater than
 * { field: "amount", operator: "gt", value: 100 }
 *
 * // Contains text
 * { field: "name", operator: "contains", value: "john" }
 *
 * // Is null check
 * { field: "deleted_at", operator: "is_null" }
 *
 * // In list
 * { field: "status", operator: "in", value: ["active", "pending"] }
 *
 * // With filter type for value casting
 * { field: "created_on", operator: "gte", value: "2024-01-01", filterType: "date" }
 * ```
 */
export interface ICollectionFilterRule {
  /** Filter field/column slug */
  field?: string;
  /** Filter operator */
  operator: string;
  /** Filter value. Can be a string, number, boolean, or an array of strings/numbers */
  value?: unknown;
  /** Filter type for value casting */
  filterType?: string | null;
}

/**
 * A group of filter rules combined with a logical combinator.
 * Groups can be nested to create complex filter expressions.
 *
 * @example
 * ```ts
 * // Simple AND filter
 * {
 *   rules: [
 *     { field: "status", operator: "eq", value: "active" },
 *     { field: "age", operator: "gte", value: 18 }
 *   ],
 *   combinator: "and"
 * }
 *
 * // Nested OR inside AND
 * {
 *   rules: [
 *     { field: "status", operator: "eq", value: "active" },
 *     {
 *       rules: [
 *         { field: "role", operator: "eq", value: "admin" },
 *         { field: "role", operator: "eq", value: "editor" }
 *       ],
 *       combinator: "or"
 *     }
 *   ],
 *   combinator: "and"
 * }
 *
 * // Negated group
 * {
 *   rules: [{ field: "status", operator: "eq", value: "archived" }],
 *   not: true
 * }
 * ```
 */
export interface ICollectionFilterGroup {
  /** List of filter rules or nested groups */
  rules: Array<ICollectionFilterRule | ICollectionFilterGroup>;
  /** Combinator for filter rules (and/or) */
  combinator?: "and" | "or";
  /** Negate the entire filter group */
  not?: boolean;
}

/**
 * An aggregate calculation to apply on a field.
 *
 * @example
 * ```ts
 * // Sum of amount
 * { func: "sum", field: "amount" }
 *
 * // Count distinct users with alias
 * { func: "count", field: "user_id", isDistinct: true, name: "unique_users" }
 *
 * // Average with alias
 * { func: "avg", field: "score", name: "avg_score" }
 *
 * // Min with number type
 * { func: "min", field: "price", name: "min_price", numberType: "decimal" }
 * ```
 */
export interface ICollectionCalculation {
  /** Aggregation function name (count, sum, avg, min, max) */
  func: string;
  /** Field/column name to aggregate */
  field: string;
  /** Alias for the calculation result column */
  name?: string | null;
  /** Aggregate unique values only */
  isDistinct?: boolean;
  /** Aggregate values greater than this (use only if necessary) */
  minValue?: number | null;
  /** Aggregate values less than this (use only if necessary) */
  maxValue?: number | null;
  /** Number type for the calculation result value */
  numberType?: "bigint" | "int" | "decimal";
}

/**
 * Sort order specification. Can be a string (e.g. "created_on desc"), an object, or an array of objects for multi-column sorting.
 *
 * @example
 * ```ts
 * // Simple string (e.g. "created_on desc")
 * "created_on desc"
 *
 * // Object with direction
 * { field: "created_on", direction: "desc" }
 *
 * // Multi-column sort
 * [
 *   { field: "status", direction: "asc" },
 *   { field: "created_on", direction: "desc" }
 * ]
 * ```
 */
export type ICollectionOrderBy = string | { field: string; direction?: "asc" | "desc" } | Array<{ field: string; direction?: "asc" | "desc" }>;

/**
 * A simple formula that computes a virtual column using a function and arguments.
 *
 * @example
 * ```ts
 * // Concatenate columns
 * { func: "concat", args: ["first_name", "' '", "last_name"] }
 *
 * // Arithmetic
 * { func: "multiply", args: ["quantity", "unit_price"] }
 *
 * // Coalesce
 * { func: "coalesce", args: ["nickname", "first_name"] }
 * ```
 */
export interface ICollectionFormula {
  /** Formula function name (e.g. "add", "subtract", "multiply", "divide", "concat", "coalesce") */
  func: string;
  /** Arguments for the formula function (column names or literal values) */
  args: Array<string | number>;
}

/**
 * A block-based formula using a structured expression tree, supporting subqueries.
 *
 * @example
 * ```ts
 * {
 *   expression: {
 *     alias: "total_orders",
 *     inputs: [{ kind: "aggregate", name: "count", inputs: [] }],
 *     from: "orders",
 *     with: { "customer_id": "id" },
 *   }
 * }
 * ```
 */
export interface ICollectionBlockFormula {
  expression: {
    /** Optional alias for the computed column */
    alias?: string;
    /** Expression tree blocks */
    inputs: Array<Record<string, unknown>>;
    /** Source table for the subquery */
    from: string;
    /** Join condition: column name or mapping of subquery columns to parent columns */
    with: string | Record<string, string>;
    /** Optional filters inside the subquery */
    filters?: ICollectionFilterGroup;
  };
}

/**
 * A child query definition that fetches related data as a nested array.
 *
 * @example
 * ```ts
 * {
 *   from: "custom_order_items",
 *   using: "order_id",
 *   columns: ["product_name", "quantity", "price"],
 *   filters: {
 *     rules: [{ field: "status", operator: "neq", value: "cancelled" }]
 *   },
 *   orderBy: { field: "quantity", direction: "desc" },
 *   limit: 10
 * }
 * ```
 */
export interface ICollectionChildQuery {
  /** The slug of the child data source in "appSlug_slug" format */
  from: string;
  /** The field in child data source that references parent record */
  using: string;
  /** Columns to select from child records */
  columns?: Array<string> | null;
  /** Filters to apply to child records */
  filters?: ICollectionFilterGroup | null;
  /** Aggregations for child records */
  calculations?: Array<ICollectionCalculation> | null;
  /** Sorting for child records. Can be a string, an object, or an array of strings/objects */
  orderBy?: ICollectionOrderBy | null;
  /** Maximum number of child records per parent. Default is 100 */
  limit?: number;
}

/**
 * A single pivot matrix (CTE) query definition for cross-tab / matrix-style queries.
 *
 * @example
 * ```ts
 * // Pivot by status
 * {
 *   using: "id",
 *   columns: "status",
 *   spread: true
 * }
 *
 * // Pivot by month with date range
 * {
 *   using: "id",
 *   columns: "month",
 *   spread: true,
 *   dateRange: {
 *     interval: "month",
 *     min: "2024-01-01",
 *     max: "2024-12-31"
 *   }
 * }
 * ```
 */
export interface ICollectionPivotMatrix {
  /** Join this query using this field */
  using: string;
  /** Columns to select from this query */
  columns: string;
  /** Spread jsonb columns as separate columns */
  spread?: boolean;
  /** Filters for matrix query */
  filters?: ICollectionFilterGroup;
  /** Number of records to return */
  limit?: number;
  /** Generate date range series for the query */
  dateRange?: {
    /** Date range interval */
    interval: "day" | "week" | "month" | "year" | "hour" | "minute" | "second";
    /** Number of intervals to increment */
    increment?: number;
    /** Minimum datetime value (ISO format) */
    min: string;
    /** Maximum datetime value (ISO format) */
    max: string;
  };
}

/**
 * Pivot configuration for matrix-style queries.
 *
 * @example
 * ```ts
 * {
 *   matrix: [
 *     {
 *       using: "id",
 *       columns: "status",
 *       spread: true
 *     }
 *   ],
 *   hideEmptyRows: true,
 *   orderBy: { field: "name", direction: "asc" },
 *   limit: 50
 * }
 * ```
 */
export interface ICollectionPivot {
  /** List of matrix (CTE) queries / data sources */
  matrix: Array<ICollectionPivotMatrix>;
  /** Don't include rows with no matching data */
  hideEmptyRows?: boolean;
  /** Sorting for pivot results. Can be a string, an object, or an array of strings/objects */
  orderBy?: ICollectionOrderBy | null;
  /** Maximum number of pivot result rows. Default is 1000 */
  limit?: number;
}

/**
 * Parameters for listing data source records with filtering, sorting, pagination, and more.
 *
 * @example
 * ```ts
 * // Basic: fetch specific columns with pagination
 * collection.list({
 *   columns: ["name", "email", "status"],
 *   limit: 25,
 *   offset: 0
 * })
 *
 * // Columns with relation expansion
 * // Fetch related account columns inline using parentheses syntax:
 * //   "related_account(name,phone)" => { related_account: { name: "...", phone: "..." } }
 * // Use aliases with ":" prefix:
 * //   "f:firstname" => { f: "..." }
 * // Use spread with "..." prefix:
 * //   "...related_account(accountName:name)" => { accountName: "..." }
 * collection.list({
 *   columns: ["firstname", "lastname", "related_account(name,phone)"],
 *   expand: ["related_account"]
 * })
 *
 * // Filtering with nested groups
 * collection.list({
 *   filters: {
 *     rules: [
 *       { field: "status", operator: "eq", value: "active" },
 *       {
 *         rules: [
 *           { field: "role", operator: "eq", value: "admin" },
 *           { field: "role", operator: "eq", value: "editor" }
 *         ],
 *         combinator: "or"
 *       }
 *     ],
 *     combinator: "and"
 *   },
 *   orderBy: [
 *     { field: "created_on", direction: "desc" }
 *   ],
 *   limit: 50
 * })
 *
 * // Calculations (aggregations)
 * collection.list({
 *   calculations: [
 *     { func: "sum", field: "amount", name: "total_amount" },
 *     { func: "count", field: "id", name: "record_count" }
 *   ]
 * })
 *
 * // Formulas (virtual columns)
 * collection.list({
 *   columns: ["name"],
 *   formulas: {
 *     full_address: { func: "concat", args: ["city", "', '", "country"] }
 *   }
 * })
 *
 * // Child queries (nested related data)
 * collection.list({
 *   columns: ["name", "email"],
 *   childQueries: {
 *     orders: {
 *       from: "custom_orders",
 *       using: "customer_id",
 *       columns: ["order_date", "total"],
 *       orderBy: { field: "order_date", direction: "desc" },
 *       limit: 5
 *     }
 *   }
 * })
 *
 * // Pivot (matrix-style query)
 * collection.list({
 *   columns: ["name"],
 *   pivot: {
 *     matrix: [{
 *       using: "id",
 *       columns: "status",
 *       spread: true
 *     }],
 *     hideEmptyRows: true
 *   }
 * })
 *
 * // Full count with keyword search
 * collection.list({
 *   filterKeyword: "john",
 *   limit: 10,
 *   fullCount: true
 * })
 * ```
 */
export interface ICollectionListParams {
  /**
   * List of columns to fetch.
   *
   * Each column can be specified by its name or as expanded columns inside parentheses.
   * Columns can take aliases using the ":" character and be spread using the "..." prefix.
   * - `["name", "email"]` — fetch columns as-is
   * - `["related_account(name,phone)"]` — expand relation columns
   * - `["f:firstname"]` — alias a column
   * - `["...related_account(accountName:name)"]` — spread relation into top-level keys
   */
  columns?: Array<string>;
  /** List of distinct columns to deduplicate data. Use only when strictly necessary for performance reasons */
  distinctColumns?: Array<string>;
  /** Second-axis columns for pivotal queries */
  rows?: Array<string>;
  /** Named formulas to compute on the data. Keys are formula names (used as column aliases), values are formula definitions */
  formulas?: Record<string, ICollectionFormula | ICollectionBlockFormula> | null;
  /** Child queries to fetch related records as nested lists */
  childQueries?: Record<string, ICollectionChildQuery> | null;
  /** List of aggregate calculation rules to apply on the result set */
  calculations?: Array<ICollectionCalculation> | null;
  /** Filter rules to narrow down results. Supports nested groups with AND/OR combinators */
  filters?: ICollectionFilterGroup | null;
  /** Keyword to search using full-text search */
  filterKeyword?: string;
  /** List of columns or orderBy rules to sort data. Can be a string (e.g. "created_on desc"), an object, or an array of strings/objects */
  orderBy?: ICollectionOrderBy | null;
  /** Number of records to return. Default is 100 */
  limit?: number;
  /** Number of records to skip for pagination. Default is 0 */
  offset?: number;
  /** Return the total count of records matching the filters */
  fullCount?: boolean;
  /** List of specific fields to expand */
  expand?: Array<string>;
  /** Pivot configuration for matrix-style cross-tab queries */
  pivot?: ICollectionPivot | null;
}
