import type { StandardSchemaV1 } from "@standard-schema/spec";

export type VoidableStandardSchema =
  | StandardSchemaV1
  | undefined;

export type InferVoidableSchemaOutput<TSchema extends VoidableStandardSchema> =
  TSchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<TSchema>
    : undefined;

export type RemoveNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};
