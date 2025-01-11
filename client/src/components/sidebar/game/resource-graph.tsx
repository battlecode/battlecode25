import React from 'react'
import { useRound } from '../../../playback/GameRunner'
import Round from '../../../playback/Round'
import { LineChartDataPoint, QuickLineChart } from './quick-line-chart'
import { TeamRoundStat } from '../../../playback/RoundStat'

interface Props {
    active: boolean
    property: keyof TeamRoundStat
    propertyDisplayName: string
}

function getChartData(round: Round, property: keyof TeamRoundStat): LineChartDataPoint[] {
    const teams = round.match.game.teams

    const result: LineChartDataPoint[] = []

    // Sparser graph as datapoints increase
    const interval = Math.ceil(round.roundNumber / 500)

    for (let i = 0; i < round.roundNumber; i += interval) {
        const roundStat = round.match.stats[i]

        const team0Stat = roundStat.getTeamStat(teams[0])
        const team1Stat = roundStat.getTeamStat(teams[1])

        result.push({
            round: i + 1,
            team0: team0Stat[property] as number,
            team1: team1Stat[property] as number
        })
    }

    return result
}

export const ResourceGraph: React.FC<Props> = (props: Props) => {
    const round = useRound()
    const data = props.active && round ? getChartData(round, props.property) : []

    return (
        <div className="mt-2 w-full">
            <h2 className="mx-auto text-center mb-2">{props.propertyDisplayName}</h2>
            <QuickLineChart data={data} width={350} height={170} margin={{ top: 2, right: 20, bottom: 17, left: 40 }} />
        </div>
    )
}
