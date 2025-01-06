/// <reference types="react" />
declare function Message({ message, onDismiss, className, style, }: {
    message: string;
    className?: string;
    style?: React.CSSProperties;
    onDismiss?: () => void;
}): "" | import('./openinula/jsx-runtime').JSX.Element;
export { Message };
