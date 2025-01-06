import { InulaNode } from 'openinula';
declare function SandboxEleProvider({ children }: {
    children: InulaNode;
}): import('./openinula/jsx-runtime').JSX.Element;
declare function useSandboxEle(): [MutableRef<HTMLIFrameElement | null>, (sandboxEle: HTMLIFrameElement | null) => void];
export { SandboxEleProvider, useSandboxEle };
