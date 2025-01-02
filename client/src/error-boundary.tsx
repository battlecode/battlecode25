import React, { useState, useEffect, ReactNode } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorState {
    error: Error
    errorInfo: React.ErrorInfo
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
    const [errors, setErrors] = useState<ErrorState[]>([])

    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        setErrors((prevErrors) => [...prevErrors, { error, errorInfo }])
    }

    useEffect(() => {
        const errorHandler = (event: ErrorEvent) => {
            const error = new Error(event.message)
            handleError(error, { componentStack: event.error.stack || '' })
        }

        window.addEventListener('error', errorHandler)

        return () => {
            window.removeEventListener('error', errorHandler)
        }
    }, [])

    const dismissError = (index: number) => {
        setErrors((prevErrors) => prevErrors.filter((_, i) => i !== index))
    }

    const dismissAllErrors = () => {
        setErrors([])
    }

    return (
        <>
            {errors.length > 0 && (
                <div className="fixed inset-0 bg-red/10 flex items-center justify-center z-50">
                    <div className="bg-slate-100 p-4 rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto relative">
                        <button
                            className="absolute top-1 right-2 text-gray-600 hover:text-gray-900"
                            onClick={dismissAllErrors}
                        >
                            &times;
                        </button>
                        <h2 className="text-lg font-bold">Unhandled Errors:</h2>
                        {errors.map((errorState, index) => (
                            <div key={index} className="mt-3 p-2 border bg-[#fff] rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{errorState.error.message}</p>
                                    <button
                                        className="text-gray-600 hover:text-gray-900 -mt-2"
                                        onClick={() => dismissError(index)}
                                    >
                                        &times;
                                    </button>
                                </div>
                                {errorState.errorInfo && <pre>{errorState.errorInfo.componentStack}</pre>}
                            </div>
                        ))}
                        <div className="mt-4 text-sm">
                            If you belive this error is a bug, please send a screenshot to the discord.
                        </div>
                    </div>
                </div>
            )}
            {children}
        </>
    )
}
