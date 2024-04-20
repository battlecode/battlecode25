import assert from 'assert'

export default class Tournament {
    private readonly games: TournamentGame[]
    private readonly gamesByTeamID: Map<number, TournamentGame[]>
    public readonly winnersBracketRoot: TournamentGame
    public readonly losersBracketRoot: TournamentGame | undefined
    public readonly name: string
    public readonly maxRound: number
    public readonly minRound: number = 0
    public readonly participantCount: number

    constructor(raw_games: JsonTournamentGame[]) {
        let nextID = -1
        let name = ''
        let participants = new Set()
        this.games = raw_games
            // .filter((game) => game.tournament_round.release_status === 2)
            .map((game) => {
                name = game.tournament_round.tournament
                const team0 = game.participants.find((p) => p.player_index === 0)
                const team1 = game.participants.find((p) => p.player_index === 1)
                assert(team0 && team1, 'Missing team in round')
                assert(team0.score != team1.score, 'Tie games not supported')
                const winnerIndex = team0.score > team1.score ? 0 : 1
                nextID++
                participants.add(team0.team)
                participants.add(team1.team)
                return {
                    id: nextID,
                    teams: [team0.teamname, team1.teamname],
                    teamIDs: [team0.team, team1.team],
                    dependsOn: [undefined, undefined],
                    winnerIndex: winnerIndex,
                    round: game.tournament_round.external_id,
                    viewed: false,
                    gameFile: game.replay_url,
                    displayOrder: game.tournament_round.display_order
                }
            })

        this.gamesByTeamID = new Map()
        for (const game of this.games.values()) {
            for (const teamID of game.teamIDs) {
                if (!this.gamesByTeamID.has(teamID)) this.gamesByTeamID.set(teamID, [])
                this.gamesByTeamID.get(teamID)!.push(game)
            }
        }

        let maxRound = Math.max(...this.games.map((g) => g.round))
        const maxRoundGames = this.games.filter((g) => g.round === maxRound)
        while (maxRoundGames.length > 1) {
            for (let i = 0; i < maxRoundGames.length - 1; i += 2) {
                console.log(maxRoundGames[i].teams, maxRoundGames[i + 1].teams)
                const game: TournamentGame = {
                    id: ++nextID,
                    teams: [
                        maxRoundGames[i].teams[maxRoundGames[i].winnerIndex],
                        maxRoundGames[i + 1].teams[maxRoundGames[i + 1].winnerIndex]
                    ],
                    teamIDs: [
                        maxRoundGames[i].teamIDs[maxRoundGames[i].winnerIndex],
                        maxRoundGames[i + 1].teamIDs[maxRoundGames[i + 1].winnerIndex]
                    ],
                    dependsOn: [undefined, undefined],
                    winnerIndex: 0,
                    round: ++maxRound,
                    viewed: false,
                    gameFile: '',
                    displayOrder: 0
                }
                maxRoundGames.splice(i, 2, game)
                this.games.push(game)
            }
        }
        this.name = name
        this.maxRound = maxRound
        this.participantCount = participants.size
        this.winnersBracketRoot = maxRoundGames[0]
        this.setGameDependents(this.winnersBracketRoot)
        this.setRoundRelativeIDs(this.winnersBracketRoot)

        let minRound = Math.min(...this.games.map((g) => g.round))
        if (minRound < 0) {
            const minRoundGames = this.games.filter((g) => g.round === minRound)
            while (minRoundGames.length > 1) {
                for (let i = 0; i < minRoundGames.length - 1; i += 2) {
                    const game: TournamentGame = {
                        id: ++nextID,
                        teams: [
                            minRoundGames[i].teams[minRoundGames[i].winnerIndex],
                            minRoundGames[i + 1].teams[minRoundGames[i + 1].winnerIndex]
                        ],
                        teamIDs: [
                            minRoundGames[i].teamIDs[minRoundGames[i].winnerIndex],
                            minRoundGames[i + 1].teamIDs[minRoundGames[i + 1].winnerIndex]
                        ],
                        dependsOn: [undefined, undefined],
                        winnerIndex: 0,
                        round: --minRound,
                        viewed: false,
                        gameFile: '',
                        displayOrder: 0
                    }
                    minRoundGames.splice(i, 2, game)
                    this.games.push(game)
                }
            }
            this.minRound = minRound
            this.losersBracketRoot = minRoundGames[0]
            this.setGameDependents(this.losersBracketRoot)
            this.setRoundRelativeIDs(this.losersBracketRoot)
        }

        // correct game ids by display order
        let nextDisplayOrder = 0
        let gamesWithDisplayOrder = this.games.filter((g) => g.displayOrder === nextDisplayOrder)
        let idOffset = 0
        while (gamesWithDisplayOrder.length > 0) {
            for (const game of gamesWithDisplayOrder) {
                game.id += idOffset
            }
            idOffset += gamesWithDisplayOrder.length
            nextDisplayOrder++
            gamesWithDisplayOrder = this.games.filter((g) => g.displayOrder === nextDisplayOrder)
        }
    }

    setRoundRelativeIDs(game: TournamentGame) {
        let lastRound = [game]
        while (lastRound.length > 0) {
            let idInRound = 0
            for (const game of lastRound) {
                game.id = idInRound++
            }

            const nextRound = []
            for (const game of lastRound) {
                if (game.dependsOn[0]) nextRound.push(game.dependsOn[0])
                if (game.dependsOn[1]) nextRound.push(game.dependsOn[1])
            }
            lastRound = nextRound
        }
    }

    getTeamGameInRound(teamID: number, round: number): TournamentGame | undefined {
        const games = this.gamesByTeamID.get(teamID)!.filter((g) => g.round === round)
        assert(games.length === 1 || games.length === 0, 'Multiple games in round')
        return games.length === 1 ? games[0] : undefined
    }

    setGameDependents(game: TournamentGame) {
        assert(game.round != 0, '0th round shouldnt exist')

        const dependentRound = game.round > 0 ? game.round - 1 : game.round + 1
        game.dependsOn = [
            this.getTeamGameInRound(game.teamIDs[0], dependentRound),
            this.getTeamGameInRound(game.teamIDs[1], dependentRound)
        ]

        // Don't need to render the tree twice
        if (game.dependsOn[0] == game.dependsOn[1]) {
            game.dependsOn[1] = undefined
        }

        if (game.round > 0) {
            // Check if an associated losers bracket game exists
            const losersGame = this.getTeamGameInRound(game.teamIDs[1], -(game.round - 1))
            if (losersGame && !game.dependsOn[1]) {
                game.dependsOn[1] = losersGame
            }
        }

        if (game.dependsOn[0]) this.setGameDependents(game.dependsOn[0])
        if (game.dependsOn[1]) this.setGameDependents(game.dependsOn[1])
    }
}

export type TournamentState = {
    minRoundWinners: number
    maxRoundWinners: number
    minRoundLosers: number
    maxRoundLosers: number
    showLosers: boolean
}

export const DEFAULT_TOURNAMENT_STATE: TournamentState = {
    minRoundWinners: 1,
    maxRoundWinners: 1,
    minRoundLosers: 1,
    maxRoundLosers: 1,
    showLosers: false
}

export type TournamentGame = {
    id: number
    teams: [string, string]
    teamIDs: [number, number]
    dependsOn: [TournamentGame | undefined, TournamentGame | undefined]
    round: number
    winnerIndex: 0 | 1
    viewed: boolean
    gameFile: string
    displayOrder: number
}

export type JsonTournamentGame = {
    tournament_round: {
        external_id: number
        tournament: string
        name: string
        release_status: number
        display_order: number
    }
    participants: {
        team: number
        teamname: string
        player_index: number
        score: number
    }[]
    replay_url: string
}
