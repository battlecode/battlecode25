import React from 'react'
import { imageSource } from '../../../util/ImageLoader'
import { TEAM_COLOR_NAMES } from '../../../constants'
import { schema } from 'battlecode-schema'
import { TeamRoundStat } from '../../../playback/RoundStat'
import { DoubleChevronUpIcon } from '../../../icons/chevron'
import { CurrentMap } from '../../../playback/Map'
import { useRound } from '../../../playback/GameRunner'

interface UnitsIconProps {
    teamIdx: 0 | 1
    robotType: string
}

const UnitsIcon: React.FC<UnitsIconProps> = (props: UnitsIconProps) => {
    const color = TEAM_COLOR_NAMES[props.teamIdx].toLowerCase()
    const imagePath = `robots/${color}/${props.robotType}.png`

    return (
        <th key={imagePath} className="pb-1 w-[50px] h-[50px]">
            <img src={imageSource(imagePath)} className="w-full h-full"></img>
        </th>
    )
}

interface TeamTableProps {
    teamIdx: 0 | 1
}

export const TeamTable: React.FC<TeamTableProps> = (props: TeamTableProps) => {
    const round = useRound()
    const teamStat = round?.stat.getTeamStat(round?.match.game.teams[props.teamIdx])
    const map = round?.map

    return (
        <div className="flex flex-col">
            <UnitsTable teamStat={teamStat} teamIdx={props.teamIdx} />
            <ResourceTable map={map} teamStat={teamStat} teamIdx={props.teamIdx} />
        </div>
    )
}

interface ResourceTableProps {
    teamStat: TeamRoundStat | undefined
    map: CurrentMap | undefined
    teamIdx: 0 | 1
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ map, teamStat, teamIdx }) => {
    let moneyAmount = 0
    let paintPercent = 0

    if (map && teamStat) {
        paintPercent = teamStat.paintPercent
        moneyAmount = teamStat.moneyAmount
    }

    const teamName = TEAM_COLOR_NAMES[teamIdx].toLowerCase()
    return (
        <div className="flex items-center w-full mt-2 mb-1 text-xs font-bold justify-around">
            <div className="flex items-center w-[160px] ml-6">
                <div className="w-[30px] h-[30px] mr-2">
                    <img style={{ transform: 'scale(1.5)' }} src={imageSource(`icons/paint_${teamName}.png`)} />
                </div>
                <div>Coverage:</div>
                <div className="ml-1">
                    <b>{paintPercent}%</b>
                </div>
            </div>
            <div className="flex items-center w-[145px]">
                <div className="w-[30px] h-[30px] mr-2">
                    <img style={{ transform: 'scale(1.5)' }} src={imageSource(`icons/chip_${teamName}.png`)} />
                </div>
                <div>Chips:</div>
                <div className="ml-1">
                    <b>{moneyAmount}</b>
                </div>
            </div>
        </div>
    )
}

interface UnitsTableProps {
    teamStat: TeamRoundStat | undefined
    teamIdx: 0 | 1
}

export const UnitsTable: React.FC<UnitsTableProps> = ({ teamStat, teamIdx }) => {
    const columns: Array<[string, React.ReactElement]> = [
        ['Money Tower', <UnitsIcon teamIdx={teamIdx} robotType="money_tower" key="0" />],
        ['Paint Tower', <UnitsIcon teamIdx={teamIdx} robotType="paint_tower" key="1" />],
        ['Defense Tower', <UnitsIcon teamIdx={teamIdx} robotType="defense_tower" key="2" />],
        ['Soldier', <UnitsIcon teamIdx={teamIdx} robotType="soldier" key="3" />],
        ['Mopper', <UnitsIcon teamIdx={teamIdx} robotType="mopper" key="4" />],
        ['Splasher', <UnitsIcon teamIdx={teamIdx} robotType="splasher" key="5" />]
    ]

    let data: [string, number[]][] = [['Count', [0, 0, 0, 0, 0, 0]]]
    if (teamStat) {
        data = [
            [
                'Count',
                Object.values(schema.RobotType)
                    .filter((k) => typeof k === 'number' && k !== schema.RobotType.NONE)
                    .map((k) => teamStat.robotCounts[k as schema.RobotType])
            ]
            /*
            [
                'Avg. Level',
                teamStat.specializationTotalLevels
                    .slice(0, 4)
                    .map((c) => Math.round((c / totalCountAlive) * 100) / 100)
                    .concat([Math.round((teamStat.specializationTotalLevels[4] / totalCountDead) * 100) / 100])
            ]
            */
        ]
    }

    return (
        <>
            <table className="my-1">
                <thead>
                    <tr className="mb-2">
                        <th className="pb-1"></th>
                        {columns.map((column) => column[1])}
                    </tr>
                </thead>
                <tbody>
                    {data.map((dataRow, rowIndex) => (
                        <tr key={rowIndex}>
                            <th className="text-xs">{dataRow[0]}</th>
                            {dataRow[1].map((value, colIndex) => (
                                <td className="text-center text-xs" key={rowIndex + ':' + colIndex}>
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}
