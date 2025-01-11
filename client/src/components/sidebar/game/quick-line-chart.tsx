import React, { useEffect, useRef } from 'react'
import { Colors, currentColors } from '../../../colors'
import { drawAxes, getAxes, setCanvasResolution } from '../../../util/graph-util'
import { useGame } from '../../../playback/GameRunner'

export interface LineChartDataPoint {
    round: number
    team0: number
    team1: number
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

export const QuickLineChart: React.FC<LineChartProps> = ({
    data,
    width,
    height,
    margin,
    resolution = window.devicePixelRatio ?? 1
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const game = useGame()

    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        setCanvasResolution(canvas, width, height, resolution)

        let maxX = -9999999
        let maxY = -9999999
        for (const d of data) {
            maxX = Math.max(maxX, d.round)
            maxY = Math.max(maxY, Math.max(d.team0, d.team1))
        }

        const { xScale, yScale, innerWidth, innerHeight } = getAxes(width, height, margin, { x: maxX, y: maxY })

        context.clearRect(0, 0, width, height)

        if (data.length > 0) {
            context.strokeStyle = game?.teams[0].color ?? 'black'
            context.beginPath()
            context.moveTo(xScale(data[0].round), yScale(data[0].team0))
            for (let i = 1; i < data.length; i++) context.lineTo(xScale(data[i].round), yScale(data[i].team0))
            context.stroke()

            context.strokeStyle = game?.teams[1].color ?? 'black'
            context.beginPath()
            context.moveTo(xScale(data[0].round), yScale(data[0].team1))
            for (let i = 1; i < data.length; i++) context.lineTo(xScale(data[i].round), yScale(data[i].team1))
            context.stroke()
        }

        drawAxes(
            context,
            width,
            height,
            margin,
            {
                range: { min: 0, max: maxX },
                options: { textColor: 'white', lineColor: 'white' }
            },
            {
                range: { min: 0, max: maxY },
                options: { textColor: 'white', lineColor: 'white' }
            }
        )
    }, [data.length, height, margin, width])

    return <canvas ref={canvasRef} width={width} height={height} />
}
