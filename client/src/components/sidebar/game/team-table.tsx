import React from 'react'
import { imageSource } from '../../../util/ImageLoader'
import { TEAM_COLOR_NAMES } from '../../../constants'
import { schema } from 'battlecode-schema'
import { TeamTurnStat } from '../../../playback/TurnStat'
import { DoubleChevronUpIcon } from '../../../icons/chevron'
import { CurrentMap } from '../../../playback/Map'
import { useTurn } from '../../../playback/GameRunner'

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
    const turn = useTurn()
    const teamStat = turn?.stat.getTeamStat(turn?.match.game.teams[props.teamIdx])
    const map = turn?.map

    return (
        <div className="flex flex-col">
            <UnitsTable teamStat={teamStat} teamIdx={props.teamIdx} />
            <ResourceTable map={map} teamStat={teamStat} teamIdx={props.teamIdx} />
            <GlobalUpgradeSection teamStat={teamStat} />
        </div>
    )
}

interface ResourceTableProps {
    teamStat: TeamTurnStat | undefined
    map: CurrentMap | undefined
    teamIdx: 0 | 1
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ map, teamStat, teamIdx }) => {
    let flags = 3
    let carried = 0
    let crumbs = 0
    if (map && teamStat) {
        flags = 0
        for (const flag of map.flagData.values()) {
            if (flag.team === teamIdx) {
                flags++
                if (flag.carrierId) carried++
            }
        }
        crumbs = teamStat.resourceAmount
    }
    return (
        <div className="flex items-center mt-2 mb-1 text-xs font-bold justify-around">
            <div className="flex items-center w-[145px] ml-5">
                Crumbs: {crumbs}
                <div className="w-[30px] h-[30px]">
                    <img style={{ transform: 'scale(1.5)' }} src={imageSource('resources/crumb_1.png')} />
                </div>
            </div>
            <div className="flex items-center w">
                Flags:
                {[1, 2, 3].map((i) => (
                    <div className="w-[40px]" key={i}>
                        <div className="w-[30px] h-[30px] mx-auto">
                            <img
                                className={flags >= i ? '' : 'opacity-25'}
                                src={
                                    carried < i
                                        ? imageSource('resources/bread.png')
                                        : imageSource('resources/bread_outline.png')
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface UnitsTableProps {
    teamStat: TeamTurnStat | undefined
    teamIdx: 0 | 1
}

export const UnitsTable: React.FC<UnitsTableProps> = ({ teamStat, teamIdx }) => {
    const columns: Array<[string, React.ReactElement]> = [
        ['Base', <UnitsIcon teamIdx={teamIdx} robotType="base" key="0" />],
        ['Attack', <UnitsIcon teamIdx={teamIdx} robotType="attack" key="1" />],
        ['Build', <UnitsIcon teamIdx={teamIdx} robotType="build" key="2" />],
        ['Heal', <UnitsIcon teamIdx={teamIdx} robotType="heal" key="3" />],
        ['Jailed', <UnitsIcon teamIdx={teamIdx} robotType="jailed" key="4" />]
    ]

    let data: [string, number[]][] = [
        ['Count', [0, 0, 0, 0, 0]],
        ['Avg. Level', [0, 0, 0, 0, 0]]
    ]
    if (teamStat) {
        const totalCountAlive = Math.max(
            teamStat?.robots[0] + teamStat?.robots[1] + teamStat?.robots[2] + teamStat?.robots[3],
            1
        )
        const totalCountDead = Math.max(teamStat?.robots[4], 1)
        data = [
            ['Count', teamStat?.robots],
            [
                'Avg. Level',
                teamStat.specializationTotalLevels
                    .slice(0, 4)
                    .map((c) => Math.round((c / totalCountAlive) * 100) / 100)
                    .concat([Math.round((teamStat.specializationTotalLevels[4] / totalCountDead) * 100) / 100])
            ]
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

const GlobalUpgradeSection: React.FC<{ teamStat: TeamTurnStat | undefined }> = ({ teamStat }) => {
    const upgradeTypes: Record<schema.GlobalUpgradeType, string> = {
        [schema.GlobalUpgradeType.ACTION_UPGRADE]: 'Global Attack Upgrade',
        [schema.GlobalUpgradeType.CAPTURING_UPGRADE]: 'Global Capturing Upgrade',
        [schema.GlobalUpgradeType.HEALING_UPGRADE]: 'Global Healing Upgrade'
    }
    if (!teamStat) return <> </>
    return (
        <>
            {teamStat.globalUpgrades.map(
                (type) =>
                    upgradeTypes[type] && (
                        <div className="text-sm flex flex-row justify-center font-bold" key={type}>
                            <DoubleChevronUpIcon />
                            {upgradeTypes[type]}
                        </div>
                    )
            )}
        </>
    )
}
