package battlecode.common;

/**
 * Enumerates the different skill types a unit can specialize in.
 */

public enum SkillType{

    // base skill effect, base cooldown - build is 0 because variable
    /**
     * Attacking immediately reduces one enemy unit's (in range) base health by 150 (level 0), with a cooldown cost of 20.
     */
    ATTACK(150, 20),
    
    /**
     * Build uses team resources to dig, fill, or build a trap.
     */
    BUILD(0, 0),
    
    /**
     * Healing adds 80 health points to a nearby friendly unit, with a cooldown cost of 30. (level 0)
     */
    HEAL(80, 30);

    public int skillEffect;
    public int cooldown;


    /**
     * Returns the number of experience points needed to achieve each level.
     * 
     * @param level the level
     * @return number of experience points needed to achieve each level
     * 
     * @battlecode.doc.costlymethod
     */
    public int getExperience(int level){
        int[] attackExperience = {0, 15, 30, 45, 75, 110, 150};
        int[] buildExperience = {0, 5, 10, 15, 20, 25, 30};
        int[] healExperience = {0, 20, 40, 70, 100, 140, 180};
        switch(this){
            case ATTACK: return attackExperience[level];
            case BUILD: return buildExperience[level];
            case HEAL: return healExperience[level];
        }
        return 0;
    }

    // NOTE: These are using percentages except for attack, standardize later

    /**
     * Returns the change in cooldown for each level.
     * 
     * @param level the level
     * @return change in cooldown for each level
     * 
     * @battlecode.doc.costlymethod
     */
    public int getCooldown(int level){
        int[] attackCooldown = {0, -5, -7, -10, -20, -35, -60};
        int[] buildCooldown = {0, -5, -10, -15, -20, -30, -50};
        int[] healCooldown = {0, -5, -10, -15, -15, -15, -25};
        switch(this){
            case ATTACK: return attackCooldown[level];
            case BUILD: return buildCooldown[level];
            case HEAL: return healCooldown[level];
        }
        return 0;
    }

    // ALL PERCENTAGES RN

    /**
     * Returns the change in skill effect for each level
     * 
     * @param level the level
     * @return change in skill effect for each level
     * 
     * @battlecode.doc.costlymethod
     */
    public int getSkillEffect(int level){
        int[] attackSkill = {0, 5, 7, 10, 30, 35, 60};
        int[] buildSkill = {0, -10, -15, -20, -30, -40, -50};
        int[] healSkill = {0, 3, 5, 7, 10, 15, 25};
        switch(this){
            case ATTACK: return attackSkill[level];
            case BUILD: return buildSkill[level];
            case HEAL: return healSkill[level];
        }
        return 0;
    }

    /**
     * Returns the level of specialization a robot is given their experience
     * 
     * @param experience how much experience in the skill the robot has
     * @return the level in the skill the robot is
     * 
     * @battlecode.doc.costlymethod
     */
    public int getLevel(int experience){
        int level = 0;
        while (level < 6 && this.getExperience(level+1) <= experience ) level += 1;
        return level;
    }

    SkillType(int skillEffect, int cooldown){
        this.skillEffect = skillEffect;
        this.cooldown = cooldown;
    }
}