import { transform } from '@babel/standalone';
export type Compiled = {
    code: string;
    map: ReturnType<typeof transform>['map'];
};
declare function compile(source: string, fileName: string, importGraph?: Record<string, string[]>): Compiled;
export declare function transformImportAndExport(source: string, fileName: string, importGraph?: Record<string, string[]>): string;
export { compile };
