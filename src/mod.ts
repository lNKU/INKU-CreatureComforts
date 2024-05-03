import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { BaseClasses } from "@spt-aki/models/enums/BaseClasses";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import { IQuestCondition } from "@spt-aki/models/eft/common/tables/IQuest";
import { IQuest } from "@spt-aki/models/eft/common/tables/IQuest";

class CreatureComforts implements IPostDBLoadMod {
    readonly modName = "CreatureComforts";
    
    private logger: ILogger;
    private debug: boolean = false;

    public postDBLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");

        const database = container.resolve<DatabaseServer>("DatabaseServer").getTables(); // get database from server
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const itemHelper: ItemHelper = container.resolve<ItemHelper>("ItemHelper");

        const globals = database.globals;
        const globalsXP = globals.config.exp.level.exp_table;
        const globalsHealth = globals.config.Health;
        const globalsStamina = globals.config.Stamina;
        const globalsInertia = globals.config.Inertia;
        const quests = database.templates.quests;
        const items = Object.values(database.templates.items);
        const ammunition = items.filter(x => x._type === "Item" && itemHelper.isOfBaseclass(x._id, BaseClasses.AMMO))
        const currencies = items.filter(x => x._type === "Item" && itemHelper.isOfBaseclass(x._id, BaseClasses.MONEY));

        const hideoutProds = database.hideout.production;
        const hideoutZones = database.hideout.areas;
        const hideoutScavs = database.hideout.scavcase;

        //Buff Fuel Can Resource limits
        for (const i in items) {
            if (items[i]._parent === "5d650c3e815116009f6201d2") {
                if (items[i]._id === "5d1b36a186f7742523398433") { //Metal Fuel Tank
                    items[i]._props.Resource = 220
                    items[i]._props.MaxResource = 220

                } else if (items[i]._id === "5d1b371186f774253763a656") { //Expeditionary Fuel Tank
                    items[i]._props.Resource = 100
                    items[i]._props.MaxResource = 100

                }
            }
        }

        const itemCaseIds = [
            "5aafbcd986f7745e590fff23", "5c127c4486f7745625356c13", "5aafbde786f774389d0cbc0f", 
            "5e2af55f86f7746d4159f07c", "59fb023c86f7746d0d4b423c", "59fb016586f7746d0d4b423a"
        ]

        const junkboxCaseIds = [
            "5b7c710788a4506dec015957", "5b6d9ce188a4501afc1b2b25"
        ]

        for (const itemCase in items) {
            if (items[itemCase]._parent === "5795f317245977243854e041") {
                if (itemCaseIds.includes(items[itemCase]._id)) {
                    items[itemCase]._props.Grids[0]._props.cellsH = 10;
                    items[itemCase]._props.Grids[0]._props.cellsV = 10;
                    this.logger.logWithColor(`Case ${items[itemCase]._props.ShortName} grid size updated.`, LogTextColor.GREEN)
                    
                } else if (junkboxCaseIds.includes(items[itemCase]._id)) {
                    items[itemCase]._props.Grids[0]._props.cellsH = 15;
                    items[itemCase]._props.Grids[0]._props.cellsV = 15;
                    this.logger.logWithColor(`Case ${items[itemCase]._props.ShortName} grid size updated.`, LogTextColor.GREEN)
                }
            }
        }

        // Inertia adjustments
        globals.config.Inertia.BaseJumpPenalty /= 4; // 0.03
        globals.config.Inertia.CrouchSpeedAccelerationRange.x /= 4; // 4.75
        globals.config.Inertia.CrouchSpeedAccelerationRange.y /= 4; // 7.5
        globals.config.Inertia.ExitMovementStateSpeedThreshold.x /= 4; // 0.001
        globals.config.Inertia.ExitMovementStateSpeedThreshold.y /= 4; // 0.001
        globals.config.Inertia.InertiaLimitsStep /= 4; // 0.1
        globals.config.Inertia.MaxTimeWithoutInput.x /= 4; // 0.01
        globals.config.Inertia.MaxTimeWithoutInput.y /= 4; // 0.03
        globals.config.Inertia.PreSprintAccelerationLimits.x /= 4; // 8
        globals.config.Inertia.PreSprintAccelerationLimits.y /= 4; // 4
        globals.config.Inertia.SprintAccelerationLimits.x /= 4; // 15
        globals.config.Inertia.SprintBrakeInertia.y /= 4; // 0
        globals.config.Inertia.SprintTransitionMotionPreservation.x /= 4; // 0.006
        globals.config.Inertia.SprintTransitionMotionPreservation.y /= 4; // 0.008
        globals.config.Inertia.WalkInertia.x /= 4; // 0.002
        globals.config.Inertia.WalkInertia.y /= 4; // 0.025

        globalsXP.forEach((expLvl, index) => {
            const reqExp = expLvl.exp;

            if (index + 1 <= 10) {
                expLvl.exp *= 1.45;
                
            } else if (index + 1 > 10 && index + 1 <= 70) {
                expLvl.exp *= 1.55;
            } else if (index + 1 === 71) {
                expLvl.exp *= 1.35;
            } else if (index + 1 > 71) {
                expLvl.exp *= 1.25;
            }
            
            // Round the EXP value
            expLvl.exp = Math.ceil(expLvl.exp);
            
            if (this.debug) {
                this.logger.logWithColor(`[${this.modName}]: Lv${index + 1} - Required EXP: ${reqExp}`, LogTextColor.GRAY);
                this.logger.logWithColor(`[${this.modName}]: Lv${index + 1} - Updated EXP: ${expLvl.exp}\n`, LogTextColor.WHITE);
            }
        });
        
        // Halve Energy and Hydration Damage
        globalsHealth.Effects.Existence.EnergyDamage /= 2;
        globalsHealth.Effects.Existence.HydrationDamage /= 2;
        if (this.debug) {
            this.logger.logWithColor(`[${this.modName}]: ### DEBUG ### energyDamage is now ${globalsHealth.Effects.Existence.EnergyDamage}.`, LogTextColor.YELLOW);
            this.logger.logWithColor(`[${this.modName}]: ### DEBUG ### hydrationDamage is now ${globalsHealth.Effects.Existence.HydrationDamage}.\n`, LogTextColor.YELLOW)
        }

        // Increase Carry Weight limits
        globalsStamina.BaseOverweightLimits.x *= 1.375;
        globalsStamina.BaseOverweightLimits.y *= 1.375;

        globalsStamina.SprintOverweightLimits.x *= 1.375;
        globalsStamina.SprintOverweightLimits.y *= 1.375;

        globalsStamina.WalkOverweightLimits.x *= 1.475;
        globalsStamina.WalkOverweightLimits.y *= 1.475;

        globalsStamina.WalkSpeedOverweightLimits.x *= 1.57;
        globalsStamina.WalkSpeedOverweightLimits.y *= 1.57;

        if (this.debug) {
            this.logger.logWithColor(`[${this.modName}]: ### DEBUG ### BaseOverweightLimits are now ${globalsStamina.BaseOverweightLimits.x}kg and ${globalsStamina.BaseOverweightLimits.y}kg.`, LogTextColor.CYAN);
            this.logger.logWithColor(`[${this.modName}]: ### DEBUG ### SprintOverweightLimits are now ${globalsStamina.SprintOverweightLimits.x}kg and ${globalsStamina.SprintOverweightLimits.y}kg.`, LogTextColor.YELLOW);
            this.logger.logWithColor(`[${this.modName}]: ### DEBUG ### WalkOverweightLimits are now ${globalsStamina.WalkOverweightLimits.x}kg and ${globalsStamina.WalkOverweightLimits.y}kg.`, LogTextColor.CYAN);
            this.logger.logWithColor(`[${this.modName}]: ### DEBUG ### WalkSpeedOverweightLimits are now ${globalsStamina.WalkSpeedOverweightLimits.x}kg and ${globalsStamina.WalkSpeedOverweightLimits.y}kg.\n`, LogTextColor.YELLOW);
        }

        //Hideout Production and Area Build Timers - WIP
        //Area Instant Build Timers
        hideoutZones.forEach(zone => {
            Object.keys(zone.stages).forEach(stageKey => {
                zone.stages[stageKey].constructionTime = Math.floor(Math.random() * (45 - 15 + 1)) + 15; // constructionTime randomized between 15 and 45 seconds
            });
        });

        //Area Production Timers
        hideoutProds.forEach(zone => {
            if (zone._id === "5d5c205bd582a50d042a3c0e") {
                zone.productionTime = Math.floor(Math.random() * (27900 - 18900 + 1)) + 18900; // Bitcoin productionTime randomized between 5.25 and 7.75 hours
            } else 
                zone.productionTime = Math.floor(Math.random() * (60 - 15 + 1)) + 15; // productionTime randomized between 15 and 60 seconds
        });

        //ScavCase Production Timers
        hideoutScavs.forEach(zone => {
            zone.ProductionTime = Math.floor(Math.random() * (360 - 150 + 1)) + 150;
        });

        // Remove FIR requirements from quests
        for (const questId in quests) {
            const questConditions = quests[questId].conditions.AvailableForFinish;

            for (const condition of questConditions) {
                if (condition.onlyFoundInRaid !== undefined) {
                    condition.onlyFoundInRaid = false;
                }
            }
        }

        // remove items BlockFolding property
        for (const itemID in items)
        {
            const item = items[itemID];
            if (item._props.BlocksFolding)
                item._props.BlocksFolding = false
        }

        //Allow SMGs to be holstered in Pistol Slot
        const defaultInventory = database.templates.items["55d7217a4bdc2d86028b456d"];
        defaultInventory._props.Slots[2]._props.filters[0].Filter = ["5447b5cf4bdc2d65278b4567", "5447b5e04bdc2d62278b4567"]

        // Loop over the MONEY array and update the StackMaxSize values
        currencies.sort((a, b) => a._props.ShortName.localeCompare(b._props.ShortName)); // DEBUG STATEMENT - Sort by name alphabetically
        currencies.forEach((currency) => {
            const moneyName = currency._props.ShortName
            
            if (currency?._props.StackMaxSize) {
                currency._props.StackMaxSize *= 2
            }

            if (this.debug) {
                this.logger.success(`[${this.modName}]: $$$ CURRENCY $$$ ${moneyName} stack size set to ${currency._props.StackMaxSize}.`)
            }
        });

        // Loop over the AMMO array and update the StackMaxSize and DurabilityBurnModificator values
        ammunition.sort((a, b) => a._name.localeCompare(b._name)); // DEBUG STATEMENT - Sort by name alphabetically
        ammunition.forEach((ammo) => {
            const ammoName = ammo._name.replace(/^patron_|_/g, match => match === "patron_" ? "" : " ");
            if (ammo?._parent === "5485a8684bdc2da71d8b4567" && ammo?._props.ShortName !== "Shrapnel" && !(ammo?._props.Caliber === "Caliber127x108" || ammo?._props.Caliber === "Caliber40x46")) {    
                ammo._props.StackMaxSize *= 5 // Set desired stack size
                ammo._props.DurabilityBurnModificator = 1; // Remove durability damage
            }

            if (this.debug) {
                this.logger.logWithColor(`[${this.modName}]: :::AMMUNITION::: ${ammoName} matches filter.`, LogTextColor.MAGENTA); // DEBUG STATEMENT - Log the matching ammo object(s)
                this.logger.logWithColor(`[${this.modName}]: :::AMMUNITION::: ${ammoName} now has a StackMaxSize of ${ammo._props.StackMaxSize}.`, LogTextColor.CYAN)
                this.logger.logWithColor(`[${this.modName}]: :::AMMUNITION::: ${ammoName} now has a DurabilityBurnModificator value of ${ammo._props.DurabilityBurnModificator}.`, LogTextColor.CYAN)
            }
        });

        const excludedIds = ["5c0a794586f77461c458f892", "64f6f4c5911bcdfe8b03b0dc"];
        for (const item of items) {
            if (item._parent === "5448bf274bdc2dfc2f8b456a") { // Check if the item's _parent matches the parentId
                if (!excludedIds.includes(item._id)) { // Check if the item's _id is not in the excluded list
                    item._props.Grids[0]._props.filters = []; // Set the filter to an empty array

                    if (this.debug) {
                        this.logger.logWithColor(`[${this.modName}]: Item filters removed for secure container: ${item._name}.`, LogTextColor.YELLOW);
                    }
                }
            }
        }

        //Remove all armor, armor vest, helmet, and any other gear with movement or speed penalty
        for (const i in items) {
            const item = items[i]._props

            if (items[i]._parent === "5a341c4686f77469e155819e" || items[i]._parent === "5a341c4086f77401f2541505" || // _parent is 'FaceCover' and 'Headwear', respectively. --57bef4c42459772e8d35a53b, 57bef4c42459772e8d35a53b
                items[i]._parent === "5448e5284bdc2dcb718b4567" || items[i]._parent === "5448e54d4bdc2dcc718b4568" || // _parent is 'Chest rig' and 'Armor', respectively. --566168634bdc2d144c8b456c, 57bef4c42459772e8d35a53b
                items[i]._parent === "57bef4c42459772e8d35a53b" || items[i]._parent === "644120aa86ffbe10ee032b6f") { // _parent is 'Armored equipment' and 'Armor plate', respectively. --543be5f84bdc2dd4348b456a, 57bef4c42459772e8d35a53b
                item.mousePenalty = 0
                item.speedPenaltyPercent = 0
                item.weaponErgonomicPenalty = 0
            }
        }
    }
}

module.exports = { mod: new CreatureComforts() }