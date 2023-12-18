import superjson from "superjson";

const compressedSerializer = {
  serialize: superjson.serialize,
  deserialize: superjson.deserialize,
} as const;
export const transformer = {
  input: compressedSerializer,
  output: compressedSerializer,
};
