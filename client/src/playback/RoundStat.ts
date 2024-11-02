import { schema } from 'battlecode-schema'
import Game, { Team } from './Game'
import assert from 'assert'
import Round from './Round'

export class TeamRoundStat {
    robots: [number, number, number, number, number] = [0, 0, 0, 0, 0]
    specializationTotalLevels: [number, number, number, number, number] = [0, 0, 0, 0, 0]
    resourceAmount: number = 0
    resourceAmountAverageDatapoint: number | undefined = undefined
    globalUpgrades: schema.GlobalUpgradeType[] = []

    copy(): TeamRoundStat {
        const newStat: TeamRoundStat = Object.assign(Object.create(Object.getPrototypeOf(this)), this)

        // Copy any internal objects here
        newStat.robots = [...this.robots]
        newStat.specializationTotalLevels = [...this.specializationTotalLevels]
        newStat.globalUpgrades = [...this.globalUpgrades]

        return newStat
    }
}

export default class RoundStat {
    private readonly teams: Map<Team, TeamRoundStat>
    private readonly game: Game
    public completed: boolean = false

    constructor(game: Game, teams?: Map<Team, TeamRoundStat>) {
        this.game = game
        this.teams =
            teams ??
            new Map([
                [game.teams[0], new TeamRoundStat()],
                [game.teams[1], new TeamRoundStat()]
            ])
    }

    copy(): RoundStat {
        const newTeamStats = new Map(this.teams)
        for (const [team, stat] of this.teams) newTeamStats.set(team, stat.copy())
        const copy = new RoundStat(this.game, newTeamStats)
        copy.completed = this.completed
        return copy
    }

    /**
     * Mutates this stat to reflect the given delta.
     */
    applyDelta(round: Round, delta: schema.Round): void {
        assert(!this.completed, 'Cannot apply delta to completed round')
        assert(
            round.roundNumber === delta.roundId(),
            `Wrong round ID: is ${delta.roundId()}, should be ${round.roundNumber}`
        )

        for (var i = 0; i < delta.teamIdsLength(); i++) {
            const team = this.game.teams[(delta.teamIds(i) ?? assert.fail('teamID not found in round')) - 1]
            assert(team != undefined, `team ${i} not found in game.teams in round`)
            const teamStat = this.teams.get(team) ?? assert.fail(`team ${i} not found in team stats in round`)

            teamStat.resourceAmount =
                delta.teamResourceAmounts(i) ?? assert.fail('teamResourceAmounts not found in round')
        }

        const time = Date.now()
        for (const team of this.game.teams) {
            if (round.roundNumber % 10 == 0) {
                const teamStat = this.teams.get(team) ?? assert.fail(`team ${team} not found in team stats in round`)
                let avgValue = teamStat.resourceAmount
                let avgCount = 1
                for (let i = round.roundNumber - 1; i >= Math.max(0, round.roundNumber - 100); i--) {
                    const prevStat = round.match.stats[i].getTeamStat(team)
                    avgValue += prevStat.resourceAmount
                    avgCount += 1
                }

                teamStat.resourceAmountAverageDatapoint = avgValue / avgCount
            }
        }
        const timems = Date.now() - time
        if (timems > 1) console.log(`took ${timems}ms to calculate income averages`)

        this.completed = true
    }

    public getTeamStat(team: Team): TeamRoundStat {
        return this.teams.get(team) ?? assert.fail(`team ${team} not found in team stats in round`)
    }
}
