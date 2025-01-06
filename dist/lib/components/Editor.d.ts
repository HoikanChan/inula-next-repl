import { Ref } from 'openinula';
import { monaco } from './initMonaco';
interface EditorProps {
    darkTheme?: boolean;
    className?: string;
}
export declare const Menu: ({ updateCode }: {
    updateCode: any;
}) => import('./openinula/jsx-runtime').JSX.Element;
declare const Editor: import("openinula").ExoticComponent<EditorProps> & {
    key?: import("openinula").Key | null | undefined;
} & {
    ref?: Ref<{
        resetCode: () => void;
        getMonaco: () => monaco.editor.IStandaloneCodeEditor | undefined;
    }> | undefined;
};
export { Editor };
