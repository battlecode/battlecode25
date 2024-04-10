import React, { useEffect, useRef } from 'react'
import { TEAM_WHITE, TEAM_BROWN } from '../../Constants'
import { drawAxes, getAxes, setCanvasResolution } from '../../../util/graph-util'

export interface LineChartDataPoint {
    turn: number
    brown: number
    white: number
}

interface LineChartProps {
    data: LineChartDataPoint[]
    width: number
    height: number
    margin: {
        top: number
        right: number
        bottom: number
        left: number
    }
    resolution?: number
}

export const QuickLineChart: React.FC<LineChartProps> = ({ data, width, height, margin, resolution = 1 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        setCanvasResolution(canvas, width, height, resolution)

        const max = Math.max(...data.map((d) => Math.max(d.brown, d.white)))
        const { xScale, yScale, innerWidth, innerHeight } = getAxes(width, height, margin, { x: data.length, y: max })

        context.clearRect(0, 0, width, height)

        if (data.length > 0) {
            context.strokeStyle = TEAM_BROWN
            context.beginPath()
            context.moveTo(xScale(data[0].turn), yScale(data[0].brown))
            for (let i = 1; i < data.length; i++) context.lineTo(xScale(data[i].turn), yScale(data[i].brown))
            context.stroke()

            context.strokeStyle = TEAM_WHITE
            context.beginPath()
            context.moveTo(xScale(data[0].turn), yScale(data[0].white))
            for (let i = 1; i < data.length; i++) context.lineTo(xScale(data[i].turn), yScale(data[i].white))
            context.stroke()
        }

        drawAxes(
            context,
            width,
            height,
            margin,
            {
                range: { min: 0, max: data.length },
                options: {
                    count: 8
                }
            },
            {
                range: { min: 0, max: max },
                options: {
                    count: 8
                }
            }
        )
    }, [data.length, height, margin, width])

    return <canvas ref={canvasRef} width={width} height={height} />
}
