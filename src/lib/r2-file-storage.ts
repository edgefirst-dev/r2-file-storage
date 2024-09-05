import type { R2Bucket } from "@cloudflare/workers-types";
import type { FileStorage } from "@mjackson/file-storage";

export interface CustomMetadata {
	name: string;
	type: string;
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
		await this.r2.put(key, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type },
			customMetadata: { name: file.name, type: file.type },
		});
	}

	async get(key: string) {
		let object = await this.r2.get(key);
		if (!object) return null;

		let buffer = await object.arrayBuffer();

		let metadata = object.customMetadata as unknown as CustomMetadata;

		return new File([buffer], metadata?.name ?? key, {
			type: object.httpMetadata?.contentType ?? metadata?.type,
			lastModified: object.uploaded.getTime(),
		});
	}

	async remove(key: string) {
		await this.r2.delete(key);
	}
}
