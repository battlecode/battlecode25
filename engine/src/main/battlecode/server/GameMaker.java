package battlecode.server;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.UnitType;
import battlecode.common.Team;
import battlecode.instrumenter.profiler.Profiler;
import battlecode.instrumenter.profiler.ProfilerCollection;
import battlecode.instrumenter.profiler.ProfilerEventType;
import battlecode.schema.*;
import battlecode.util.FlatHelpers;
import battlecode.util.TeamMapping;
import battlecode.world.*;
import com.google.flatbuffers.FlatBufferBuilder;
import gnu.trove.list.array.TByteArrayList;
import gnu.trove.list.array.TIntArrayList;
import java.util.List;
import java.util.ArrayList;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;

import java.io.*;
import java.util.function.ToIntFunction;
import java.util.zip.GZIPOutputStream;

import static battlecode.util.FlatHelpers.*;

/**
 * Writes a game to a flatbuffer, hooray.
 */
public strictfp class GameMaker {

    /**
     * The protocol expects a series of valid state transitions;
     * we ensure that's true.
     */
    private enum State {
        /**
         * Waiting to write game header.
         */
        GAME_HEADER,
        /**
         * In a game, but not a match.
         */
        IN_GAME,
        /**
         * In a match.
         */
        IN_MATCH,
        /**
         * Complete.
         */
        DONE
    }

    private State state;

    // this un-separation-of-concerns makes me uncomfortable

    /**
     * We write the whole match to this builder, then write it to a file.
     */
    private final FlatBufferBuilder fileBuilder;

    /**
     * Null until the end of the match.
     */
    private byte[] finishedGame;

    /**
     * We have a separate byte[] for each packet sent to the client.
     * This is necessary because flatbuffers shares metadata between structures, so
     * we
     * can't just cut out chunks of the larger buffer :/
     */
    private FlatBufferBuilder packetBuilder;

    /**
     * The server we're sending packets on.
     * May be null.
     */
    private final NetServer packetSink;

    /**
     * Information about the active game.
     */
    private final GameInfo gameInfo;

    /**
     * Only relevant to the file builder:
     * We add a table called a GameWrapper to the front of the saved files
     * that lets you quickly navigate to events by index, and tells you the
     * indices of headers and footers.
     */
    private TIntArrayList events;
    private TIntArrayList matchHeaders;
    private TIntArrayList matchFooters;

    /**
     * The MatchMaker associated with this GameMaker.
     */
    private final MatchMaker matchMaker;

    /**
     * Whether to serialize indicator dots and lines into the flatbuffer.
     */
    private final boolean showIndicators;

    /**
     * @param gameInfo       the mapping of teams to bytes
     * @param packetSink     the NetServer to send packets to
     * @param showIndicators whether to write indicator dots and lines to replay
     */
    public GameMaker(final GameInfo gameInfo, final NetServer packetSink, final boolean showIndicators) {
        this.state = State.GAME_HEADER;

        this.gameInfo = gameInfo;

        this.packetSink = packetSink;
        if (packetSink != null) {
            this.packetBuilder = new FlatBufferBuilder();
        }

        this.fileBuilder = new FlatBufferBuilder();

        this.events = new TIntArrayList();
        this.matchHeaders = new TIntArrayList();
        this.matchFooters = new TIntArrayList();

        this.matchMaker = new MatchMaker();

        this.showIndicators = showIndicators;
    }

    /**
     * Assert we're in a particular state.
     *
     * @param state
     */
    private void assertState(State state) {
        if (this.state != state) {
            throw new RuntimeException("Incorrect GameMaker state: should be " +
                    state + ", but is: " + this.state);
        }
    }

    /**
     * Make a state transition.
     */
    private void changeState(State start, State end) {
        assertState(start);
        this.state = end;
    }

    /**
     * Convert entire game to a byte array.
     *
     * @return game as a packed flatbuffer byte array.
     */
    public byte[] toBytes() {
        if (finishedGame == null) {
            assertState(State.DONE);

            int events = GameWrapper.createEventsVector(fileBuilder, this.events.toArray());
            int matchHeaders = GameWrapper.createMatchHeadersVector(fileBuilder, this.matchHeaders.toArray());
            int matchFooters = GameWrapper.createMatchFootersVector(fileBuilder, this.matchFooters.toArray());

            GameWrapper.startGameWrapper(fileBuilder);
            GameWrapper.addEvents(fileBuilder, events);
            GameWrapper.addMatchHeaders(fileBuilder, matchHeaders);
            GameWrapper.addMatchFooters(fileBuilder, matchFooters);

            fileBuilder.finish(GameWrapper.endGameWrapper(fileBuilder));
            byte[] rawBytes = fileBuilder.sizedByteArray();

            try {
                ByteArrayOutputStream result = new ByteArrayOutputStream();
                GZIPOutputStream zipper = new GZIPOutputStream(result);
                IOUtils.copy(new ByteArrayInputStream(rawBytes), zipper);
                zipper.close();
                zipper.flush();
                result.flush();
                finishedGame = result.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Gzipping failed?", e);
            }
        }
        return finishedGame;
    }

    /**
     * Write a match out to a file.
     *
     * @param saveFile the file to save to
     */
    public void writeGame(File saveFile) {
        if (saveFile == null) {
            throw new RuntimeException("Null file provided to writeGame");
        }

        try {
            FileUtils.writeByteArrayToFile(saveFile, toBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Run the same logic for both builders.
     *
     * @param perBuilder called with each builder; return event id. Should not
     *                   mutate state.
     */
    private void createEvent(ToIntFunction<FlatBufferBuilder> perBuilder) {
        // make file event and add its offset to the list
        int eventAP = perBuilder.applyAsInt(fileBuilder);
        events.add(eventAP);

        if (packetSink != null) {
            // make packet event and package it up
            int eventBP = perBuilder.applyAsInt(packetBuilder);
            packetBuilder.finish(eventBP);
            packetSink.addEvent(packetBuilder.sizedByteArray());

            // reset packet builder
            packetBuilder = new FlatBufferBuilder(packetBuilder.dataBuffer());
        }
    }

    /**
     * Get the MatchMaker associated with this GameMaker.
     */
    public MatchMaker getMatchMaker() {
        return this.matchMaker;
    }

    public void makeGameHeader() {

        changeState(State.GAME_HEADER, State.IN_GAME);

        createEvent((builder) -> {
            int specVersionOffset = builder.createString(GameConstants.SPEC_VERSION);

            int name = builder.createString(gameInfo.getTeamAName());
            int packageName = builder.createString(gameInfo.getTeamAPackage());
            TeamData.startTeamData(builder);
            TeamData.addName(builder, name);
            TeamData.addPackageName(builder, packageName);
            TeamData.addTeamId(builder, TeamMapping.id(Team.A));

            int teamAOffset = TeamData.endTeamData(builder);

            name = builder.createString(gameInfo.getTeamBName());
            packageName = builder.createString(gameInfo.getTeamBPackage());
            TeamData.startTeamData(builder);
            TeamData.addName(builder, name);
            TeamData.addPackageName(builder, packageName);
            TeamData.addTeamId(builder, TeamMapping.id(Team.B));
            int teamBOffset = TeamData.endTeamData(builder);
            int[] teamsVec = { teamAOffset, teamBOffset };

            int teamsOffset = GameHeader.createTeamsVector(builder, teamsVec);
            int robotTypeMetaDataOffset = makeRobotTypeMetadata(builder);

            GameplayConstants.startGameplayConstants(builder);
            //TODO: what gameplay constants do we need?
            // GameplayConstants.addSetupPhaseLength(builder, GameConstants.SETUP_ROUNDS);
            // GameplayConstants.addFlagMinDistance(builder, GameConstants.MIN_FLAG_SPACING_SQUARED);
            // GameplayConstants.addGlobalUpgradeRoundDelay(builder, GameConstants.GLOBAL_UPGRADE_ROUNDS);
            // GameplayConstants.addPassiveResourceRate(builder, GameConstants.PASSIVE_CRUMBS_INCREASE);
            // GameplayConstants.addRobotBaseHealth(builder, GameConstants.DEFAULT_HEALTH);
            // GameplayConstants.addVisionRadius(builder, GameConstants.VISION_RADIUS_SQUARED);
            // GameplayConstants.addActionRadius(builder, GameConstants.ATTACK_RADIUS_SQUARED);
            int constantsOffset = GameplayConstants.endGameplayConstants(builder);

            GameHeader.startGameHeader(builder);
            GameHeader.addSpecVersion(builder, specVersionOffset);
            GameHeader.addTeams(builder, teamsOffset);
            GameHeader.addConstants(builder, constantsOffset);
            GameHeader.addRobotTypeMetadata(builder, robotTypeMetaDataOffset);
            int gameHeaderOffset = GameHeader.endGameHeader(builder);

            return EventWrapper.createEventWrapper(builder, Event.GameHeader, gameHeaderOffset);
        });
    }

    public int makeRobotTypeMetadata(FlatBufferBuilder builder){
        TIntArrayList robotTypeMetadataOffsets = new TIntArrayList();
        for (UnitType type : UnitType.values()){
            //turns all types into level 1 to convert easily into RobotType
            UnitType levelOneType = FlatHelpers.getUnitTypeFromRobotType(FlatHelpers.getRobotTypeFromUnitType(type));
            if (type != levelOneType){
                continue; //avoid double counting
            }
            RobotTypeMetadata.startRobotTypeMetadata(builder);
            RobotTypeMetadata.addType(builder, FlatHelpers.getRobotTypeFromUnitType(type));
            RobotTypeMetadata.addActionCooldown(builder, type.actionCooldown);
            RobotTypeMetadata.addActionRadiusSquared(builder, type.actionRadiusSquared);
            RobotTypeMetadata.addBaseHealth(builder,type.health);
            RobotTypeMetadata.addBytecodeLimit(builder, 1000); //TODO: decide on bytecode limits
            RobotTypeMetadata.addMovementCooldown(builder, GameConstants.MOVEMENT_COOLDOWN); 
            RobotTypeMetadata.addVisionRadiusSquared(builder, GameConstants.VISION_RADIUS_SQUARED);
            robotTypeMetadataOffsets.add(RobotTypeMetadata.endRobotTypeMetadata(builder));
        }
        return GameHeader.createRobotTypeMetadataVector(builder, robotTypeMetadataOffsets.toArray());
    }

    public void makeGameFooter(Team winner) {
        changeState(State.IN_GAME, State.DONE);

        createEvent((builder) -> EventWrapper.createEventWrapper(builder, Event.GameFooter,
                GameFooter.createGameFooter(builder, TeamMapping.id(winner))));
    }

    /**
     * Writes events from match to one or multiple flatbuffers.
     *
     * One of the rare cases where we want a non-static inner class in Java:
     * this basically just provides a restricted interface to GameMaker.
     *
     * There is only one of these per GameMaker.
     */
    public class MatchMaker {

        // Round statistics
        private TIntArrayList teamIDs;
        private TIntArrayList teamMoneyAmounts;

        private ArrayList<Integer> turns; 

        private TIntArrayList diedIds; // ints

        private int currentRound;
        
        //helpers to store all of a robot's actions before commiting them at the end of a turn
        private ArrayList<Integer> currentActions; 
        private ArrayList<Byte> currentActionTypes;

        private int currentMapWidth = -1;


        // Used to write logs.
        private final ByteArrayOutputStream logger;

        public MatchMaker() {
            this.teamIDs = new TIntArrayList();
            this.teamMoneyAmounts = new TIntArrayList();
            this.turns = new ArrayList<>();
            this.diedIds = new TIntArrayList();
            this.currentRound = 0;
            this.logger = new ByteArrayOutputStream();
            this.currentActions = new ArrayList<>();
            this.currentActionTypes = new ArrayList<>();
        }

        public void makeMatchHeader(LiveMap gameMap) {
            changeState(State.IN_GAME, State.IN_MATCH);
            this.currentMapWidth = gameMap.getWidth();
            createEvent((builder) -> {
                int map = GameMapIO.Serial.serialize(builder, gameMap);
                return EventWrapper.createEventWrapper(builder, Event.MatchHeader,
                        MatchHeader.createMatchHeader(builder, map, gameMap.getRounds()));
            });

            matchHeaders.add(events.size() - 1);

            clearData();
        }

        public void makeMatchFooter(Team winTeam, DominationFactor winType, int totalRounds,
                List<ProfilerCollection> profilerCollections) {
            changeState(State.IN_MATCH, State.IN_GAME);

            createEvent((builder) -> {
                TIntArrayList profilerFiles = new TIntArrayList();

                for (ProfilerCollection profilerCollection : profilerCollections) {
                    TIntArrayList frames = new TIntArrayList();
                    TIntArrayList profiles = new TIntArrayList();

                    for (String frame : profilerCollection.getFrames()) {
                        frames.add(builder.createString(frame));
                    }

                    for (Profiler profiler : profilerCollection.getProfilers()) {
                        TIntArrayList events = new TIntArrayList();

                        for (battlecode.instrumenter.profiler.ProfilerEvent event : profiler.getEvents()) {
                            ProfilerEvent.startProfilerEvent(builder);
                            ProfilerEvent.addIsOpen(builder, event.getType() == ProfilerEventType.OPEN);
                            ProfilerEvent.addAt(builder, event.getAt());
                            ProfilerEvent.addFrame(builder, event.getFrameId());
                            events.add(ProfilerEvent.endProfilerEvent(builder));
                        }

                        int nameOffset = builder.createString(profiler.getName());
                        int eventsOffset = ProfilerProfile.createEventsVector(builder, events.toArray());

                        ProfilerProfile.startProfilerProfile(builder);
                        ProfilerProfile.addName(builder, nameOffset);
                        ProfilerProfile.addEvents(builder, eventsOffset);
                        profiles.add(ProfilerProfile.endProfilerProfile(builder));
                    }

                    int framesOffset = ProfilerFile.createFramesVector(builder, frames.toArray());
                    int profilesOffset = ProfilerFile.createProfilesVector(builder, profiles.toArray());

                    profilerFiles.add(ProfilerFile.createProfilerFile(builder, framesOffset, profilesOffset));
                }

                int profilerFilesOffset = MatchFooter.createProfilerFilesVector(builder, profilerFiles.toArray());

                return EventWrapper.createEventWrapper(builder, Event.MatchFooter,
                        MatchFooter.createMatchFooter(builder, TeamMapping.id(winTeam),
                                FlatHelpers.getWinTypeFromDominationFactor(winType), totalRounds, profilerFilesOffset));
            });

            matchFooters.add(events.size() - 1);
        }

        public void startRound(int roundNum) {
            assertState(State.IN_MATCH);

            try {
                this.logger.flush();
            } catch (IOException e) {
                throw new RuntimeException("Can't flush byte[]outputstream?", e);
            }
            // byte[] logs = this.logger.toByteArray();
            this.logger.reset();
            this.currentRound = roundNum;
        }

        public void endRound(){
            createEvent((builder) -> {
                // Round statistics
                int teamIDsP = Round.createTeamIdsVector(builder, teamIDs.toArray());
                int teamMoneyAmountsP = Round.createTeamResourceAmountsVector(builder, teamMoneyAmounts.toArray());
                int diedIdsP = Round.createDiedIdsVector(builder, diedIds.toArray());
                int turnsOffset = Round.createTurnsVector(builder, ArrayUtils.toPrimitive(this.turns.toArray(new Integer[this.turns.size()])));

                Round.startRound(builder);
                Round.addTeamIds(builder, teamIDsP);
                Round.addRoundId(builder, this.currentRound);
                Round.addTeamResourceAmounts(builder, teamMoneyAmountsP);
                Round.addDiedIds(builder, diedIdsP);
                Round.addTurns(builder, turnsOffset);
                int round = Round.endRound(builder);
                return EventWrapper.createEventWrapper(builder, Event.Round, round);
            });

            clearData();
        }

        public void startTurn(int robotID){
            //TODO: intiialize anything needed here
            return;
        }

        public void endTurn(int robotID, int health, int paint, int movementCooldown, int actionCooldown, int bytecodesUsed, 
        MapLocation loc){
            int actionsOffset = Turn.createActionsVector(fileBuilder, ArrayUtils.toPrimitive(this.currentActions.toArray(new Integer[this.currentActions.size()])));
            
            int actionTypesOffsets = Turn.createActionsTypeVector(fileBuilder, ArrayUtils.toPrimitive(this.currentActionTypes.toArray(new Byte[this.currentActionTypes.size()])));

            Turn.startTurn(fileBuilder);
            Turn.addRobotId(fileBuilder, robotID);
            Turn.addActions(fileBuilder, actionsOffset);
            Turn.addActionsType(fileBuilder, actionTypesOffsets);
            Turn.addHealth(fileBuilder, health);
            Turn.addPaint(fileBuilder, paint);
            Turn.addMoveCooldown(fileBuilder, movementCooldown);
            Turn.addActionCooldown(fileBuilder, actionCooldown);
            Turn.addBytecodesUsed(fileBuilder, bytecodesUsed);
            Turn.addX(fileBuilder, loc.x);
            Turn.addY(fileBuilder, loc.y);
            int turnOffset = Turn.endTurn(fileBuilder);
            this.turns.add(turnOffset);
            this.currentActions.clear();
            this.currentActionTypes.clear();
        }

        /**
         * @return an outputstream that will be baked into the output file
         */
        public OutputStream getOut() {
            return logger;
        }

        /// Generic action representing damage to a robot
        public void addDamageAction(int damagedRobotID, int damage){
            int action = DamageAction.createDamageAction(fileBuilder, damagedRobotID, damage);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.DamageAction);
        }


        /// Visually indicate a tile has been painted
        public void addPaintAction(MapLocation loc, boolean isSecondary){ 
            int action = PaintAction.createPaintAction(fileBuilder, locationToInt(loc), isSecondary ? (byte) 1 : 0);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.PaintAction);
        }

        /// Visually indicate a tile's paint has been removed
        public void addUnpaintAction(MapLocation loc){
            int action = UnpaintAction.createUnpaintAction(fileBuilder, locationToInt(loc));
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.UnpaintAction);
        }

        /// Visually indicate an attack
        public void addAttackAction(int otherID){
            int action = AttackAction.createAttackAction(fileBuilder, otherID);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.AttackAction);
        }

        /// Visually indicate a mop attack
        public void addMopAction(MapLocation loc){
            int action = MopAction.createMopAction(fileBuilder, locationToInt(loc));
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.MopAction);
        }

        /// Visually indicate a tower being built
        public void addBuildAction(int towerID){
            int action = BuildAction.createBuildAction(fileBuilder, towerID);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.BuildAction);
        }


        /// Visually indicate transferring paint from one robot to another
        public void addTransferAction(int otherRobotID){
            int action = TransferAction.createTransferAction(fileBuilder, otherRobotID);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.TransferAction);
        }

        /// Visually indicate messaging from one robot to another
        public void addMessageAction(int receiverID, int data){
            int action = MessageAction.createMessageAction(fileBuilder, receiverID, data);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.MessageAction);
        }

        /// Indicate that this robot was spawned on this turn
        public void addSpawnAction(MapLocation loc, Team team, UnitType type){
            byte teamID = TeamMapping.id(team);
            byte robotType = FlatHelpers.getRobotTypeFromUnitType(type);
            int action = SpawnAction.createSpawnAction(fileBuilder, loc.x, loc.y, teamID, robotType);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.SpawnAction);
        }

        //visually indicates tower has been upgraded
        public void addUpgradeAction(int towerID){
            int action = UpgradeAction.createUpgradeAction(fileBuilder, towerID);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.UpgradeAction);
        }

        public void addDieExceptionAction(){
            int action = DieExceptionAction.createDieExceptionAction(fileBuilder, (byte) -1);
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.DieExceptionAction);
        }

        public void addTeamInfo(Team team, int moneyAmount) {
            teamIDs.add(TeamMapping.id(team));
            teamMoneyAmounts.add(moneyAmount);
        }

        public void addTimelineMarker(String label){
            int action = TimelineMarkerAction.createTimelineMarkerAction(fileBuilder, fileBuilder.createString(label));
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.TimelineMarkerAction);
        }

        /// Update the indicator string for this robot
        public void addIndicatorString(int id, String string) {
            if (!showIndicators) {
                return;
            }
            int action = IndicatorStringAction.createIndicatorStringAction(fileBuilder, fileBuilder.createString(string));
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.IndicatorStringAction);
        }

        /// Update the indicator dot for this robot
        public void addIndicatorDot(int id, MapLocation loc, int red, int green, int blue) {
            if (!showIndicators) {
                return;
            }
            int action = IndicatorDotAction.createIndicatorDotAction(fileBuilder, locationToInt(loc), FlatHelpers.RGBtoInt(red, green, blue));
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.IndicatorDotAction);
        }

        /// Update the indicator line for this robot
        public void addIndicatorLine(int id, MapLocation startLoc, MapLocation endLoc, int red, int green, int blue) {
            if (!showIndicators) {
                return;
            }
            int action = IndicatorLineAction.createIndicatorLineAction(fileBuilder, locationToInt(startLoc), locationToInt(endLoc), FlatHelpers.RGBtoInt(red, green, blue));
            this.currentActions.add(action);
            this.currentActionTypes.add(Action.IndicatorLineAction);
        }

        public void addBytecodes(int bytecodes) {
            Turn.addBytecodesUsed(fileBuilder, bytecodes);
        }

        public void addDied(int id) {
            diedIds.add(id);
        }

        private int locationToInt(MapLocation loc){
            return loc.x + this.currentMapWidth * loc.y;
        }


        private void clearData() {
            this.teamIDs.clear();
            this.teamMoneyAmounts.clear();
            this.turns.clear();
            this.diedIds.clear();
        }
    }
}
