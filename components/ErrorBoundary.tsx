import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { crashlyticsService, recordError } from "@/lib/monitoring/crashlytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary que captura errores en componentes React
 * y los reporta automáticamente a Crashlytics
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Reportar el error a Crashlytics con información adicional
    const context = `ErrorBoundary: ${errorInfo.componentStack || "Unknown component"}`;

    // Agregar breadcrumb antes de reportar
    crashlyticsService.addBreadcrumb(
      `Error caught in boundary: ${error.message}`,
      "error_boundary",
    );

    recordError(error, context, true);

    // Callback opcional para manejo personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log adicional para debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReset = (): void => {
    // Forzar un re-render completo limpiando el estado
    this.setState({
      hasError: false,
      error: null,
    });
    // Opcionalmente podrías recargar la app aquí
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar UI de fallback personalizada o la por defecto
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>¡Ups! Algo salió mal</Text>
            <Text style={styles.message}>
              La aplicación encontró un error inesperado. El error ha sido
              reportado automáticamente.
            </Text>
            {__DEV__ && this.state.error && (
              <ScrollView
                style={styles.errorDetails}
                contentContainerStyle={styles.errorScrollContent}
              >
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.error.stack && (
                  <Text style={styles.stackText}>{this.state.error.stack}</Text>
                )}
              </ScrollView>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={this.handleRetry}
              >
                <Text style={styles.buttonText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.handleReset}
              >
                <Text style={styles.secondaryButtonText}>
                  Reiniciar pantalla
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC para envolver componentes con ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
    paddingHorizontal: 20,
  },
  errorDetails: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    maxHeight: 200,
    width: "100%",
  },
  errorScrollContent: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#ff3b30",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    color: "#666",
    fontFamily: "monospace",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6C5CE7",
  },
  secondaryButtonText: {
    color: "#6C5CE7",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorBoundary;
