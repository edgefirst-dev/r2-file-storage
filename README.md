# @edgefirst-dev/r2-file-storage

An implementation of [@mjackson/file-storage](https://github.com/mjackson/remix-the-web/tree/main/packages/file-storage) that uses R2 as the storage backend.

## Features

- Simple, intuitive key/value API (like [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), but for `File`s instead of strings)
- A generic `FileStorage` class that works for various Cloudflare R2.
- Preserves all `File` metadata including `file.name`, `file.type`, and `file.lastModified`

## Installation

Install from npm or GitHub Package Registry with;

```sh
bun add @edgefirst-dev/r2-file-storage
```

## Usage

```ts
import { R2FileStorage } from "@edgefirst-dev/r2-file-storage";

let storage = new R2FileStorage(r2); // Get r2 from your Cloudflare bindings

let file = new File(["hello world"], "hello.txt", { type: "text/plain" });
let key = "hello-key";

// Set the file in storage.
await storage.set(key, file);

let file = await storage.put(key, file);

// Then, sometime later...
let fileFromStorage = await storage.get(key);
// All of the original file's metadata is intact
fileFromStorage.name; // 'hello.txt'
fileFromStorage.type; // 'text/plain'

// To remove from storage
await storage.remove(key);

await storage.list({ prefix: "hello" }); // List all files with keys starting with "hello"
```

## License

See [LICENSE](./LICENSE)

## Author

- [Sergio Xalambrí](https://sergiodxa.com)
