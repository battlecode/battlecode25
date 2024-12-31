import React from 'react'
import { D3LineChart, LineChartDataPoint } from './d3-line-chart'
import assert from 'assert'
import { useRound } from '../../../playback/GameRunner'
import Round from '../../../playback/Round'
import { QuickLineChart } from './quick-line-chart'

interface Props {
    active: boolean
    property: string
    propertyDisplayName: string
}
function hasKey<O extends Object>(obj: O, key: PropertyKey): key is keyof O {
    return key in obj
}

function getChartData(round: Round, property: string): LineChartDataPoint[] {
    const values = [0, 1].map((index) =>
        round.match.stats.map((roundStat) => {
            const teamStat = roundStat.getTeamStat(round.match.game.teams[index])
            assert(hasKey(teamStat, property), `TeamStat missing property '${property}' when rendering chart`)
            return teamStat[property]
        })
    )

    return values[0].slice(0, round.roundNumber).map((value, index) => {
        return {
            round: index + 1,
            white: value as number,
            brown: values[1][index] as number
        }
    })
}

export const ResourceGraph: React.FC<Props> = (props: Props) => {
    const round = useRound()
    const data = props.active && round ? getChartData(round, props.property) : []

    return (
        <div className="mt-2 px-2 w-full">
            <h2 className="mx-auto text-center">{props.propertyDisplayName}</h2>
            {/*
            <D3LineChart
                data={data}
                width={300 + 40} // Add 40 so that tooltip is visible outside of SVG container
                height={200}
                margin={{ top: 20, right: 20 + 20, bottom: 30, left: 40 + 20 }}
            />
        */}
            <QuickLineChart data={data} width={300} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} />
        </div>
    )
}
