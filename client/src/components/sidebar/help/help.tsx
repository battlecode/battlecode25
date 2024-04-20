import React from 'react'
import { SectionHeader } from '../../section-header'
import { BATTLECODE_YEAR } from '../../../current-game/Constants'

enum TabType {
    NONE = '',
    OVERVIEW = 'Overview',
    GAME = 'Game Tab',
    RUNNER = 'Runner Tab',
    HOTKEYS = 'Hotkeys'
}

interface Props {
    open: boolean
}

export const HelpPage: React.FC<Props> = (props) => {
    const [openTabType, setOpenTabType] = React.useState(TabType.OVERVIEW)

    const toggleTab = (newType: TabType) => {
        setOpenTabType(newType == openTabType ? TabType.NONE : newType)
    }

    const hotkeyElement = (key: string, description: string) => {
        return (
            <div>
                <div className="font-bold">{key}</div>
                <div>{description}</div>
            </div>
        )
    }

    if (!props.open) return null

    const sections: Record<TabType, JSX.Element> = {
        [TabType.NONE]: <></>,
        [TabType.OVERVIEW]: (
            <>
                <div>
                    {`Welcome to the Battlecode ${BATTLECODE_YEAR} client! `}
                    {`We've completely overhauled the client this year, and we hope it is a better experience overall. `}
                    {`As such, there may be issues, so please let us know if you come across anything at all. `}
                    {`On this page, you will find some basic information about some of the more complex features of the client. `}
                    {`If anything is confusing or you have other questions, feel free to ask. `}
                    <b>{`NOTE: If you are experiencing performance issues on Mac or a laptop, turn off low power mode. `}</b>
                </div>
            </>
        ),
        [TabType.GAME]: (
            <>
                <div>
                    {`The game page is where you will visualize the stats for a game. `}
                    {`Each statistic is specific to a match, and a game may contain multiple matches. `}
                    {`The crown that appears above one team indicates who has won the majority of matches within a game. `}
                    {`Each duck indicates how many ducks currently exist of that type for each team. The first duck is `}
                    {`the standard duck, and the next three are the ducks that have specialized to level four and above. `}
                    {`Red is attack, purple is build, and yellow is heal. The final caged duck represents how many ducks `}
                    {`are in jail. `}
                    {`Finally, the flags represent how many flags each team has that have not been captured. If a flag is `}
                    {`outlined red, it means the flag is currently being carried. `}
                </div>
            </>
        ),
        [TabType.RUNNER]: (
            <>
                <div>
                    {`The runner is an easy way to run games from within the client. `}
                    {`To get started, make sure you are running the desktop version of the client. `}
                    {`Then, select the root folder of the scaffold (battlecode${BATTLECODE_YEAR}-scaffold). `}
                    {`Once you do that, you should see all of your maps and robots loaded in automatically. `}
                    {`Before you run a game, ensure that your JDK installation has been correctly set up. `}
                    {`The runner will attempt to detect the correct version of the JDK and display it in the `}
                    {`dropdown. However, if no versions are listed and the 'Auto' setting does not work, you will `}
                    {`have to manually customize the path to your JDK installation. `}
                    {`Once everything is working, you'll be able to run games from within the client, and the `}
                    {`client will automatically load the game to be visualized once it is complete. `}
                </div>
            </>
        ),
        [TabType.HOTKEYS]: (
            <div className="flex flex-col gap-[10px]">
                {hotkeyElement(`Space`, 'Pauses / Unpauses game')}
                {hotkeyElement(
                    `LeftArrow and RightArrow`,
                    'Controls speed if game is unpaused, or moves the current round if paused'
                )}
                {hotkeyElement(`\` and 1`, 'Scroll through Game, Runner, and Queue')}
                {/*
                {hotkeyElement(
                    `Shift`,
                    'Switches to Queue tab. If you are already on it, prompts you to select a replay file'
                )}
                */}
                {hotkeyElement(
                    `Ctrl/⌘ + O`,
                    'If you are on the queue tab, prompts you to select a replay file. Otherwise, opens the queue tab.'
                )}
                {hotkeyElement(`C`, 'Hides and Unhides Game control bar')}
                {hotkeyElement(`.`, 'Skip to the very last turn of the current game')}
                {hotkeyElement(`,`, 'Skip to the first turn of the current game')}
            </div>
        )
    }

    return (
        <div className="pb-5">
            {Object.getOwnPropertyNames(sections).map((tabType) => {
                if (tabType == TabType.NONE) return null
                return (
                    <SectionHeader
                        key={tabType}
                        title={tabType}
                        open={tabType == openTabType}
                        onClick={() => toggleTab(tabType as TabType)}
                        titleClassName="py-2"
                    >
                        <div className="pl-3 text-xs">{sections[tabType as TabType]}</div>
                    </SectionHeader>
                )
            })}
        </div>
    )
}
