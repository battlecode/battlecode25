# Battlecode 2025

🚩

## Note, Competitors
This is the development repo! You most likely won't need anything in here; do not clone this.
Instead, follow the instructions [here](https://play.battlecode.org/bc25java/quick_start) to get started.

## Repository Structure

- `/engine`: Game engine in Java
- `/specs`: Game specs in Markdown (and HTML generation)
- `/schema`: Game serialization schema (basically, an encoding of all units and events in a game)
- `/client`: Game client (visualizer and playback) in TypeScript
- `/example-bots`: A bunch of example bots for the game!

## Development

### Engine

Windows users: Instead of `./gradlew`, use `gradlew` for all commands.

(whenever Gradle has problems with something, run `./gradlew clean` and see if it helps)

To run a game, run

```
./gradlew headless
```

The replay file will be in `/matches`. Use `headlessX` for bots that are in `battlecode20-internal-test-bots`. You can specify the robot code and map like this: `./gradlew headless -Pmaps=maptestsmall -PteamA=examplefuncsplayer -PteamB=examplefuncsplayer`.

### Client

(Make sure you have a recent version of `npm`: `sudo npm cache clean -f && sudo npm install -g n && sudo n stable && PATH="$PATH"`.)

Navigate to the `client` folder and run `npm run install-all`. You can then run

```
npm run watch
```

which will launch the client on http://localhost:8080 (if available).

## Notes for porting to a new repo

When the next edition of Battlecode comes around, it will probably useful to reuse a fair amount of this codebase. Maintaining git history is nice. Use `git-filter-repo` for this:

```
pip3 install git-filter-repo
```

Make sure you have a recent git version (run `git --version` and make sure it's compatible with git-filter-repo).

As an example, the following steps were taken to port from `battlehack20` to this repo:

First, create a fresh `battlecode21` repo on GitHub. Clone it. Then, starting in that repo:

```
cd ..
git clone https://github.com/battlecode/battlehack20 battlehack20-export
cd battlehack20-export
git filter-repo --tag-rename '':'bh20-'
cd ..
cd battlecode21
git pull ../battlehack20-export —allow-unrelated-histories
```

(Git filter-repo can do lots of cool things; see its documenation, old examples in our repo, etc. for ideas. For example, renaming directories is possible. )

Then, port all of the codebase! Don't forget to update the files in the highest level of the repo too, such as this readme itself, and the release script.
