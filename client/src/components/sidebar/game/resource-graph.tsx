import React from 'react'
import assert from 'assert'
import { useRound } from '../../../playback/GameRunner'
import Round from '../../../playback/Round'
import { LineChartDataPoint, QuickLineChart } from './quick-line-chart'

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
            team0: value as number,
            team1: values[1][index] as number
        }
    })
}

export const ResourceGraph: React.FC<Props> = (props: Props) => {
    const round = useRound()
    const data = props.active && round ? getChartData(round, props.property) : []

    return (
        <div className="mt-2 w-full">
            <h2 className="mx-auto text-center mb-2">{props.propertyDisplayName}</h2>
            <QuickLineChart data={data} width={350} height={170} margin={{ top: 2, right: 20, bottom: 17, left: 30 }} />
        </div>
    )
}
