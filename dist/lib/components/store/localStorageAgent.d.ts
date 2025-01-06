export declare function createLocalStorageAgent(name: string, enableStorage?: boolean): {
    get(): string;
    set(_: string): void;
} | {
    get(): string | null;
    set(value: Record<string, string>): void;
};
