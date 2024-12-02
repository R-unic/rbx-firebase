import { HttpService as HTTP } from "@rbxts/services";
import { endsWith, slice } from "@rbxts/string-utils";
import Object from "@rbxts/object-utils";

type Maybe<T> = T | undefined;

export class Firebase {
	private readonly baseURL: string;
	private readonly authQuery: string;

	public constructor(url: string, authorization: string) {
		this.baseURL = this.fixPath(url) + "/";
		this.authQuery = `.json?auth=${authorization}`;
	}

	/**
	 * @returns A promise containing the new data
	 */
	public async set<T>(path: string, value?: T, headers: Record<string, string> = { "X-HTTP-Method-Override": "PUT" }): Promise<Maybe<T>> {
		const valueIsObject = typeOf(value) === "table" && value !== undefined;
		const valueIsEmptyArray = valueIsObject && "size" in <object>value && (<Array<defined>>value).size() === 0;
		const valueIsEmptyObject = valueIsObject && Object.entries(value!).size() === 0;
		if (valueIsEmptyArray || valueIsEmptyObject)
			return <T>await this.delete(path);

		return new Promise((resolve, reject) => {
			try {
				HTTP.PostAsync(
					this.getEndpoint(path),
					HTTP.JSONEncode(value),
					"ApplicationJson",
					false, headers
				);
				resolve(value);
			} catch (error) {
				reject(`[Firebase]: ${error}`);
			}
		});
	}

	public async get<T>(path: string): Promise<Maybe<T>>;
	public async get<T>(path: string, defaultValue: T): Promise<T>;
	public async get<T>(path: string, defaultValue?: T): Promise<Maybe<T>> {
		return new Promise((resolve, reject) => {
			try {
				const res = HTTP.GetAsync(this.getEndpoint(path), true);
				resolve(<T>HTTP.JSONDecode(res) ?? defaultValue!);
			} catch (error) {
				reject(`[Firebase]: ${error}`);
			}
		});
	}

	public async delete<T>(path: string): Promise<Maybe<T>> {
		return this.set<T>(path, undefined, { "X-HTTP-Method-Override": "DELETE" });
	}

	public async reset(): Promise<void> {
		await this.delete("");
	}

	public async increment(path: string, delta = 1, defaultValue = 0): Promise<number> {
		const result = await this.get<number>(path, defaultValue) + delta;
		await this.set(path, result);
		return result;
	}

	public async addToArray<T extends defined>(path: string, value: T, maxArraySize?: number): Promise<T[]> {
		const data = await this.get<T[]>(path, []);
		if (maxArraySize !== undefined)
			if (data.size() >= maxArraySize) {
				const diff = data.size() - maxArraySize;
				for (let i = 0; i < diff + 1; i++)
					data.shift();
			}

		data.push(value);
		return <T[]>await this.set<T[]>(path, data);
	}

	private getEndpoint(path: string): string {
		path = this.fixPath(path);
		return this.baseURL + HTTP.UrlEncode(path === undefined ? "" : `/${path}`) + this.authQuery;
	}

	private fixPath(path: string): string {
		path = this.removeExtraSlash(path);
		return path;
	}

	private removeExtraSlash(path: string): string {
		if (endsWith(path, "/"))
			path = slice(path, 0, -1);

		return endsWith(path, "/") ? this.removeExtraSlash(path) : path;
	}
}