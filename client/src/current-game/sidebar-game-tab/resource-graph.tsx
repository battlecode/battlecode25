import React from 'react'
import { AppContext, useAppContext } from '../../app-context'
import { useListenEvent, EventType } from '../../app-events'
import { useForceUpdate } from '../../util/react-util'
import { D3LineChart, LineChartDataPoint } from '../../components/sidebar/graphs/d3-line-chart'
import assert from 'assert'

interface Props {
    active: boolean
    property: string
    propertyDisplayName: string
}
function hasKey<O extends Object>(obj: O, key: PropertyKey): key is keyof O {
    return key in obj
}

function getChartData(appContext: AppContext, property: string): LineChartDataPoint[] {
    const match = appContext.state.activeMatch
    if (match === undefined) {
        return []
    }

    const values = [0, 1].map((index) =>
        match.stats.map((turnStat) => {
            const teamStat = turnStat.getTeamStat(match.game.teams[index])
            assert(hasKey(teamStat, property), `TeamStat missing property '${property}' when rendering chart`)
            return teamStat[property]
        })
    )

    return values[0].slice(0, match.currentTurn.turnNumber).map((value, index) => {
        return {
            turn: index + 1,
            white: value as number,
            brown: values[1][index] as number
        }
    })
}

export const ResourceGraph: React.FC<Props> = (props: Props) => {
    const appContext = useAppContext()
    const forceUpdate = useForceUpdate()

    useListenEvent(EventType.NEW_TURN, () => {
        if (props.active) forceUpdate()
    })

    return (
        <div className="mt-2 px-2 w-full">
            <h2 className="mx-auto text-center">{props.propertyDisplayName}</h2>
            <D3LineChart
                data={getChartData(appContext, props.property)}
                width={300 + 40} // Add 40 so that tooltip is visible outside of SVG container
                height={300}
                margin={{ top: 20, right: 20 + 20, bottom: 30, left: 40 + 20 }}
            />
        </div>
    )
}
