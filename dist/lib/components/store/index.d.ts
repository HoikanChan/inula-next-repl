import { Compiled } from '../compiler';
import { InulaNode } from 'openinula';
export interface Settings {
    name: string;
    code?: string;
    defaultCode?: string;
    compressedCode?: string;
    importMap?: string;
    placeHolder?: string;
    enableStorage?: boolean;
}
type GetStore = ReturnType<typeof initStore>;
type Store = ReturnType<GetStore>;
declare function StoreContextProvider({ children, settings, }: {
    children: InulaNode;
    settings: Settings;
}): import('./openinula/jsx-runtime').JSX.Element;
export declare const INDEX_FILE_NAME = "index.jsx";
declare function initStore({ name, code, defaultCode, importMap, placeHolder, enableStorage, compressedCode }: Settings): any;
export declare function isValidScript(fileName: string): boolean;
export declare function tryCompile(state: Store): readonly [Record<string, Compiled>, Record<string, string[]>, string] | null;
declare function useStore(): any;
export { StoreContextProvider, useStore };
