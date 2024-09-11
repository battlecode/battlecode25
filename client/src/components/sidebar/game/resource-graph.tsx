import React from 'react'
import { D3LineChart, LineChartDataPoint } from './d3-line-chart'
import assert from 'assert'
import { useTurn } from '../../../playback/GameRunner'
import Turn from '../../../playback/Turn'

interface Props {
    active: boolean
    property: string
    propertyDisplayName: string
}
function hasKey<O extends Object>(obj: O, key: PropertyKey): key is keyof O {
    return key in obj
}

function getChartData(turn: Turn, property: string): LineChartDataPoint[] {
    const values = [0, 1].map((index) =>
        turn.match.stats.map((turnStat) => {
            const teamStat = turnStat.getTeamStat(turn.match.game.teams[index])
            assert(hasKey(teamStat, property), `TeamStat missing property '${property}' when rendering chart`)
            return teamStat[property]
        })
    )

    return values[0].slice(0, turn.turnNumber).map((value, index) => {
        return {
            turn: index + 1,
            white: value as number,
            brown: values[1][index] as number
        }
    })
}

export const ResourceGraph: React.FC<Props> = (props: Props) => {
    const turn = useTurn()
    const data = props.active && turn ? getChartData(turn, props.property) : []

    return (
        <div className="mt-2 px-2 w-full">
            <h2 className="mx-auto text-center">{props.propertyDisplayName}</h2>
            <D3LineChart
                data={data}
                width={300 + 40} // Add 40 so that tooltip is visible outside of SVG container
                height={300}
                margin={{ top: 20, right: 20 + 20, bottom: 30, left: 40 + 20 }}
            />
        </div>
    )
}
