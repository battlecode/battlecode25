import { schema } from 'battlecode-schema'
import Game, { Team } from './Game'
import assert from 'assert'
import Round from './Round'

const EMPTY_ROBOT_COUNTS: Record<schema.RobotType, number> = {
    [schema.RobotType.NONE]: 0,
    [schema.RobotType.MONEY_TOWER]: 0,
    [schema.RobotType.PAINT_TOWER]: 0,
    [schema.RobotType.DEFENSE_TOWER]: 0,
    [schema.RobotType.SOLDIER]: 0,
    [schema.RobotType.MOPPER]: 0,
    [schema.RobotType.SPLASHER]: 0
}

export class TeamRoundStat {
    robotCounts: Record<schema.RobotType, number> = { ...EMPTY_ROBOT_COUNTS }

    copy(): TeamRoundStat {
        const newStat: TeamRoundStat = Object.assign(Object.create(Object.getPrototypeOf(this)), this)

        // Copy any internal objects here
        newStat.robotCounts = { ...this.robotCounts }

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
    applyRoundDelta(round: Round, delta: schema.Round): void {
        // We want to apply the stat to round i + 1 so when we are visualizing
        // round i, we see the state at the end of round i - 1
        assert(
            round.roundNumber === delta.roundId() + 1,
            `Wrong round ID: is ${delta.roundId()}, should be ${round.roundNumber + 1}`
        )

        // Do not recompute if this stat is already completed
        if (this.completed) return

        // Compute team stats for this round
        const time = Date.now()
        for (let i = 0; i < delta.teamIdsLength(); i++) {
            const team = this.game.teams[(delta.teamIds(i) ?? assert.fail('teamID not found in round')) - 1]
            assert(team != undefined, `team ${i} not found in game.teams in round`)
            const teamStat = this.teams.get(team) ?? assert.fail(`team ${i} not found in team stats in round`)

            // Clear robot counts, will be recomputed later
            teamStat.robotCounts = { ...EMPTY_ROBOT_COUNTS }

            /*
            // Compute average datapoint every 10 rounds
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
            */
        }

        for (const body of round.bodies.bodies.values()) {
            const teamStat = round.stat.getTeamStat(body.team)

            // Count number of alive robots
            if (body.dead) continue

            teamStat.robotCounts[body.robotType]++
        }

        const timems = Date.now() - time
        if (timems > 1) console.log(`took ${timems}ms to calculate income averages`)

        this.completed = true
    }

    public getTeamStat(team: Team): TeamRoundStat {
        return this.teams.get(team) ?? assert.fail(`team ${team} not found in team stats in round`)
    }
}
