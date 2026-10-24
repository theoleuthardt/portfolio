import { Component, type ReactNode } from "react";

/** Props of {@link SceneErrorBoundary}. */
export interface SceneErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches errors of the 3D scene (chunk not loadable, WebGL renderer not
 * creatable, context lost) and shows `fallback`, so the terminal keeps
 * working.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  State
> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
