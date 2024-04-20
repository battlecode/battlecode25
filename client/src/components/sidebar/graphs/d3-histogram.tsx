import React, { useEffect, useRef } from 'react'
import { TEAM_WHITE, TEAM_BROWN } from '../../../current-game/Constants'
import * as d3 from 'd3'

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
}

export const D3Histogram: React.FC<HistogramProps> = ({ data, width, height, margin, color }) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const binCount = data.length
    useEffect(() => {
        if (data.length === 0) return

        // append the svg object to the body of the page
        const svg = d3.select(svgRef.current).attr('width', width).attr('height', height)
        //.on('pointerenter pointermove', pointerMoved)
        //.on('pointerleave', pointerLeft)

        const bins = d3
            .histogram()
            .domain([1, binCount + 1]) // Add 1 so it isn't cut off
            .thresholds(binCount)(data) // Number of bins

        const xScale = d3
            .scaleBand()
            .domain(d3.range(1, binCount + 1).map(String)) // [1-5] to ["1"-"5"]
            .range([margin.left, width - margin.right - margin.left])

        const yScale = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(bins, function (d) {
                    return d.length
                }) as number
            ])
            .range([height - margin.bottom - margin.top, margin.top])

        // Add X-Axis
        svg.append('g')
            .attr('transform', `translate(0, ${height - margin.bottom - margin.top})`)
            .call(d3.axisBottom(xScale))

        // Add Y-axis
        svg.append('g').attr('transform', `translate(${margin.left}, 0)`).call(d3.axisLeft(yScale))

        console.log(bins)

        svg.selectAll('rect')
            .data(bins)
            .join('rect')
            .attr('x', 1)
            .attr('transform', function (d) {
                console.log(d)
                return `translate(${xScale(String(d.x0!))} , ${yScale(d.length!)})`
            })
            .attr('width', function (d) {
                return xScale.bandwidth() - 5 // -5 for space between bars
            })
            .attr('height', function (d) {
                return height - margin.top - margin.bottom - yScale(d.length!)
            })
            .style('fill', color)
    }, [data, width, height, margin])

    return (
        <svg ref={svgRef} width={width} height={height}>
            <g />
        </svg>
    )
}
