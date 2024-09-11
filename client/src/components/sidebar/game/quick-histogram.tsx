import React, { useEffect, useRef } from 'react'
import { drawAxes, getAxes, setCanvasResolution } from '../../../util/graph-util'

interface HistogramProps {
    data: number[]
    width: number
    height: number
    color: string
    margin: {
        top: number
        right: number
        bottom: number
        left: number
    }
    resolution?: number
}

export const CanvasHistogram: React.FC<HistogramProps> = ({ data, width, height, margin, color, resolution = 1 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        setCanvasResolution(canvas, width, height, resolution)

        const max = Math.max(...data)
        const { xScale, yScale, innerWidth, innerHeight } = getAxes(width, height, margin, { x: data.length, y: max })

        context.clearRect(0, 0, width, height)
        context.fillStyle = color
        const barWidth = innerWidth / data.length
        data.forEach((y, index) => {
            const barHeight = yScale(y)
            const leftPadding = 3
            context.fillRect(
                xScale(index) + leftPadding,
                barHeight,
                barWidth - leftPadding,
                height - margin.bottom - barHeight
            )
        })

        drawAxes(
            context,
            width,
            height,
            margin,
            {
                range: { min: 0, max: data.length - 1 },
                options: {
                    count: data.length,
                    centered: true
                }
            },
            {
                range: { min: 0, max: max },
                options: {
                    count: 5
                }
            }
        )
    }, [data.length, height, margin, width])

    return <canvas ref={canvasRef} width={width} height={height} />
}
