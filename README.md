# @silyze/kb-scanner-text

**Text implementation of `DocumentScanner<T>` for `@silyze/kb`**, using token-based chunking compatible with OpenAI's `tiktoken`.

## Features

- Splits raw text or `Uint8Array` input into token-based chunks.
- Configurable token stride and overlap.
- Supports multiple OpenAI models via `tiktoken`.
- Fully async via `AsyncReadStream` and `AsyncTransform` utilities.

## Installation

```bash
npm install @silyze/kb-scanner-text
```

## Usage

```ts
import TextScanner from "@silyze/kb-scanner-text";

const scanner = new TextScanner({
  model: "text-embedding-3-small", // optional
  tokensPerPage: 512, // optional
  overlap: 0.5, // optional: 50% overlap
});

async function run() {
  const input = "The quick brown fox jumps over the lazy dog.";
  const chunks = await scanner.scan(input).transform().toArray();

  console.log(chunks);
}

run().then();
```

## Configuration

`TextScanner` accepts the following optional configuration:

```ts
type TextScannerConfig = {
  encoding?: string; // default: "utf-8"
  tokensPerPage?: number; // default: 512
  model?: TiktokenModel; // default: "text-embedding-3-small"
  overlap?: number; // default: 0.5 (50%)
};
```

- `encoding`: Text encoding for `Uint8Array` input.
- `tokensPerPage`: Number of tokens per chunk.
- `overlap`: Overlap between chunks — can be a float (ratio) or integer (absolute).
- `model`: Model name passed to `tiktoken.encoding_for_model()`.

## How it works

1. Accepts a string or `Uint8Array` input.
2. Cleans up and tokenizes the text using `tiktoken`.
3. Chunks the token list using sliding windows, with optional overlap.
4. Decodes each chunk and yields it as a string via an `AsyncReadStream`.

This is designed to work as a plugin for the `@silyze/kb` knowledge base system, where documents need to be scanned and embedded for vector search.

## Example Output

Given a basic string:

```ts
await scanner.scan("Hello world! This is a test.").transform().toArray();
```

You might get:

```ts
["Hello world! This is a test."];
```

Longer input will be chunked according to `tokensPerPage` and `overlap`.
