import { describe, expect, mock, test } from "bun:test";
import { R2Bucket } from "@cloudflare/workers-types";
import { R2FileStorage } from "./r2-file-storage";

let get = mock();
let put = mock();
let del = mock();

const r2 = { get, put, delete: del } as unknown as R2Bucket;

describe("R2FileStorage", () => {
	test("stores and retrieves files", async () => {
		let storage = new R2FileStorage(r2);

		let file = new File(["Hello, world!"], "hello.txt", { type: "text/plain" });

		put.mockImplementationOnce(async (key: string, buffer: ArrayBufferLike) => {
			expect(key).toBe("hello");
			expect(new Uint8Array(buffer)).toEqual(
				new TextEncoder().encode("Hello, world!"),
			);
		});

		storage.set("hello", file);

		get.mockImplementationOnce(async (key: string) => {
			expect(key).toBe("hello");
			return {
				arrayBuffer: async () =>
					new TextEncoder().encode("Hello, world!").buffer,
				httpMetadata: { contentType: "text/plain" },
				uploaded: new Date(),
			};
		});

		expect(storage.has("hello")).resolves.toBeTrue();

		get.mockImplementationOnce(async (key: string) => {
			expect(key).toBe("hello");
			return {
				arrayBuffer: async () =>
					new TextEncoder().encode("Hello, world!").buffer,
				httpMetadata: { contentType: "text/plain" },
				customMetadata: { name: "hello.txt" },
				uploaded: new Date(),
			};
		});

		let retrieved = await storage.get("hello");

		expect(retrieved).toBeTruthy();
		expect(retrieved?.name).toBe("hello.txt");
		expect(retrieved?.type).toBe("text/plain;charset=utf-8");
		expect(retrieved?.size).toBe(13);

		let text = await retrieved?.text();

		expect(text).toBe("Hello, world!");

		del.mockImplementationOnce(async (key) => {
			expect(key).toBe("hello");
		});

		await storage.remove("hello");

		get.mockImplementation(async (key: string) => {
			expect(key).toBe("hello");
			return null;
		});

		expect(storage.has("hello")).resolves.toBeFalse();
		expect(storage.get("hello")).resolves.toBeNull();
	});
});
