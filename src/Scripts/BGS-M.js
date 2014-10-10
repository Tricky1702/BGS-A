/*jslint bitwise: true, continue: true, es5: true, newcap: true, nomen: true, regexp: true, sloppy: false,
unparam: true, todo: true, white: true, indent: 4, maxerr: 50, maxlen: 120 */
/*jshint boss: true, curly: true, eqeqeq: true, eqnull: true, es5: true, evil: true, forin: true, laxbreak: true,
loopfunc: true, noarg: true, noempty: true, strict: true, nonew: true, undef: true */
/*global JSON, Sound, SoundSource, Timer, Vector3D, addFrameCallback, clock, galaxyNumber, guiScreen, log, mission,
oolite, player, removeFrameCallback, setScreenBackground, setScreenOverlay, system, worldScripts */

/* BGS-M
 *
 * Copyright $COPYRIGHT$
 *
 * This work is licensed under the Creative Commons License
 * $LICENSE_FULL$ ($LICENSE$)
 *
 * To view a copy of this license, visit
 * $LICENSE_URL$ or send an email
 * to info@creativecommons.org
 *
 * World script to setup BGS-M.
 */

(function () {
    "use strict";

    this.author = "P.A.Groove, Phantor Gorth, Thargoid, Svengali and Tricky";
    this.copyright = "$COPYRIGHT$";
    this.description = "Ambient sounds, music and images framework.";
    this.license = "$LICENSE$";
    this.name = "BGS-M";
    this.version = "$VERSION$";

    /* Ambient sounds (crowd layer + engine mumble). Default true. */
    this.ambientSounds = true;
    /* Max pause for chatter in seconds. Default 24. */
    this.bgsChatterPause = 24;
    /* Offset for countdown timer. Default 0. */
    this.bgsCountOffset = 0;
    this.bgsCountOffsetS = 0;
    /* Delay in ms between mission screens. Default 600. */
    this.bgsDelay = 600;
    this.bgsDelayS = 6;
    /* Disables radio chatter when in aegis. Default false. */
    this.bgsDisableChatter = false;
    /* Disables crowd noise. Default false. */
    this.bgsDisableCrowd = false;
    /* Disables spoken jumpcountdown. Default false. */
    this.bgsDisableJump = false;
    /* Effect docking/landing. Default true. */
    this.bgsDockingFX = true;
    /* Hyperjump effect. If no shader support available or shaders disabled defaults to false, otherwse true. */
    this.bgsHyperFX = true;
    this.bgsHyperShader = "bgs_hyper";
    /* Wormhole exit point effect. Default true. */
    this.bgsHyperFXWormhole = true;
    /* true in BGS-A, false in BGS-M. Set to true in BGS-I */
    this.bgsImageSwitch = true;
    /* Dampening for Joystick deadzone jitter. Default 0. */
    this.bgsJitterRemove = 0;
    this.bgsJitterRemoveS = 0;
    /* Disables BGS functions (all when docked, chatter when inflight). Scripts are responsible to reset it. */
    this.bgsOff = false;
    /* QMine monkeypatch. Only processed on startUp. Default false. */
    this.bgsQPatch = false;
    /* Gets true if inserted maps are available */
    this.bgsX = false;
    this.EIntA = 0x130;
    /* Fx sounds (screen based sounds and engine up/down). Default true. */
    this.fxSounds = true;
    /* Logging. Default false. */
    this.logging = false;
    /* Music in stations. Default true. */
    this.stationMusic = true;
    this.bgsI = {
        status : "bgs-i_statusdocked.png",
        noCrowd : "bgs-i_statusdocked_nocrowd.png",
        lrc : "bgs-i_longrangechart.png"
    };

    /* World script event handlers. */

    /**
     * We only need to do this once.
     * This will get redefined after a new game or loading of a new Commander.
     */
    this.startUp = function () {
        var ccf = worldScripts.Cabal_Common_Functions,
        check,
        alllrc,
        i;

        delete this.startUp; // as per PhantorGorth approach.

        this.bgsDeadMan = true;

        if (!ccf || ccf.Cabal_Common === 'undefined') {
            this.killSelf(" -> Cabal_Common_Library is missing");

            return;
        }

        this.helper = new ccf.Cabal_Common();

        if (this.helper.internalVersion < 15) {
            this.killSelf(" -> Cabal_Common_Library is too old");

            return;
        }

        this.Collision2D = new ccf.Cabal_Common_2DCollision();

        if (oolite.gameSettings.shaderEffectsLevel === 'SHADERS_OFF' ||
            oolite.gameSettings.shaderEffectsLevel === 'SHADERS_NOT_SUPPORTED') {
            this.bgsHyperFX = false;
            this.bgsDockingFX = false;
        }

        this.bgsExGUIs = ['GUI_SCREEN_INTRO1', 'GUI_SCREEN_INTRO2', 'GUI_SCREEN_MISSION', 'GUI_SCREEN_REPORT'];
        this.chatterPool = ["[bgs_fxChatter0]", "[bgs_fxChatter1]", "[bgs_fxChatter2]", "[bgs_fxChatter3]",
            "[bgs_fxChatter4]", "[bgs_fxChatter5]", "[bgs_fxChatter6]", "[bgs_fxChatter7]",
            "[bgs_fxChatter8]", "[bgs_fxChatter9]", "[bgs_fxChatterA]", "[bgs_fxChatterB]",
            "[bgs_fxChatterC]", "[bgs_fxChatterD]", "[bgs_fxChatterE]", "[bgs_fxChatterF]",
            "[bgs_fxChatterG]", "[bgs_fxChatterH]", "[bgs_fxChatterI]", "[bgs_fxChatterJ]",
            "[bgs_fxChatterK]", "[bgs_fxChatterL]", "[bgs_fxChatterM]", "[bgs_fxChatterN]",
            "[bgs_fxChatterO]", "[bgs_fxChatterP]", "[bgs_fxChatterQ]", "[bgs_fxChatterR]",
            "[bgs_fxChatterS]", "[bgs_fxChatterT]", "[bgs_fxChatterU]", "[bgs_fxChatterV]"];
        this.bgsSoundPool = [{
                start : "LAUNCH",
                type : "speed",
                init : 1,
                muteOn : 0,
                change : 0,
                src : 1,
                sound : "[bgs_ambiEngine]",
                cmp : 0
            }, {
                start : "LAUNCH",
                type : "speed",
                init : 0,
                muteOn : "STATUS_EXITING_WITCHSPACE",
                change : 1,
                src : 2,
                sound : "[bgs_fxEngineUp]",
                cmp : 0
            }, {
                start : "LAUNCH",
                type : "speed",
                init : 0,
                muteOn : -1,
                change : -1,
                src : 2,
                sound : "[bgs_fxEngineDown]",
                cmp : 0
            }, {
                start : "LAUNCH",
                type : "withinStationAegis",
                init : 1,
                muteOn : false,
                change : 0,
                src : 3,
                sound : [],
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : 1,
                muteOn : "STATUS_INFLIGHT",
                change : 0,
                src : 1,
                sound : "[bgs_ambiStation]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_EQUIP_SHIP",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[bgs_fxEquip]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_SHIPYARD",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[bgs_fxShipyard]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_STATUS",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[bgs_fxStatus]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_MANIFEST",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[bgs_fxManifest]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_SYSTEM_DATA",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[bgs_fxSystemData]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_MARKET",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[bgs_fxMarket]",
                cmp : 0
            }, {
                start : "DOCK",
                type : "status",
                init : "GUI_SCREEN_INTERFACES",
                muteOn : "STATUS_INFLIGHT",
                change : -1,
                src : 2,
                sound : "[menu-navigation-not]",
                cmp : 0
            }, {
                start : "WITCH",
                type : "status",
                init : 1,
                muteOn : "STATUS_EXITING_WITCHSPACE",
                change : 0,
                src : 1,
                sound : "[bgs_ambiWitch]",
                cmp : 0
            }, {
                start : "WITCH",
                type : "status",
                init : 1,
                muteOn : -1,
                change : 2,
                src : 2,
                sound : "[bgs_fxWitch]",
                cmp : 0
            }
        ];
        this.bgsWitchPool = [{
                type : 0,
                sound : "[bgs_fxCount0]"
            }, {
                type : 1,
                sound : "[bgs_fxCount1]"
            }, {
                type : 2,
                sound : "[bgs_fxCount2]"
            }, {
                type : 3,
                sound : "[bgs_fxCount3]"
            }, {
                type : 4,
                sound : "[bgs_fxCount4]"
            }, {
                type : 5,
                sound : "[bgs_fxCount5]"
            }, {
                type : 6,
                sound : "[bgs_fxCount6]"
            }, {
                type : 7,
                sound : "[bgs_fxCount7]"
            }, {
                type : 8,
                sound : "[bgs_fxCount8]"
            }, {
                type : 9,
                sound : "[bgs_fxCount9]"
            }, {
                type : 10,
                sound : "[bgs_fxCount10]"
            }, {
                type : 14,
                sound : "[bgs_fxCountG]"
            }, {
                type : 14,
                sound : "[bgs_fxCountH]"
            }
        ];
        this.bgsMusicPool = [{
                start : "DOCK",
                type : "status",
                init : 1,
                muteOn : "STATUS_INFLIGHT",
                change : 0,
                src : 3,
                sound : ["bgs-m_music_station1.ogg", "bgs-m_music_station2.ogg"],
                cmp : 0
            }
        ];
        /* Shader uniform setting #0 galactic jump, #1 Interstellar */
        this.bgsHyperControl = [0, 0, 0];

        if (this.bgsQPatch) {
            this.EIntA |= 8;
            this.oxpcNotifyOnChange(4);
        }

        this.bgsSCA = new SoundSource();
        this.bgsSCB = new SoundSource();
        this.bgsSCC = new SoundSource();
        this.bgsSCWP = new SoundSource();
        this.bgsSCA.loop = true;
        this.bgsSCB.loop = false;
        this.bgsSCC.loop = false;
        this.bgsSCWP.loop = false;
        this.bgsCurrentSet = [];
        this.bgsTimer = new Timer(this, this.doBGSTimer, 0, 0.6);
        this.bgsTimer.stop();
        this.bgsInit = true;
        this.bgsMScreen = false;
        this.bgsNoCrowd = false;
        this.bgsCountOnly = false;
        this.bgsCounter = {
            wp : 0,
            wpType : 0,
            wpSetByOXP : 6,
            chatterScatter : 0,
            hyper : 15
        };

        /* Check countdown sounds and disable if other sounds detected */
        check = Sound.load('[galactic-hyperspace-countdown-begun]');

        if (check && check.name !== 'bgs-m_silence.ogg') {
            this.bgsDisableJump = true;
        }

        check = Sound.load('[hyperspace-countdown-begun]');

        if (check && check.name !== 'bgs-m_silence.ogg') {
            this.bgsDisableJump = true;
        }

        this.fillChatter();
        this.LRC = [[], [], [], [], [], [], [], []];
        this.LRCMapping = true;
        this.LRCAreas = true;
        this.LRCLanes = true;
        this.lastMapPress = 0;
        this.LRCSp = [[], [], [], [], [], [], [], []];
        this.LRCSpLoop = 0;

        alllrc = [{
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 0,
                radi : 0.3,
                action : "LRCMapping",
                txt : "Advanced mapping:"
            }, {
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 17.72,
                radi : 0.3,
                action : "LRCAreas",
                txt : "Areas:"
            }, {
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 22.592,
                radi : 0.3,
                action : "LRCLanes",
                txt : "Spacelanes:"
            }, {
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 27.472,
                radi : 0.3,
                action : "LRCSpecial",
                txt : "",
                ov : "1"
            }, {
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 32.74,
                radi : 0.3,
                action : "LRCSpecial",
                txt : "",
                ov : "2"
            }, {
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 37.672,
                radi : 0.3,
                action : "LRCSpecial",
                txt : "",
                ov : "3"
            }, {
                id : 0,
                type : 1,
                posx : 102.4,
                posy : 42.856,
                radi : 0.3,
                action : "LRCSpecial",
                txt : "",
                ov : "4"
            }
        ];

        for (i = 0; i < alllrc.length; i += 1) {
            this.addToLRC(alllrc[i]);
        }

        this.exSettings = new Timer(this, this.setExternalSettings, 1);
        //	this.testov = "G8.png"; // Define overlay while testing.
        //	this.testPos = [];
        //	this.testTime = 0;
        //	this.testPosB = null;
        delete this.killSelf;
    };

    /**
     * Called when the player’s alert status (player.alertCondition) changes.
     * Only the player and stations have an alert condition. (world script and station scripts)
     */
    this.alertConditionChanged = function () {
        if (this.bgsDeadMan && this.bgsInit && player.ship.docked) {
            if (guiScreen !== 'GUI_SCREEN_LOAD' && this.bgsExGUIs.indexOf(guiScreen) === -1) {
                if (this.bgsImageSwitch) {
                    setScreenBackground(this.bgsI.status);
                }

                this.guiScreenChanged('GUI_SCREEN_STATUS', 'GUI_SCREEN_INTRO1');
            }
        }

        delete this.alertConditionChanged;
    };

    /**
     * Called when the guiScreen changes.
     *
     * Note that the screen can have changed again in the meantime by the action of other oxps.
     * Therefore, it will generally better to test for the global guiScreen to see which page is really on display
     * instead of using the "to" parameter. (world script only)
     *
     * This handler will not fire for every screen the player can switch to, but only when switching to any of the
     * following screens:
     *
     * GUI_SCREEN_MAIN, GUI_SCREEN_STATUS, GUI_SCREEN_MANIFEST, GUI_SCREEN_SYSTEM_DATA, GUI_SCREEN_OPTIONS,
     * GUI_SCREEN_EQUIP_SHIP, GUI_SCREEN_SHIPYARD, GUI_SCREEN_SHORT_RANGE_CHART, GUI_SCREEN_LONG_RANGE_CHART,
     * GUI_SCREEN_MARKET, GUI_SCREEN_REPORT, GUI_SCREEN_INTERFACES
     *
     * @param to
     *              the screen which it initially switched to
     * @param from
     *              the screen it is changing from
     */
    this.guiScreenChanged = function (to, from) {
        var ax,
        //ay,
        i,
        curG,
        id;

        if (this.testov) {
            if (this.testPos.length) {
                ax = [];
                //ay = [];

                for (i = 0; i < this.testPos.length; i += 1) {
                    //ax.push(this.testPos[i].x.toFixed(3)); ay.push(this.testPos[i].y.toFixed(3)); // area
                    ax.push([this.testPos[i].x.toFixed(3), this.testPos[i].y.toFixed(3)]); // lane
                }

                log("POS x", ax); //log("POS y", ay);
                this.testPos = [];
            }
        }

        if (this.bgsX && player.ship.isValid && guiScreen === 'GUI_SCREEN_LONG_RANGE_CHART') {
            if (player.ship.equipmentStatus('EQ_ADVANCED_NAVIGATIONAL_ARRAY') === 'EQUIPMENT_OK') {
                if (this.bgsI.lrc) {
                    setScreenBackground(this.bgsI.lrc);
                }

                if (this.LRCResort) {
                    this.sortLRCMaps();
                }

                curG = this.LRC[galaxyNumber];

                if ((!curG.length || curG.length < 8) && !this.LRCSp[galaxyNumber].length) {
                    if (curG.length < 8) {
                        this.LRCInfo(0, "Advanced mapping off. No infos available.", 0);
                    }

                    if (this.testov) {
                        setScreenOverlay(this.testov);
                    }
                } else {
                    this.LRCOV = null;
                    this.LRCSpLoop = 0;
                    this.xLRC = addFrameCallback(this.doBGSChartsTimer.bind(this));
                }
            }
        } else if (this.xLRC) {
            this.cleanXLRC();
        }

        if (!player.ship.docked) {
            return;
        }

        delete this.bgsDeadMan;

        if (this.bgsExGUIs.indexOf(to) !== -1) {
            if (guiScreen === "GUI_SCREEN_MISSION" && mission.screenID) {
                id = mission.screenID.split("-");

                if (id.length === 4 && id[0] === "oolite") {
                    switch (id[3]) {
                    case "summary":
                        this.chPlay({
                            src : 2,
                            sound : "bgs-m_fx_interface_select.ogg"
                        }, 1);

                        break;
                    case "details":
                        this.chPlay({
                            src : 2,
                            sound : "bgs-m_fx_interface_map.ogg"
                        }, 1);

                        break;
                    case "none":
                        this.chPlay({
                            src : 2,
                            sound : "bgs-m_fx_interface_none.ogg"
                        }, 1);

                        break;
                    }
                }
            }

            this.bgsSCA.stop();

            return;
        }

        if (to === 'GUI_SCREEN_INTERFACES' || from === 'GUI_SCREEN_MISSION' || from === 'GUI_SCREEN_REPORT') {
            if (this.bgsMScreen && !this.bgsInit) {
                this.restartDelay = (new Date()).getTime();
                this.bgsInit = true;

                if (this.logging) {
                    log(this.name, this.name + ': Init restart-delay.');
                }
            }
        }

        if (!this.ambientSounds) {
            this.bgsSCA.stop();
        }

        if (!this.fxSounds) {
            this.bgsSCB.stop();
        }

        if (this.bgsInit && !this.bgsOff && to !== 'GUI_SCREEN_MISSION') {
            this.reinit();
        }

        if (this.bgsImageSwitch) {
            if ((this.bgsDisableCrowd || this.bgsNoCrowd) && to === 'GUI_SCREEN_STATUS') {
                setScreenBackground(this.bgsI.noCrowd);
            }
        }
    };

    /**
     * Called when the user cancels a witchspace or galactic witchspace jump countdown.
     */
    this.playerCancelledJumpCountdown = this.playerJumpFailed = this.playerStartedAutoPilot = function () {
        if (this.bgsWPTimer) {
            this.bgsWPTimer.stop();
            delete this.bgsWPTimer;
        }

        this.bgsSCWP.stop();
        this.bgsOff = false;
        this.bgsSoundPool[3].init = 1;
        this.bgsSCA.stop();
        this.bgsCurrentSet = this.selectFromPool("LAUNCH");
        this.bgsTimer.start();
        this.bgsMusic = null;
    };

    /**
     * Called as a witchspace jump concludes. When it is called, the player is (from a program perspective) in the
     * destination system, but the tunnel effect has not yet been shown. Use this event to set up elements which need to
     * be present in-system after the player exits witchspace.
     */
    this.shipWillExitWitchspace = function () {
        if (!this.bgsHyperFX || player.ship.docked) {
            return;
        }

        system.breakPattern = false;

        var a = worldScripts.Cabal_Common_Overlay.ovAdd({
                cclov_type : 2,
                cclov_blend : 8,
                cclov_id : "BGSHYPER",
                cclov_fx : this.bgsHyperShader,
                cclov_autoremove : 1
            });

        if (a) {
            if (system.isInterstellarSpace) {
                this.bgsHyperControl[1] = 1;
            } else {
                this.bgsHyperControl[1] = 0;
            }

            this.bgsHyperControl[2] = oolite.gameSettings.gameWindow.width / oolite.gameSettings.gameWindow.height;
            a.shaderVector2 = this.bgsHyperControl;
        }
    };

    /**
     * Called after a witchspace jump has concluded and the tunnel effect has been shown.
     */
    this.shipExitedWitchspace = function () {
        this.bgsSCA.stop();
        this.bgsCurrentSet = this.selectFromPool("LAUNCH");
        this.bgsTimer.start();
        this.bgsMusic = null;

        if (this.bgsWPTimer) {
            this.bgsWPTimer.stop();
            delete this.bgsWPTimer;
        }

        this.bgsHyperControl = [0, 0, 0];

        if (!this.bgsHyperFX || player.ship.docked) {
            return;
        }

        if (this.bgsHyperFXWormhole) {
            if (system.isInterstellarSpace) {
                system.addVisualEffect("bgs_exitWormhole_misjump",
                    player.ship.position.subtract(player.ship.vectorForward.multiply(200)));
            } else {
                system.addVisualEffect("bgs_exitWormhole_effect",
                    player.ship.position.subtract(player.ship.vectorForward.multiply(200)));
            }
        }
    };

    /**
     * Called immediately before a witchspace jump, while the player is still in the starting system.
     */
    this.shipWillEnterWitchspace = function () {
        if (this.xLRC) {
            this.cleanXLRC();
        }

        this.bgsSCC.stop();
    };

    /**
     * Called at the beginning of the docking tunnel effect.
     *
     * @param station
     *              entity of the station
     */
    this.shipWillDockWithStation = function (station) {
        if (this.xLRC) {
            this.cleanXLRC();
        }

        this.bgsSCC.stop();

        if (this.bgsDockingFX) {
            this.setShaderTextures(station, 1);
        }
    };

    /**
     * Called at the end of the docking tunnel effect.
     */
    this.shipDockedWithStation = function () {
        this.bgsSCA.stop();
        this.bgsSCC.stop();

        if (this.bgsWPTimer) {
            this.bgsWPTimer.stop();
            delete this.bgsWPTimer;
        }

        this.bgsSCWP.stop();
        this.bgsCurrentSet = this.selectFromPool("DOCK");
        this.bgsTimer.start();
    };

    /**
     * Called at the beginning of the launch tunnel effect.
     */
    this.shipWillLaunchFromStation = function (station) {
        if (this.bgsDockingFX) {
            this.setShaderTextures(station, 0);
        }

        this.bgsOff = false;
        this.bgsSoundPool[3].init = 1;
        this.bgsSCA.stop();
        this.bgsSCB.stop();
        this.bgsSCC.stop();
        this.bgsCurrentSet = this.selectFromPool("LAUNCH");
        this.bgsTimer.start();
        this.bgsMusic = null;
        this.bgsHyperControl = [0, 0, 0];
        this.bgsMScreen = false;
    };

    /**
     * Called when the user starts a witchspace or galactic witchspace jump countdown.
     *
     * @param type
     *              type of jump occurring - 'standard' or 'galactic'
     * @param duration
     *              length of jump countdown in seconds
     */
    this.playerStartedJumpCountdown = function (type, duration) {
        this.bgsSCA.stop();
        this.bgsCurrentSet = this.selectFromPool("WITCH");
        this.bgsTimer.start();

        switch (type) {
        case "standard":
            this.bgsHyperControl[0] = 0;
            break;
        case "galactic":
            this.bgsHyperControl[0] = 1;
            break;
        }

        if (duration < 1 || this.bgsDisableJump) {
            return;
        }

        this.bgsCounter.wp = duration;
        this.bgsCounter.wpType = (type === "standard" ? 0 : 1);
        this.bgsCounter.hyper = duration;

        if (!this.bgsWPTimer) {
            this.bgsWPTimer = new Timer(this, this.doBGSWPTimer, 0, 1);

            if (this.bgsCountOffset) {
                this.bgsWPTimer.stop();
                this.bgsWPTimer.nextTime = clock.absoluteSeconds + this.bgsCountOffset;
                this.bgsWPTimer.start();
            }
        } else {
            this.bgsWPTimer.start();
        }
    };

    /**
     * Called when the player enters the aegis of the main-station (2x scanner range from main-station).
     * Other stations other than the main-station don't give aegis messages.
     */
    this.shipEnteredStationAegis = function () {
        this.fillChatter();
        this.bgsSoundPool[3].init = 1;
    };

    /**
     * Called when the player dies.
     */
    this.shipDied = function () {
        if (this.bgsWPTimer) {
            this.bgsWPTimer.stop();
            delete this.bgsWPTimer;
        }

        this.bgsTimer.stop();
        this.bgsSCWP.stop();
        this.bgsSCA.stop();
        this.bgsSCB.stop();
        this.bgsSCC.stop();

        if (this.xLRC) {
            this.cleanXLRC();
        }
    };

    /**
     * Called when the player bails out.
     * This will be followed by a shipWillDockWithStation()/shipDockedWithStation() pair after a few seconds.
     */
    this.shipLaunchedEscapePod = function () {
        if (this.bgsSCWP) {
            this.bgsSCWP.stop();
        }
    };

    /**
     * Called just before shipWillExitWitchspace.
     *
     * The sequence of events for a player jumping to a different galaxy is as follows:
     *
     * shipWillEnterWitchspace (world event)
     * playerWillEnterWitchspace (NPC ship event)
     * playerEnteredNewGalaxy (world event)
     * shipWillExitWitchspace (world event)
     * shipExitedWitchspace (world event)
     */
    this.playerEnteredNewGalaxy = function () {
        this.LRCSpLoop = 0;
        this.LRCResort = true;
    };

    /* Other global functions. */

    /**
     * OXPConfig settings.
     */
    this.oxpcSettings = {
        Info : {
            Name : "BGS-M",
            Display : "BGS",
            EarlyCall : true,
            EarlySet : true,
            Notify : true,
            InfoB : "1 - Internal logging.\n" +
            "2 - Music when docked.\n" +
            "3 - Ambient sounds (crowd and engine mumble).\n" +
            "4 - Screen specific sounds and engine up/down.",
            InfoS : "1 - Delay in milliseconds before restart after mission screen.\n" +
            "2 - Dampening jitter for joystick users. Use with care as it reduces responsivness.\n" +
            "3 - Offset for countdown timer. It can help to 'correct' the countdown.",
            InfoE : "Crowd sounds, spoken jumpcountdown, chatter, Q-Mine sound, " +
            "Hyperjump+Wormhole exit sequences via shader, longer pauses for chatter, " +
            "reduced jump shader in case your machine can't handle it and the docking sequence."
        },
        Bool0 : {
            Name : "logging",
            Def : false,
            Desc : "Logging functions."
        },
        Bool1 : {
            Name : "stationMusic",
            Def : true,
            Desc : "Music when docked."
        },
        Bool2 : {
            Name : "ambientSounds",
            Def : true,
            Desc : "Ambient sound layer."
        },
        Bool3 : {
            Name : "fxSounds",
            Def : true,
            Desc : "FX sound layer."
        },
        SInt0 : {
            Name : "bgsDelayS",
            Def : 0x6,
            Max : 0xf,
            Desc : "Delay in ms x 100"
        },
        SInt1 : {
            Name : "bgsJitterRemoveS",
            Def : 0x0,
            Max : 0xff,
            Desc : "Threshold / 2500"
        },
        SInt2 : {
            Name : "bgsCountOffsetS",
            Def : 0x0,
            Max : 0xf,
            Desc : "Offset ms x 50"
        },
        EInt0 : {
            Name : "EIntA",
            Def : 0x130,
            Max : 0x1ff,
            Desc : ["Disable crowd", "Disable Countdown", "Disable Chatter", "QMine sound",
                "Hyperjump", "Wormholeexit", "LongChatter", "ReduxShader",
                "DockingFX"]
        }
    };

    /**
     * Called by OXPConfig when settings are changed.
     */
    this.oxpcNotifyOnChange = function (n) {
        if ((n & 2)) {
            this.bgsDelay = this.bgsDelayS * 100;
            this.bgsCountOffset = this.bgsCountOffsetS * 0.05;
            this.bgsJitterRemove = this.bgsJitterRemoveS * 0.0004;
        }

        if ((n & 4)) {
            if ((this.EIntA & 1)) {
                this.bgsDisableCrowd = true;
            } else {
                this.bgsDisableCrowd = false;
            }

            if ((this.EIntA & 2)) {
                this.bgsDisableJump = true;
            } else {
                this.bgsDisableJump = false;
            }

            if ((this.EIntA & 4)) {
                this.bgsDisableChatter = true;
            } else {
                this.bgsDisableChatter = false;
            }

            if ((this.EIntA & 8)) {
                this.bgsQPatch = true;
                this.shipSpawned = function (ship) {
                    if (ship.isValid &&
                        ship.isMine &&
                        ship.AI === "timebombAI.plist" &&
                        ship.name === "Quirium Cascade Mine" &&
                        ship.script.name === "oolite-default-ship-script") {

                        if (ship.script.shipDied) {
                            ship.script.bgsShipDied = ship.script.shipDied;
                        }

                        ship.script.shipDied = function (whom, why) {
                            if (ship.script.bgsShipDied) {
                                ship.script.bgsShipDied(whom, why);
                            }

                            if (!player.ship.isValid || ship.position.distanceTo(player.ship.position) > 25600) {
                                return;
                            }

                            if (why && why === "cascade weapon") {
                                var a = new SoundSource();
                                a.sound = "[bgs_fxQMine]";
                                a.play();
                            }
                        };
                    }
                };
            } else {
                this.bgsQPatch = false;
                delete this.shipSpawned;
            }

            if ((this.EIntA & 16)) {
                this.bgsHyperFX = true;
            } else {
                this.bgsHyperFX = false;
            }

            if ((this.EIntA & 32)) {
                this.bgsHyperFXWormhole = true;
            } else {
                this.bgsHyperFXWormhole = false;
            }

            if ((this.EIntA & 64)) {
                this.bgsChatterPause = 130;
            } else {
                this.bgsChatterPause = 24;
            }

            if ((this.EIntA & 128)) {
                this.bgsHyperShader = "bgs_hyper_redux";
            } else {
                this.bgsHyperShader = "bgs_hyper";
            }

            if ((this.EIntA & 256)) {
                this.bgsDockingFX = true;
            } else {
                this.bgsDockingFX = false;
            }
        }

        return;
    };

    /**
     * @param desc
     */
    this.killSelf = function (desc) {
        var prop;

        if (desc !== null) {
            player.consoleMessage(this.name + " - Check your Latest.log.", 10);
            log(this.name, this.name + " - Shutting down." + desc);
        }

        for (prop in this) {
            if (this.hasOwnProperty(prop)) {
                if (prop !== 'name' && prop !== 'version') {
                    delete this[prop];
                }
            }
        }

        this.deactivated = true;

        return;
    };

    /**
     *
     */
    this.setExternalSettings = function () {
        if (this.bgsImageSwitch) {
            if (!worldScripts["oolite-contracts-cargo"].$cargoSummaryPageBackground) {
                worldScripts["oolite-contracts-cargo"]
                .$cargoSummaryPageBackground = "bgs-i_interface_cargo1.png";
            }

            if (!worldScripts["oolite-contracts-parcels"].$parcelSummaryPageBackground) {
                worldScripts["oolite-contracts-parcels"]
                .$parcelSummaryPageBackground = "bgs-i_interface_parcel1.png";
            }

            if (!worldScripts["oolite-contracts-passengers"].$passengerSummaryPageBackground) {
                worldScripts["oolite-contracts-passengers"]
                .$passengerSummaryPageBackground = "bgs-i_interface_passenger1.png";
            }
        }

        this.exSettings.stop();
        delete this.exSettings;
        delete this.setExternalSettings;

        return;
    };

    /**
     * Inserts a overlay for the special keys. Make sure that the object is extensible and not sealed or frozen.
     *
     * @param obj
     *              object with the following properties:
     *
     *              gal
     *                  Number. Required. Galaxy number in range 0...7
     *              ov
     *                  String. Required. Filename for the overlay with extension.
     *              txt
     *                  String. Required. Text to be displayed.
     *              check
     *                  String. Optional. worldScript name to be checked.
     * @return true on success
     */
    this.addToLRCSpecial = function (obj) {
        if (!obj ||
            typeof obj.ov !== 'string' ||
            typeof obj.gal !== 'number' ||
            typeof obj.txt !== 'string') {
            return false;
        }

        this.LRCSp[obj.gal].push(obj);
        this.bgsX = true;

        return true;
    };

    /**
     * Inserts a overlay as route or region. 4 different types can be used (circle, rectangle, npoly and route). BGS
     * creates a bounding box based on the used type and positions to speed up the processing. Make sure that the object
     * is extensible and not sealed or frozen.
     *
     * Additional properties are required for the different types:
     *
     * Type 1 (Circle):
     *
     * posx
     *      Number. Position of the center. X coordinate in LY.
     * posy
     *      Number. Position of the center. Y coordinate in LY.
     * radi
     *      Number. Radius.
     *
     * Type 2 (Rectangle):
     *
     * posx
     *      Number. Position of the center. X coordinate in LY.
     * posy
     *      Number. Position of the center. Y coordinate in LY.
     * w
     *      Number. Width.
     * h
     *      Number. Height.
     *
     * Type 3 (nPoly):
     *
     * nvert
     *      Number. Number of points.
     * ax
     *      Array. X coordinates in LY.
     * ay
     *      Array. Y coordinates in LY.
     * con
     *      Boolean. Optional. Concave shapes may need to set it.
     *
     * Type 4 (Route):
     *
     * pos
     *      Array. Pairs of coordinates in LY in x,y format, e.g. [[8,34.6],[...]]
     *
     * @param obj
     *              object with the following properties:
     *
     *              type
     *                  Number. Required. Range 1...4
     *              gal
     *                  Number. Required. Galaxy number in range 0...7
     *              disp
     *                  String. Required. String for .findOnLRC
     *              ov
     *                  String. Required. Filename for the overlay with extension.
     * @return true on success
     */
    this.addToLRC = function (obj) {
        var mm,
        ii,
        ij,
        k;

        if (!obj ||
            typeof obj.type !== 'number' ||
            (typeof obj.action !== "string" &&
                (typeof obj.ov !== "string" &&
                    typeof obj.gal !== "number"))) {
            return false;
        }

        switch (obj.type) {
        case 1:
            if (typeof obj.posx !== 'number' ||
                typeof obj.posy !== 'number' ||
                typeof obj.radi !== 'number') {
                return false;
            }

            obj.minmax = [obj.posx - obj.radi, obj.posx + obj.radi, obj.posy - obj.radi, obj.posy + obj.radi];
            break;
        case 2:
            if (typeof obj.posx !== 'number' ||
                typeof obj.posy !== 'number' ||
                typeof obj.w !== 'number' ||
                typeof obj.h !== 'number') {
                return false;
            }

            obj.minmax = [obj.posx - obj.w, obj.posx + obj.w, obj.posy - obj.h, obj.posy + obj.h];
            break;
        case 3:
            if (typeof obj.nvert !== 'number' ||
                typeof obj.ax !== 'object' ||
                typeof obj.ay !== 'object') {
                return false;
            }

            mm = [99, 0, 99, 0];

            for (ii = 0; ii < obj.nvert; ii += 1) {
                if (obj.ax[ii] < mm[0]) {
                    mm[0] = obj.ax[ii];
                }

                if (obj.ax[ii] > mm[1]) {
                    mm[1] = obj.ax[ii];
                }

                if (obj.ay[ii] < mm[2]) {
                    mm[2] = obj.ay[ii];
                }

                if (obj.ay[ii] > mm[3]) {
                    mm[3] = obj.ay[ii];
                }
            }

            obj.minmax = mm;
            break;
        case 4:
            if (typeof obj.pos !== 'object') {
                return false;
            }

            mm = [99, 0, 99, 0];

            for (ij = 0; ij < obj.pos.length; ij += 1) {
                if (obj.pos[ij][0] < mm[0]) {
                    mm[0] = obj.pos[ij][0];
                }

                if (obj.pos[ij][0] > mm[1]) {
                    mm[1] = obj.pos[ij][0];
                }

                if (obj.pos[ij][1] < mm[2]) {
                    mm[2] = obj.pos[ij][1];
                }

                if (obj.pos[ij][1] > mm[3]) {
                    mm[3] = obj.pos[ij][1];
                }
            }

            mm[0] -= 0.2;
            mm[1] += 0.2;
            mm[2] -= 0.2;
            mm[3] += 0.2;
            obj.minmax = mm;
            break;
        default:
            return false;
        }

        if (obj.id === 'undefined') {
            obj.id = obj.type;
        }

        if (typeof obj.action === 'string' && typeof obj.gal !== 'number') {
            for (k = 0; k < 8; k += 1) {
                this.LRC[k].push(obj);
            }
        } else {
            this.LRC[obj.gal].unshift(obj);
        }

        this.LRCResort = true;

        if (obj.id === 'undefined' || obj.id !== 0) {
            this.bgsX = true;
        }

        return true;
    };

    /**
     *
     */
    this.sortLRCMaps = function () {
        this.LRC[galaxyNumber] = this.helper.arrSortByProperty(this.LRC[galaxyNumber], "id");
        delete this.LRCResort;

        return;
    };

    /**
     *
     */
    this.fillChatter = function () {
        var shu;

        if (system.mainStation && system.mainStation.scriptInfo.bgs_chatter) {
            shu = this.helper.arrShuffle(system.mainStation.scriptInfo.bgs_chatter.split("|"));
        } else {
            shu = this.helper.arrShuffle(this.chatterPool);
        }

        this.bgsSoundPool[3].sound = shu;

        if (this.logging) {
            log(this.name, "Chatter: " + shu);
        }

        return;
    };

    /**
     *
     */
    this.cleanXLRC = function () {
        removeFrameCallback(this.xLRC);
        delete this.xLRC;
        this.LRCOV = null;

        return;
    };

    /**
     * @param delta
     */
    this.doBGSChartsTimer = function (delta) {
        if (!player.ship.isValid || !delta) {
            return;
        }

        if (guiScreen === 'GUI_SCREEN_LONG_RANGE_CHART') {
            var pos = player.ship.cursorCoordinatesInLY,
            t,
            c1,
            c2,
            ov,
            curG,
            mySound,
            i,
            r,
            l,
            what;

            pos.x = this.helper.num2Prec(pos.x, 3);
            pos.y = this.helper.num2Prec(pos.y, 3);

            if (this.testov) {
                if (this.testTime &&
                    this.testPosB &&
                    pos.distanceTo(this.testPosB) < 0.01 &&
                    (!this.testPos.length ||
                        pos.distanceTo(this.testPos[this.testPos.length - 1]) > 0.01)) {

                    this.testTime += delta;

                    if (this.testTime > 3) {
                        this.testPos.push(pos);
                        this.testTime = 0;
                        log(this.name, "pos:" + pos + " : " + this.LRC[galaxyNumber].length);
                        mySound = new SoundSource();
                        mySound.sound = "bgs-c_cloak_fail.ogg";
                        mySound.play();
                    }
                } else {
                    this.testTime = 0.1;
                }

                this.testPosB = pos;
            }

            curG = this.LRC[galaxyNumber];

            for (i = 0; i < curG.length; i += 1) {
                t = curG[i];

                if (!this.LRCMapping && t.action === 'undefined') {
                    continue;
                }

                if (!this.Collision2D.boundingBox(t.minmax, pos)) {
                    continue; // Bounding box
                }

                switch (t.type) {
                case 1: // Circle
                    if (!this.LRCAreas && t.action === 'undefined') {
                        continue;
                    }

                    c1 = new Vector3D([t.posx, t.posy, 0]);

                    if (pos.distanceTo(c1) > t.radi) {
                        continue;
                    }

                    ov = true;
                    break;
                case 2: // Rectangle
                    if (!this.LRCAreas) {
                        continue;
                    }

                    c1 = new Vector3D([t.posx, pos.y, 0]);
                    c2 = new Vector3D([pos.x, t.posy, 0]);

                    if (pos.distanceTo(c1) > t.w || pos.distanceTo(c2) > t.h) {
                        continue;
                    }

                    ov = true;
                    break;
                case 3: // Poly
                    if (!this.LRCAreas) {
                        continue;
                    }

                    r = this.Collision2D.pointInPoly(t.nvert, t.ax, t.ay, pos, t.hasOwnProperty("con"));

                    if (!r) {
                        continue;
                    }

                    ov = true;
                    break;
                case 4: // Lane
                    if (!this.LRCLanes) {
                        continue;
                    }

                    for (l = 0; l < t.pos.length; l += 1) {
                        c1 = new Vector3D([t.pos[l][0], t.pos[l][1], 0]);

                        if (l < t.pos.length - 1) {
                            c2 = new Vector3D([t.pos[l + 1][0], t.pos[l + 1][1], 0]);

                            if (!this.Collision2D.pointOnLineB(c1, c2, pos, 0.4)) {
                                continue;
                            }
                        } else if (pos.distanceTo(c1) > 0.4) {
                            continue;
                        }

                        ov = true;

                        /* Stops JSLint's "Strange loop" error. */
                        if (ov) {
                            break;
                        }
                    }

                    break;
                }

                if (ov) {
                    if (typeof t.action === 'string') {
                        if ((clock.absoluteSeconds - this.lastMapPress) > 1) {
                            if (typeof t.ov !== 'string') {
                                this[t.action] = !this[t.action];
                                this.LRCInfo(0, t.txt + this[t.action], 1);
                            } else {
                                switch (t.ov) {
                                case "1":
                                    if (this.LRCSp[galaxyNumber].length) {
                                        this.LRCSpLoop += 3;

                                        if (this.LRCSpLoop >= this.LRCSp[galaxyNumber].length) {
                                            this.LRCSpLoop = 0;
                                        }

                                        what = "Specials: ";

                                        if (this.LRCSp[galaxyNumber].length > this.LRCSpLoop) {
                                            what += this.LRCSp[galaxyNumber][this.LRCSpLoop].txt + " ";
                                        }

                                        if (this.LRCSp[galaxyNumber].length > this.LRCSpLoop + 1) {
                                            what += this.LRCSp[galaxyNumber][this.LRCSpLoop + 1].txt + " ";
                                        }

                                        if (this.LRCSp[galaxyNumber].length > this.LRCSpLoop + 2) {
                                            what += this.LRCSp[galaxyNumber][this.LRCSpLoop + 2].txt + " ";
                                        }

                                        this.LRCInfo(0, what, 1);
                                    } else {
                                        this.LRCInfo(0, "No infos available", 1);
                                    }

                                    break;
                                case "2":
                                    if (this.LRCSp[galaxyNumber].length > this.LRCSpLoop) {
                                        what = this.LRCSp[galaxyNumber][this.LRCSpLoop];
                                        this.LRCInfo(what.ov, what.txt, 1);
                                    } else {
                                        this.LRCInfo(0, "No infos available", 1);
                                    }

                                    break;
                                case "3":
                                    if (this.LRCSp[galaxyNumber].length > this.LRCSpLoop + 1) {
                                        what = this.LRCSp[galaxyNumber][this.LRCSpLoop + 1];
                                        this.LRCInfo(what.ov, what.txt, 1);
                                    } else {
                                        this.LRCInfo(0, "No infos available", 1);
                                    }

                                    break;
                                case "4":
                                    if (this.LRCSp[galaxyNumber].length > this.LRCSpLoop + 2) {
                                        what = this.LRCSp[galaxyNumber][this.LRCSpLoop + 2];
                                        this.LRCInfo(what.ov, what.txt, 1);
                                    } else {
                                        this.LRCInfo(0, "No infos available", 1);
                                    }

                                    break;
                                }
                            }
                        }

                        this.lastMapPress = clock.absoluteSeconds;

                        return;
                    }

                    if (!this.LRCOV || this.LRCOV !== t.ov) {
                        this.LRCOV = t.ov;
                        this.LRCInfo(t.ov, 0, 1);
                    }

                    return;
                }
            }

            if (!ov) {
                if (!this.testov) {
                    if (this.LRCOV) {
                        this.LRCOV = null;
                        setScreenOverlay(null);
                    }
                } else {
                    if (this.LRCOV && this.LRCOV !== this.testov) {
                        this.LRCOV = null;
                        this.LRCInfo(this.testov, 0, 0);
                    }
                }
            }
        }
    };

    /**
     * @param ov
     * @param txt
     * @param snd
     */
    this.LRCInfo = function (ov, txt, snd) {
        if (ov) {
            setScreenOverlay(ov);
        }

        if (txt) {
            player.consoleMessage(txt);
        }

        if (snd) {
            this.bgsSCC.sound = "[@beep]";
            this.bgsSCC.play();
        }

        return;
    };

    /**
     *
     */
    this.reinit = function () {
        var c,
        i;

        if (typeof this.restartDelay === 'number') {
            c = (new Date()).getTime() - this.restartDelay;

            if (c < this.bgsDelay) {
                return;
            }
        }

        this.bgsCurrentSet = this.selectFromPool("DOCK");
        i = this.bgsCurrentSet.length;
        while (i) {
            i -= 1;
            this.bgsCurrentSet[0].cmp = 0;

            if (this.bgsCurrentSet[i].src === 1) {
                this.bgsCurrentSet[i].init = 1;
            }
        }

        this.bgsTimer.start();
        this.bgsInit = false;

        return;
    };

    /**
     * @param cond
     */
    this.selectFromPool = function (cond) {
        var a = [],
        b = this.bgsSoundPool,
        c = false,
        d = this.bgsMusicPool,
        i,
        sound;

        if (cond === "LAUNCH") {
            c = true;
        }

        i = b.length;
        while (i) {
            i -= 1;

            if (cond === b[i].start) {
                if (b[i].src === 1) {
                    b[i].init = 1;

                    if (c) {
                        if (player.ship.script.bgs_engine) {
                            b[i].sound = player.ship.script.bgs_engine;
                        } else if (player.ship.scriptInfo.bgs_engine) {
                            b[i].sound = player.ship.scriptInfo.bgs_engine;
                        }
                    }
                }

                if (c) {
                    if (b[i].change === 1) {
                        if (player.ship.script.bgs_engineUp) {
                            b[i].sound = player.ship.script.bgs_engineUp;
                        } else if (player.ship.scriptInfo.bgs_engineUp) {
                            b[i].sound = player.ship.scriptInfo.bgs_engineUp;
                        }
                    }

                    if (b[i].change === -1) {
                        if (player.ship.script.bgs_engineDown) {
                            b[i].sound = player.ship.script.bgs_engineDown;
                        } else if (player.ship.scriptInfo.bgs_engineDown) {
                            b[i].sound = player.ship.scriptInfo.bgs_engineDown;
                        }
                    }
                }

                b[i].cmp = 0;
                a.push(b[i]);
            }
        }

        if (cond === "DOCK") {
            i = d.length;
            while (i) {
                i -= 1;

                if (cond === d[i].start) {
                    sound = "";

                    if (player.ship.dockedStation.scriptInfo.bgs_music) {
                        sound = player.ship.dockedStation.scriptInfo.bgs_music;
                    } else {
                        sound = d[i].sound;

                        if (typeof d[i].sound === 'object') {
                            sound = d[i].sound[Math.floor(Math.random() * d[i].sound.length)];
                        }
                    }

                    if (!player.ship.dockedStation.scriptInfo.bgs_nomusic) {
                        if (this.stationMusic && guiScreen !== 'GUI_SCREEN_MISSION' && !this.bgsOff) {
                            if (this.bgsMusic && !this.bgsMScreen) {
                                Sound.playMusic(this.bgsMusic, true);
                            } else {
                                if (!this.bgsMScreen) {
                                    Sound.playMusic(sound, true);
                                }

                                this.bgsMusic = sound;
                            }
                        }
                    } else {
                        this.bgsMusic = null;
                    }

                    if (player.ship.dockedStation.scriptInfo.bgs_nocrowd || this.bgsDisableCrowd) {
                        a[1].type = "no";
                        a[4].type = "no";
                        a[7].type = "no";
                        this.bgsNoCrowd = true;
                    } else {
                        a[1].type = "status";
                        a[4].type = "status";
                        a[7].type = "status";
                        this.bgsNoCrowd = false;
                    }
                }
            }
        } else if (cond === "WITCH") {
            if (player.ship.scriptInfo.bgs_countonly) {
                this.bgsCountOnly = true;
            }

            if (this.bgsCountOnly) {
                a[0].sound = "bgs-m_silence.ogg";
            }
        }

        if (this.logging) {
            log(this.name, this.name + ': New set:' + cond + ' containing:' + a.length + ' entries.');
            i = a.length;
            while (i) {
                i -= 1;
                log(this.name, "a[" + i + "]: " + JSON.stringify(a[i]));
            }
        }

        return a;
    };

    /**
     *
     */
    this.doBGSTimer = function () {
        var c,
        i,
        cu,
        a;

        if (player.ship.docked) {
            if (this.bgsExGUIs.indexOf(guiScreen) !== -1 || this.bgsOff) {
                if (this.bgsOff) {
                    if (this.bgsMusic) {
                        Sound.stopMusic(this.bgsMusic);
                    }
                } else if (this.bgsMusic) {
                    if (guiScreen === 'GUI_SCREEN_MISSION') {
                        if (!mission.screenID || mission.screenID.substr(0, 7) !== "oolite-") {
                            Sound.stopMusic(this.bgsMusic);
                        }
                    } else {
                        Sound.stopMusic(this.bgsMusic);
                    }
                }

                if (this.bgsSCA.isPlaying) {
                    this.bgsSCA.stop();

                    return;
                }

                this.bgsMScreen = true;

                if (this.restartDelay) {
                    this.restartDelay = (new Date()).getTime();
                }

                return;
            }

            if (this.bgsMScreen && this.restartDelay) {
                c = (new Date()).getTime() - this.restartDelay;

                if (c > this.bgsDelay) {
                    delete this.restartDelay;
                    this.bgsMScreen = false;
                    this.reinit();
                } else {
                    return;
                }
            }

            // Only necessary as workaround for not stopped soundsources on loading savedgame
            if (guiScreen === 'GUI_SCREEN_LOAD') {
                if (this.bgsSCA.loop) {
                    this.bgsSCA.loop = false;
                    this.bgsSCA.stop();
                }
            } else if (!this.bgsSCA.loop) {
                this.bgsSCA.loop = true;
                this.bgsSCA.play();
            }

            if (!this.stationMusic && this.bgsMusic) {
                Sound.stopMusic(this.bgsMusic);
            }

            if (this.bgsInit) {
                if (!this.bgsOff) {
                    this.reinit();

                    return;
                }
            }
        }

        if (!this.bgsCurrentSet || !this.bgsCurrentSet.length) {
            return;
        }

        i = this.bgsCurrentSet.length;
        while (i) {
            i -= 1;
            a = this.bgsCurrentSet[i].type;

            if (player[a] === 'undefined' && player.ship[a] === 'undefined') {
                continue;
            }

            if (player.ship[a] === 'undefined') {
                cu = player[a];

                if (cu !== this.bgsCurrentSet[i].muteOn) {
                    if (!this.bgsCurrentSet[i].init && this.bgsCurrentSet[i].cmp === cu) {
                        continue;
                    }

                    if (cu && cu !== this.bgsCurrentSet[i].cmp && this.bgsCurrentSet[i].change === 0) {
                        this.chPlay(this.bgsCurrentSet[i], 1);
                    }

                    if (typeof this.bgsCurrentSet[i].init === 'number') {
                        this.bgsCurrentSet[i].init = 0;
                        this.bgsCurrentSet[i].cmp = cu;
                    }
                } else {
                    if (this.bgsCurrentSet[i].init === this.bgsCurrentSet[i].cmp) {
                        continue;
                    }

                    this.chPlay(this.bgsCurrentSet[i]);
                    this.bgsCurrentSet[i].cmp = cu;
                }
            } else {
                cu = player.ship[a];

                if (cu !== this.bgsCurrentSet[i].muteOn) {
                    if (player.ship.docked &&
                        guiScreen === this.bgsCurrentSet[i].init &&
                        guiScreen !== this.bgsCurrentSet[i].cmp) {
                        this.chPlay(this.bgsCurrentSet[i], 1);
                    }

                    if (!this.bgsCurrentSet[i].init && this.bgsCurrentSet[i].cmp === cu) {
                        if (this.bgsCurrentSet[i].src === 3 && !this.bgsSCC.isPlaying) {
                            this.bgsCurrentSet[i].init = 1;
                            this.bgsCurrentSet[i].cmp = 0;
                        }

                        continue;
                    }

                    switch (this.bgsCurrentSet[i].change) {
                    case 1:
                        if (cu > this.bgsCurrentSet[i].cmp + this.bgsJitterRemove) {
                            this.chPlay(this.bgsCurrentSet[i], 1);
                        }

                        break;
                    case -1:
                        if (cu < this.bgsCurrentSet[i].cmp - this.bgsJitterRemove) {
                            this.chPlay(this.bgsCurrentSet[i], 1);
                        }

                        break;
                    case 0:
                        if (cu !== this.bgsCurrentSet[i].cmp) {
                            this.chPlay(this.bgsCurrentSet[i], 1);
                        }

                        break;
                    case 2:
                        if (cu !== this.bgsCurrentSet[i].cmp) {
                            this.chPlay(this.bgsCurrentSet[i], 1);
                        }

                        break;
                    }

                    if (typeof this.bgsCurrentSet[i].init === 'number') {
                        this.bgsCurrentSet[i].init = 0;
                        this.bgsCurrentSet[i].cmp = cu;
                    } else {
                        this.bgsCurrentSet[i].cmp = guiScreen;
                    }
                } else {
                    if (this.bgsCurrentSet[i].muteOn === -1) {
                        continue;
                    }

                    this.bgsCurrentSet[i].cmp = cu;
                    this.chPlay(this.bgsCurrentSet[i]);
                }
            }
        }

        if (!player.ship.withinStationAegis && this.bgsSCC.isPlaying) {
            this.bgsSCC.stop();
        }

        return;
    };

    /**
     *
     */
    this.doBGSWPTimer = function () {
        this.bgsCounter.wp -= 1;

        if (!this.bgsCountOnly && this.bgsCounter.wp > 13 && this.bgsCounter.hyper < this.bgsCounter.wp + 2) {
            if (!this.bgsCounter.wpType) {
                this.bgsSCWP.sound = this.bgsWitchPool[this.bgsWitchPool.length - 1].sound;
            } else {
                this.bgsSCWP.sound = this.bgsWitchPool[this.bgsWitchPool.length - 2].sound;
            }

            if (!this.bgsSCWP.isPlaying) {
                this.bgsSCWP.play();
            }
        } else {
            if (this.bgsCounter.wp < this.bgsCounter.wpSetByOXP && this.bgsCounter.wp > -1) {
                this.bgsSCWP.sound = this.bgsWitchPool[this.bgsCounter.wp].sound;

                if (!this.bgsSCWP.isPlaying) {
                    this.bgsSCWP.play();
                }
            }
        }

        if (!this.bgsHyperFX || !player.ship.isValid) {
            return;
        }

        if (this.bgsCounter.wp === -1) {
            this.bgsSCWP.sound = "[bgs_fxHyper]";
            this.bgsSCWP.play();
        }
    };

    /**
     * @param obj
     * @param mode
     */
    this.chPlay = function (obj, mode) {
        var src = obj.src,
        sound = obj.sound,
        l;

        if (typeof obj.sound === 'object') {
            if (src === 3) {
                if (!obj.sound.length) {
                    this.fillChatter();

                    return;
                }

                sound = obj.sound[0];
            } else {
                sound = obj.sound[Math.floor(Math.random() * obj.sound.length)];
            }
        }

        switch (src) {
        case 3:
            if (this.ambientSounds) {
                if ((!obj.init && !this.bgsSCC.isPlaying) || this.bgsDisableChatter || this.bgsOff) {
                    return;
                }

                if (this.bgsCounter.chatterScatter) {
                    this.bgsCounter.chatterScatter -= 1;
                    return;
                }

                if (player.ship && player.ship.withinStationAegis && (clock.seconds & 1)) {
                    l = 0;

                    if (system.mainStation) {
                        l = system.filteredEntities(this, function (entity) {
                                return (entity.isShip &&
                                    !entity.isPlayer &&
                                    entity.isPiloted &&
                                    !entity.isDerelict &&
                                    !entity.owner);
                            }, system.mainStation, 52000);
                    }

                    this.bgsCounter.chatterScatter =
                        Math.ceil(((Math.random() * this.bgsChatterPause) + 1) / (l.length + 1));
                }

                this.bgsSCC.sound = sound;

                if (mode && player.alertCondition !== 3) {
                    if (!this.bgsSCC.isPlaying) {
                        this.bgsSCC.play();
                        this.bgsSoundPool[3].sound.shift();
                    }
                } else {
                    this.bgsSCC.stop();
                }
            }

            break;
        case 2:
            if (this.fxSounds) {
                this.bgsSCB.sound = sound;

                if (mode && !this.bgsSCB.isPlaying) {
                    this.bgsSCB.play();
                }
            }

            break;
        case 1:
            if (this.ambientSounds) {
                this.bgsSCA.sound = sound;

                if (mode) {
                    if (!this.bgsSCA.isPlaying) {
                        this.bgsSCA.play();
                    }
                } else {
                    this.bgsSCA.stop();
                }
            }

            break;
        }

        return;
    };

    /**
     * @param station
     *              entity of the station
     * @param land
     *              0 - launching, 1 - docking
     */
    this.setShaderTextures = function (station, land) {
        var shs = [0.5, 1, 2, 3, 5],
        sh = 2.5,
        as = 1.0,
        sit = null,
        sis = null,
        s,
        l,
        i,
        bb,
        r,
        ent,
        ta,
        tb;

        if (land) {
            this.bgsSCB.sound = "[bgs_fxEngineDown]";
            this.bgsSCB.play();
        }

        if (!station.isMainStation && !station.scriptInfo) {
            return;
        }

        if (station.scriptInfo) {
            if (station.scriptInfo.bgs_tunnel_off && station.scriptInfo.bgs_tunnel_off === 'true') {
                return;
            }

            if (station.scriptInfo.bgs_tunnel_texture) {
                sit = station.scriptInfo.bgs_tunnel_texture;
            }

            if (station.scriptInfo.bgs_tunnel_shape) {
                sis = parseFloat(station.scriptInfo.bgs_tunnel_shape);
            }
        }

        if (station.isMainStation || sit || sis) {
            if (!sis) {
                s = station.subEntities;
                l = s.length;

                for (i = 0; i < l; i += 1) {
                    if (s[i].isDock) {
                        bb = s[i].boundingBox;

                        if (bb.x >= bb.y) {
                            r = bb.x / bb.y;
                        } else {
                            r = bb.y / bb.x;
                        }

                        sh = shs[this.helper.clamp(Math.floor(r), 4, 0)];

                        break;
                    }
                }
            } else {
                sh = sis;
            }

            if (sh > 1.1) {
                as = (oolite.gameSettings.gameWindow.width / oolite.gameSettings.gameWindow.height) - 0.5;
            } else {
                as = oolite.gameSettings.gameWindow.width / oolite.gameSettings.gameWindow.height;
            }

            ent = system.addVisualEffect("bgs_docking",
                    player.ship.position.add(player.ship.vectorForward.multiply(250)));

            ent.shaderFloat1 = sh;
            ent.shaderFloat2 = as;

            if (!land) {
                ent.shaderInt1 = 1;
            }

            if (sit) {
                ta = ent.getMaterials();
                tb = Object.keys(ta);
                ta[tb[0]].textures[0].name = sit;
                ent.setMaterials(ta);
            }

            station.breakPattern = false;
        }

        return;
    };
}.bind(this)());
