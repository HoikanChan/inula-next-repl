import { SplitPaneProps } from 'react-split-pane';
interface Props extends SplitPaneProps {
    children: any;
}
declare function SplitPaneWrapper({ className, children, ...props }: Props): import('./openinula/jsx-runtime').JSX.Element;
export default SplitPaneWrapper;
