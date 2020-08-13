declare module '*.css' {
    const styles: { [key: string]: string };
    export default styles;
}

declare module '*.svg' {
    const content: string;
    export default content;
}
