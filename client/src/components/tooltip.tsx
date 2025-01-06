import React, { useState, useEffect, useRef } from 'react'

interface TooltipProps {
    children?: React.ReactNode
    text: string
    delay?: number
    location?: 'top' | 'bottom' | 'left' | 'right'
    wrapperClass?: string
    bg?: string
    color?: string
    size?: string
}

const TOOLTIP_CLASSES = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
}
const TOOLTIP_TRIANGLE_CLASSES = {
    top: '-bottom-1 left-1/2 -translate-x-1/2',
    bottom: '-top-1 left-1/2 -translate-x-1/2',
    left: '-right-1 top-1/2 -translate-y-1/2',
    right: '-left-1 top-1/2 -translate-y-1/2'
}

const Tooltip: React.FC<TooltipProps> = ({
    children,
    text,
    delay = 100,
    location = 'top',
    wrapperClass = 'h-max w-max flex',
    bg = 'bg-darkHighlight',
    color = 'text-gray-50',
    size = 'text-sm'
}) => {
    const [isVisible, setIsVisible] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
        }, delay)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <div
            className={wrapperClass + ' group relative'}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <div
                className={`shadow pointer-events-none select-none absolute z-20 mb-1 w-max max-w-[200px] rounded ${bg} px-2 py-1
          text-center ${size} ${color} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${
              TOOLTIP_CLASSES[location]
          }`}
            >
                {text}
                <div
                    className={`absolute z-20 h-2.5 w-2.5 rotate-45 transform
            ${bg} ${TOOLTIP_TRIANGLE_CLASSES[location]}`}
                />
            </div>
        </div>
    )
}

export default Tooltip
