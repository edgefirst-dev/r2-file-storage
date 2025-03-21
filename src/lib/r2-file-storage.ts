import type { R2Bucket } from "@cloudflare/workers-types";
import type {
	FileKey,
	FileMetadata,
	FileStorage,
	ListOptions,
	ListResult,
} from "@mjackson/file-storage";

export namespace R2FileStorage {
	export interface CustomMetadata extends Record<string, string> {
		name: string;
		type: string;
	}
}

/**
 * A `FileStorage` that is backed by an R2 bucket.
 */
export class R2FileStorage implements FileStorage {
	/**
	 * @param r2 The R2Bucket bindings to use
	 */
	constructor(protected r2: R2Bucket) {}

	async has(key: string) {
		let object = await this.r2.get(key);
		return object !== null;
	}

	async set(key: string, file: File) {
		await this.put(key, file);
	}

	async put(key: string, file: File) {
		let customMetadata = {
			name: file.name,
			type: file.type,
		} satisfies R2FileStorage.CustomMetadata;

		let body = await file.arrayBuffer();

		await this.r2.put(key, body, {
			httpMetadata: { contentType: file.type },
			customMetadata,
		});

		return file;
	}

	async get(key: string) {
		let object = await this.r2.get(key);
		if (!object) return null;

		let buffer = await object.arrayBuffer();

		let metadata =
			object.customMetadata as unknown as R2FileStorage.CustomMetadata;

		return new File([buffer], metadata?.name ?? key, {
			type: object.httpMetadata?.contentType ?? metadata?.type,
			lastModified: object.uploaded.getTime(),
		});
	}

	async remove(key: string) {
		await this.r2.delete(key);
	}

	async list<T extends ListOptions>(options?: T): Promise<ListResult<T>> {
		let result = await this.r2.list({
			cursor: options?.cursor,
			limit: options?.limit,
			prefix: options?.prefix,
		});

		return {
			files: result.objects.map((object) => {
				let metadata =
					object.customMetadata as unknown as R2FileStorage.CustomMetadata;

				if (options?.includeMetadata === true) {
					return {
						key: object.key,
						lastModified: object.uploaded.getTime(),
						size: object.size,
						name: metadata?.name ?? object.key,
						type: object.httpMetadata?.contentType ?? metadata?.type,
					} satisfies FileMetadata;
				}

				return { key: object.key } satisfies FileKey;
			}) as ListResult<T>["files"],
			cursor: result.truncated ? result.cursor : undefined,
		};
	}
}
