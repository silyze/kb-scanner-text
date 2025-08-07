import { assert } from "@mojsoski/assert";
import { AsyncReadStream, AsyncTransform } from "@mojsoski/async-stream";
import { DocumentScanner } from "@silyze/kb";
import tiktoken, { TiktokenModel } from "tiktoken";

function cleanup(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export type TextScannerConfig = {
  encoding?: string;
  tokensPerPage?: number;
  model?: TiktokenModel;
  overlap?: number;
};

export default class TextScanner extends DocumentScanner<string | Uint8Array> {
  #decoder: TextDecoder;
  #tokensPerPage: number;
  #model: TiktokenModel;
  #overlap: number;

  constructor(
    config: TextScannerConfig = {
      encoding: "utf-8",
      tokensPerPage: 512,
      model: "text-embedding-3-small",
      overlap: 0.5,
    }
  ) {
    super();
    this.#decoder = new TextDecoder(config.encoding ?? "utf-8");
    this.#tokensPerPage = config.tokensPerPage ?? 512;
    this.#model = config.model ?? "text-embedding-3-small";

    const overlap = config.overlap ?? 0.5;
    this.#overlap =
      overlap >= 1
        ? Math.floor(overlap)
        : Math.floor(this.#tokensPerPage * overlap);

    assert(
      this.#overlap < this.#tokensPerPage,
      "overlap must be less than tokensPerPage"
    );
  }

  scan(input: string | Uint8Array): AsyncReadStream<string> {
    const decoded =
      typeof input === "string" ? input : this.#decoder.decode(input);
    const tokensPerPage = this.#tokensPerPage;
    const stride = tokensPerPage - this.#overlap;
    const model = this.#model;
    const chunkDecoder = new TextDecoder("utf-8");

    return new AsyncTransform<string>({
      async *read(signal: AbortSignal | undefined): AsyncGenerator<string> {
        let aborted = false;

        const abortHandler = () => {
          aborted = true;
        };

        if (signal?.aborted) return;

        signal?.addEventListener("abort", abortHandler);

        const encoder = tiktoken.encoding_for_model(model);
        try {
          const tokenIds = encoder.encode(cleanup(decoded));

          for (let i = 0; i < tokenIds.length; i += stride) {
            if (aborted) break;

            const chunk = tokenIds.slice(i, i + tokensPerPage);
            const textChunk = encoder.decode(chunk);
            yield chunkDecoder.decode(textChunk);

            if (i + tokensPerPage >= tokenIds.length) break;
          }
        } finally {
          encoder.free();
          signal?.removeEventListener("abort", abortHandler);
        }
      },
      transform() {
        return new AsyncTransform(this);
      },
    });
  }
}
