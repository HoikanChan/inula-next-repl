import { Settings } from './store';
import { SplitPaneProps } from 'react-split-pane';
import { InulaNode } from 'openinula';
interface ReplProps extends Settings {
    split?: SplitPaneProps;
    className?: string;
    children?: InulaNode;
    style?: Record<string, any>;
}
declare function Repl({ split, className, style, children, ...settings }: ReplProps): import('./openinula/jsx-runtime').JSX.Element;
export { Repl };
