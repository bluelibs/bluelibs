export type AggregationResponseType<ResultSchema> = {
  ok: number;
  errmsg?: string;
  code?: number;
  codeName?: string;
  cursor: {
    id: number;
    firstBatch: Partial<ResultSchema>[];
    nextBatch: Partial<ResultSchema>[];
  };
};
