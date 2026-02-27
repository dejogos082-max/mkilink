import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class HCaptchaWrapper extends Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("HCaptcha Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 text-sm font-medium">
            Erro ao carregar verificação de segurança.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-red-500 underline"
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
