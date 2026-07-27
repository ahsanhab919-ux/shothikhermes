declare module "*.css";
declare module "*.scss";
declare module "*.sass";

declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
