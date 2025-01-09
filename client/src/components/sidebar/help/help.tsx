import React from 'react'
import { SectionHeader } from '../../section-header'
import { BATTLECODE_YEAR } from '../../../constants'

enum TabType {
    NONE = '',
    OVERVIEW = 'Overview',
    WHATS_NEW = "What's New",
    DISPLAY = 'Game Area',
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
                    <div className="h-2" />
                    {`We've once again made massive updates to the client this year, and we hope it is a better experience overall. `}
                    {`As such, there may be issues, so please let us know if you come across anything at all. `}
                    <div className="h-2" />
                    {`On this page, you will find some basic information about some of the more complex features of the client. `}
                    {`If anything is confusing or you have other questions, feel free to ask. `}
                    <div className="h-2" />
                    <b>{`NOTE: If you are experiencing performance issues on Mac or a laptop, turn off low power mode. Also, check the config tab for performance settings. `}</b>
                </div>
            </>
        ),
        [TabType.WHATS_NEW]: (
            <>
                <ul>
                    <li>{`- Per-robot turn visualization (activate by pressing 'T')`}</li>
                    <li>{`- Reworked action/round display (see game area tab)`}</li>
                    <li>{`- Map pan & zoom`}</li>
                    <li>{`- Python support`}</li>
                    <li>{`- Better error reporting for crashes`}</li>
                    <li>{`- Bytecode profiler`}</li>
                    <li>{`- Timeline markers`}</li>
                    <li>{`- Map editor undo`}</li>
                    <li>{`- Runner console click to focus robot`}</li>
                    <li>{`- Other runner improvements`}</li>
                </ul>
            </>
        ),
        [TabType.DISPLAY]: (
            <>
                <div>
                    {`The display area is on the right side of the screen, and it is where you will visualize games. `}
                    {`Here, you will see both teams' robots moving around and performing actions as they attempt to win the game. `}
                    <div className="h-2" />
                    {`Playback can be controlled via hotkeys or the control bar at the bottom of the screen. `}
                    {`When looking at turn n, you are seeing a snapshot of the state and all actions that occurred at the end of round n-1. `}
                    {`Thus, at round 1, you see the state of the game before any actions have occurred. `}
                    {`The last 'round' of the game shows the state after the last turn occurred. `}
                </div>
            </>
        ),
        [TabType.GAME]: (
            <>
                <div>
                    {`The game page is where you will visualize the stats for a game. `}
                    {`Each statistic is specific to a match, and a game may contain multiple matches. `}
                    <div className="h-2" />
                    {`The crown that appears above one team indicates who has won the majority of matches within a game. `}
                    {`Each robot icon indicates how many robots currently exist of that type for each team. The first three are towers, `}
                    {`and the next three are the regular robot bunnies. `}
                    {`The other stats are reasonably self-explanatory.`}
                </div>
            </>
        ),
        [TabType.RUNNER]: (
            <>
                <div>
                    {`The runner is an easy way to run games from within the client. `}
                    {`To get started, make sure you are running the desktop version of the client. `}
                    {`Then, select the root folder of your language's scaffold (battlecode${
                        BATTLECODE_YEAR % 100
                    }-scaffold/YOUR-LANGUAGE). `}
                    {`Once you do that, you should see all of your maps and robots loaded in automatically. `}
                    <div className="h-2" />
                    {`Before you run a game, ensure that your language installation has been correctly set up. `}
                    {`The runner will attempt to detect the correct version of your language and display it in the `}
                    {`dropdown. However, if no compatible versions are listed and the 'Auto' setting does not work, you will `}
                    {`have to manually customize the path to your language installation. `}
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
                    'Controls speed if game is unpaused, or moves the current round/turn if paused'
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
                {hotkeyElement(`R`, 'Resets the map camera if it has been panned/zoomed')}
                {hotkeyElement(`C`, 'Hides and unhides game control bar')}
                {hotkeyElement(`T`, 'Toggles per-turn playback for the current game')}
                {hotkeyElement(`F`, 'Toggles per-turn robot focus config')}
                {hotkeyElement(`.`, 'Skip to the very last round of the current game')}
                {hotkeyElement(`,`, 'Skip to the first round of the current game')}
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
