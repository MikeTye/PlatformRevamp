import React from "react";
import { sendErrorLog } from "../../lib/errorLogger";

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
    state: State = {
        hasError: false,
    };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        void sendErrorLog({
            level: "fatal",
            category: "react_error_boundary",
            message: error.message,
            stack: error.stack,
            context: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    render() {
        if (this.state.hasError) {
            return <div>Something went wrong.</div>;
        }

        return this.props.children;
    }
}