import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "red", fontFamily: "sans-serif" }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
const initialElement = document.getElementById("perla-initial-data");
const bootstrap = initialElement ? JSON.parse(initialElement.textContent) : {};
const application = (
  <React.StrictMode>
    <ErrorBoundary>
      <App initialData={bootstrap.initialData} />
    </ErrorBoundary>
  </React.StrictMode>
);
if (initialElement && root.hasChildNodes()) hydrateRoot(root, application);
else createRoot(root).render(application);
