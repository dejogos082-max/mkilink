import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Algo deu errado</h2>
          <p className="mb-6 text-sm text-gray-600">
            Ocorreu um erro inesperado ao carregar esta seção.
          </p>
          
          {this.state.error && (
            <div className="mb-6 w-full max-w-md overflow-hidden rounded-lg border border-red-200 bg-red-50 text-left">
              <details className="group">
                <summary className="cursor-pointer bg-red-100 px-4 py-2 text-xs font-medium text-red-800 hover:bg-red-200 focus:outline-none">
                  Ver detalhes do erro
                </summary>
                <div className="p-4">
                  <p className="font-mono text-xs text-red-700 break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.error.stack && (
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-red-600">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
