import React, { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorState {
    errors: {
        error: Error
        errorInfo: React.ErrorInfo
    }[]
    hasRenderError: boolean
}

// Error Boundary is hard to do with functional components, so we use a class component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            errors: [],
            hasRenderError: false
        }
    }

    // Catch React render errors
    static getDerivedStateFromError(error: Error): Partial<ErrorState> {
        return { errors: [{ error, errorInfo: { componentStack: '' } }], hasRenderError: true }
    }

    // This lifecycle method catches errors from children components
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('Error caught in ErrorBoundary:', error, errorInfo)
        this.setState((prevState) => ({
            hasRenderError: prevState.hasRenderError,
            errors: [...prevState.errors, { error, errorInfo }]
        }))
    }

    componentDidMount() {
        // Catch normal JS errors
        const errorHandler = (event: ErrorEvent) => {
            const error = new Error(event.message)

            // Use setTimeout to delay state update until after render
            setTimeout(() => {
                this.setState((prevState) => ({
                    errors: [
                        ...prevState.errors,
                        {
                            error,
                            errorInfo: { componentStack: event.error?.stack || '' }
                        }
                    ]
                }))
            }, 0)
        }

        // Catch unhandled promise rejections
        const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
            const error = new Error(event.reason)

            // Use setTimeout to delay state update until after render
            setTimeout(() => {
                this.setState((prevState) => ({
                    errors: [
                        ...prevState.errors,
                        {
                            error,
                            errorInfo: { componentStack: '' } // No stack trace in PromiseRejectionEvent
                        }
                    ]
                }))
            }, 0)
        }

        window.addEventListener('error', errorHandler)
        window.addEventListener('unhandledrejection', unhandledRejectionHandler)

        // Cleanup on unmount
        return () => {
            window.removeEventListener('error', errorHandler)
            window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
        }
    }

    dismissError = (index: number) => {
        this.setState((prevState) => ({
            errors: prevState.errors.filter((_, i) => i !== index),
            hasRenderError: prevState.hasRenderError && prevState.errors.length > 1
        }))
    }

    dismissAllErrors = () => {
        this.setState({ errors: [], hasRenderError: false })
    }

    render() {
        const { errors } = this.state

        return (
            <>
                {errors.length > 0 && (
                    <div className="fixed inset-0 bg-red/10 flex items-center justify-center z-50">
                        <div className="bg-slate-100 p-4 rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto relative">
                            <button
                                className="absolute top-1 right-2 text-gray-600 hover:text-gray-900"
                                onClick={this.dismissAllErrors}
                            >
                                &times;
                            </button>
                            <h2 className="text-lg font-bold">
                                Unhandled Errors: {this.state.hasRenderError && '(Rendering Paused)'}
                            </h2>
                            {errors.map((errorState, index) => (
                                <div key={index} className="mt-3 p-2 border bg-[#fff] rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{errorState.error.message}</p>
                                        <button
                                            className="text-gray-600 hover:text-gray-900 -mt-2"
                                            onClick={() => this.dismissError(index)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    {errorState.errorInfo && <pre>{errorState.errorInfo.componentStack}</pre>}
                                </div>
                            ))}
                            <div className="mt-4 text-sm">
                                If you believe this error is a bug, please send a screenshot to the discord.
                            </div>
                        </div>
                    </div>
                )}
                {!this.state.hasRenderError && this.props.children}
            </>
        )
    }
}
