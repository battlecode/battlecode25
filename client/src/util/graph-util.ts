export function getAxes(
    width: number,
    height: number,
    rawMargin: { top: number; right: number; bottom: number; left: number },
    size: { x: number; y: number }
) {
    // +1 is to avoid overlapping axis lines
    const margin = { ...rawMargin, left: rawMargin.left + 1, bottom: rawMargin.bottom + 1 }
    const xScale = (value: number) => (value * (width - margin.left - margin.right)) / size.x + margin.left
    const yScale = (value: number) => height - margin.bottom - (value / size.y) * (height - margin.top - margin.bottom)
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    return { xScale, yScale, innerWidth, innerHeight }
}

export function setCanvasResolution(canvas: HTMLCanvasElement, width: number, height: number, resolution: number) {
    canvas.width = width * resolution
    canvas.height = height * resolution
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.getContext('2d')!.scale(resolution, resolution)
}

export function drawXAxis(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number },
    range: Range,
    options: AxisOptions
) {
    context.strokeStyle = options.lineColor ?? 'black'
    context.beginPath()
    context.moveTo(margin.left, height - margin.bottom)
    context.lineTo(width - margin.right, height - margin.bottom)
    context.stroke()

    const valueRangeScale = (range.max - range.min) / (width - margin.left - margin.right)
    if (options.points) {
        for (const point of options.points) {
            const xPos = margin.left + (point - range.min) / valueRangeScale
            context.beginPath()
            context.moveTo(xPos, height - margin.bottom)
            context.lineTo(xPos, height - margin.bottom + 6)
            context.stroke()
            context.fillStyle = options.textColor ?? 'black'
            context.fillText(point.toString(), xPos - 2, height)
        }
    } else if (options.count) {
        const gap = (range.max - range.min) / (options.count - (options.centered ? 0 : 1))
        const labelGap = (range.max - range.min) / (options.count - 1)
        for (let i = 0; i < options.count; i++) {
            const xPos = margin.left + ((i + (options.centered ? 0.5 : 0)) * gap) / valueRangeScale
            context.beginPath()
            context.moveTo(xPos, height - margin.bottom)
            context.lineTo(xPos, height - margin.bottom + 6)
            context.stroke()
            context.fillStyle = options.textColor ?? 'black'
            const label = Math.round(range.min + i * labelGap).toString()
            const textWidth = context.measureText(label).width
            context.fillText(label, xPos - textWidth / 2, height)
        }
    } else {
        // auto mode
        const MIN_TICKS = 4
        const MAX_TICKS = 10
        const { min, max } = range
        const rangeSize = max - min
        const roughInterval = rangeSize / ((MAX_TICKS + MIN_TICKS) / 2)
        let interval = Math.pow(10, Math.ceil(Math.log10(roughInterval))) * 10
        let refinedInterval = 0
        while (!refinedInterval && interval >= 1) {
            interval = interval / 10
            refinedInterval =
                interval *
                ([1, 2, 5].find(
                    (multiplier) =>
                        rangeSize / (interval * multiplier) <= MAX_TICKS &&
                        rangeSize / (interval * multiplier) >= MIN_TICKS
                ) || 0)
        }

        if (!refinedInterval) {
            refinedInterval = Math.pow(10, Math.ceil(Math.log10(roughInterval)))
        }

        // Calculate tick positions
        const start = Math.ceil(min / refinedInterval) * refinedInterval
        const end = Math.floor(max / refinedInterval) * refinedInterval
        const ticks = []
        for (let tick = start; tick <= end; tick += refinedInterval) {
            ticks.push(tick)
        }

        // Ensure a tick at 0 if within range
        if (min <= 0 && max >= 0 && !ticks.includes(0)) {
            ticks.push(0)
            ticks.sort((a, b) => a - b)
        }

        // Render ticks and labels
        ticks.forEach((tick) => {
            const xPos = margin.left + (tick - min) / valueRangeScale
            context.beginPath()
            context.moveTo(xPos, height - margin.bottom)
            context.lineTo(xPos, height - margin.bottom + 6)
            context.stroke()

            context.fillStyle = options.textColor ?? 'black'
            const label = (tick != Math.round(tick) ? tick.toFixed(1) : tick).toString()
            const textWidth = context.measureText(label).width
            context.fillText(label, xPos - textWidth / 2, height)
        })
    }
}
export function drawYAxis(
    context: CanvasRenderingContext2D,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number },
    range: Range,
    options: AxisOptions
) {
    context.strokeStyle = options.lineColor ?? 'black'
    context.beginPath()
    context.moveTo(margin.left, margin.top)
    context.lineTo(margin.left, height - margin.bottom)
    context.stroke()

    const valueRangeScale = (range.max - range.min) / (height - margin.top - margin.bottom)
    if (options.points) {
        for (const point of options.points) {
            const yPos = height - margin.bottom - (point - range.min) / valueRangeScale
            context.beginPath()
            context.moveTo(margin.left, yPos)
            context.lineTo(margin.left - 6, yPos)
            context.stroke()
            context.fillStyle = options.textColor ?? 'black'
            const label = point.toString()
            const textWidth = context.measureText(label).width
            context.fillText(label, margin.left - textWidth - 10, yPos + 5)
        }
    } else if (options.count) {
        const gap = (range.max - range.min) / (options.count - (options.centered ? 0 : 1))
        const labelGap = (range.max - range.min) / (options.count - 1)
        for (let i = 0; i < options.count; i++) {
            const yPos = height - margin.bottom - ((i + (options.centered ? 0.5 : 0)) * gap) / valueRangeScale
            context.beginPath()
            context.moveTo(margin.left, yPos)
            context.lineTo(margin.left - 6, yPos)
            context.stroke()
            context.fillStyle = options.textColor ?? 'black'
            const label = Math.round(range.min + i * labelGap).toString()
            const textWidth = context.measureText(label).width
            context.fillText(label, margin.left - textWidth - 10, yPos + 5)
        }
    } else {
        // auto mode for y-axis
        const MIN_TICKS = 3
        const MAX_TICKS = 10
        const { min, max } = range
        const rangeSize = max - min
        const roughInterval = rangeSize / ((MAX_TICKS + MIN_TICKS) / 2)
        let interval = Math.pow(10, Math.ceil(Math.log10(roughInterval))) * 10
        let refinedInterval = 0

        while (!refinedInterval && interval >= 1) {
            interval = interval / 10
            refinedInterval =
                interval *
                ([1, 2, 5].find(
                    (multiplier) =>
                        rangeSize / (interval * multiplier) <= MAX_TICKS &&
                        rangeSize / (interval * multiplier) >= MIN_TICKS
                ) || 0)
        }

        if (!refinedInterval) {
            refinedInterval = Math.pow(10, Math.ceil(Math.log10(roughInterval)))
        }

        // Calculate tick positions
        const start = Math.ceil(min / refinedInterval) * refinedInterval
        const end = Math.floor(max / refinedInterval) * refinedInterval
        const ticks = []
        for (let tick = start; tick <= end; tick += refinedInterval) {
            ticks.push(tick)
        }

        // Ensure a tick at 0 if within range
        if (min <= 0 && max >= 0 && !ticks.includes(0)) {
            ticks.push(0)
            ticks.sort((a, b) => a - b)
        }

        // Render ticks and labels
        ticks.forEach((tick) => {
            const yPos = height - margin.bottom - (tick - min) / valueRangeScale
            context.beginPath()
            context.moveTo(margin.left, yPos)
            context.lineTo(margin.left - 6, yPos)
            context.stroke()

            context.fillStyle = options.textColor ?? 'black'
            const label = (tick != Math.round(tick) ? tick.toFixed(1) : tick).toString()
            const textWidth = context.measureText(label).width
            context.fillText(label, margin.left - textWidth - 10, yPos + 5)
        })
    }
}

export function drawAxes(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number },
    x: {
        range: Range
        options: AxisOptions
    },
    y: {
        range: Range
        options: AxisOptions
    }
) {
    drawXAxis(context, width, height, margin, x.range, x.options)
    drawYAxis(context, height, margin, y.range, y.options)
}

type AxisOptions = {
    points?: number[]
    count?: number
    textColor?: string
    lineColor?: string
    centered?: boolean
}

type Range = {
    min: number
    max: number
}
