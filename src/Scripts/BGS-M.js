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

"use strict";
this.author = "P.A.Groove, Phantor Gorth, Thargoid, Svengali and Tricky";
this.copyright = "$COPYRIGHT$";
this.description = "Ambient sounds, music and images framework.";
this.license = "$LICENSE$";
this.name = "BGS-M";
this.version = "1.9.2";

this.ambientSounds = true; // Ambient sounds (crowd layer + engine mumble). Default true.
this.bgsChatterPause = 24; // Max pause for chatter in seconds. Default 24.
this.bgsCountOffset = 0; // Offset for countdown timer. Default 0.
this.bgsCountOffsetS = 0;
this.bgsDelay = 600; // Delay in ms between mission screens. Default 600.
this.bgsDelayS = 6;
this.bgsDisableChatter = false; // Disables radio chatter when in aegis. Default false.
this.bgsDisableCrowd = false; // Disables crowd noise. Default false.
this.bgsDisableJump = false; // Disables spoken jumpcountdown. Default false.
this.bgsDockingFX = true; // Effect docking/landing. Default true.
this.bgsHyperFX = true; // Hyperjump effect. If no shader support available or shaders disabled defaults to false, otherwse true.
this.bgsHyperShader = "bgs_hyper";
this.bgsHyperFXWormhole = true; // Wormhole exit point effect. Default true.
this.bgsImageSwitch = true; // true in BGS-A, false in BGS-M. Set to true in BGS-I
this.bgsJitterRemove = 0; // Dampening for Joystick deadzone jitter. Default 0.
this.bgsJitterRemoveS = 0;
this.bgsOff = false; // Disables BGS functions (all when docked, chatter when inflight). Scripts are responsible to reset it.
this.bgsQPatch = false; // QMine monkeypatch. Only processed on startUp. Default false.
this.bgsX = false; // Gets true if inserted maps are available
this.EIntA = 0x130;
this.fxSounds = true; // Fx sounds (screen based sounds and engine up/down). Default true.
this.logging = false; // Logging. Default false.
this.stationMusic = true; // Music in stations. Default true.
this.bgsI = {
	status: "bgs-i_statusdocked.png",
	noCrowd: "bgs-i_statusdocked_nocrowd.png",
	lrc: "bgs-i_longrangechart.png"
};

this.startUp = function()
{
	delete this.startUp; // as per PhantorGorth approach.
	this.bgsDeadMan = true;
	if(!worldScripts.Cabal_Common_Functions || typeof(worldScripts.Cabal_Common_Functions.Cabal_Common)==='undefined'){this.killSelf(" -> Cabal_Common_Library is missing"); return;}
	this.helper = new worldScripts.Cabal_Common_Functions.Cabal_Common();
	if(this.helper.internalVersion<15){this.killSelf(" -> Cabal_Common_Library is too old"); return;}
	this.Collision2D = new worldScripts.Cabal_Common_Functions.Cabal_Common_2DCollision();
	if(oolite.gameSettings.shaderEffectsLevel==='SHADERS_OFF' || oolite.gameSettings.shaderEffectsLevel==='SHADERS_NOT_SUPPORTED'){
		this.bgsHyperFX = false;
		this.bgsDockingFX = false;
	}
	this.bgsExGUIs = ['GUI_SCREEN_INTRO1','GUI_SCREEN_INTRO2','GUI_SCREEN_MISSION','GUI_SCREEN_REPORT'];
	this.chatterPool = ["[bgs_fxChatter0]","[bgs_fxChatter1]","[bgs_fxChatter2]","[bgs_fxChatter3]","[bgs_fxChatter4]","[bgs_fxChatter5]","[bgs_fxChatter6]","[bgs_fxChatter7]",
		"[bgs_fxChatter8]","[bgs_fxChatter9]","[bgs_fxChatterA]","[bgs_fxChatterB]","[bgs_fxChatterC]","[bgs_fxChatterD]","[bgs_fxChatterE]","[bgs_fxChatterF]","[bgs_fxChatterG]",
		"[bgs_fxChatterH]","[bgs_fxChatterI]","[bgs_fxChatterJ]","[bgs_fxChatterK]","[bgs_fxChatterL]","[bgs_fxChatterM]","[bgs_fxChatterN]","[bgs_fxChatterO]","[bgs_fxChatterP]",
		"[bgs_fxChatterQ]","[bgs_fxChatterR]","[bgs_fxChatterS]","[bgs_fxChatterT]","[bgs_fxChatterU]","[bgs_fxChatterV]"];
	this.bgsSoundPool = [
		{start:"LAUNCH",type:"speed",init:1,muteOn:0,change:0,src:1,sound:"[bgs_ambiEngine]",cmp:0},
		{start:"LAUNCH",type:"speed",init:0,muteOn:"STATUS_EXITING_WITCHSPACE",change:1,src:2,sound:"[bgs_fxEngineUp]",cmp:0},
		{start:"LAUNCH",type:"speed",init:0,muteOn:-1,change:-1,src:2,sound:"[bgs_fxEngineDown]",cmp:0},
		{start:"LAUNCH",type:"withinStationAegis",init:1,muteOn:false,change:0,src:3,sound:[],cmp:0},
		{start:"DOCK",type:"status",init:1,muteOn:"STATUS_INFLIGHT",change:0,src:1,sound:"[bgs_ambiStation]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_EQUIP_SHIP",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[bgs_fxEquip]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_SHIPYARD",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[bgs_fxShipyard]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_STATUS",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[bgs_fxStatus]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_MANIFEST",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[bgs_fxManifest]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_SYSTEM_DATA",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[bgs_fxSystemData]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_MARKET",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[bgs_fxMarket]",cmp:0},
		{start:"DOCK",type:"status",init:"GUI_SCREEN_INTERFACES",muteOn:"STATUS_INFLIGHT",change:-1,src:2,sound:"[menu-navigation-not]",cmp:0},
		{start:"WITCH",type:"status",init:1,muteOn:"STATUS_EXITING_WITCHSPACE",change:0,src:1,sound:"[bgs_ambiWitch]",cmp:0},
		{start:"WITCH",type:"status",init:1,muteOn:-1,change:2,src:2,sound:"[bgs_fxWitch]",cmp:0}
	];
	this.bgsWitchPool = [
		{type:0,sound:"[bgs_fxCount0]"},
		{type:1,sound:"[bgs_fxCount1]"},
		{type:2,sound:"[bgs_fxCount2]"},
		{type:3,sound:"[bgs_fxCount3]"},
		{type:4,sound:"[bgs_fxCount4]"},
		{type:5,sound:"[bgs_fxCount5]"},
		{type:6,sound:"[bgs_fxCount6]"},
		{type:7,sound:"[bgs_fxCount7]"},
		{type:8,sound:"[bgs_fxCount8]"},
		{type:9,sound:"[bgs_fxCount9]"},
		{type:10,sound:"[bgs_fxCount10]"},
		{type:14,sound:"[bgs_fxCountG]"},
		{type:14,sound:"[bgs_fxCountH]"}
	];
	this.bgsMusicPool = [
		{start:"DOCK",type:"status",init:1,muteOn:"STATUS_INFLIGHT",change:0,src:3,sound:["bgs-m_music_station1.ogg","bgs-m_music_station2.ogg"],cmp:0}
	];
	this.bgsHyperControl = [0,0,0]; // Shader uniform setting #0 galactic jump, #1 Interstellar
	if(this.bgsQPatch){
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
	this.bgsTimer = new Timer(this,this.doBGSTimer,0,0.6); this.bgsTimer.stop();
	this.bgsInit = true;
	this.bgsMScreen = false;
	this.bgsNoCrowd = false;
	this.bgsCountOnly = false;
	this.bgsCounter = {wp:0,wpType:0,wpSetByOXP:6,chatterScatter:0,hyper:15};
	// Check countdown sounds and disable if other sounds detected
	var check = Sound.load('[galactic-hyperspace-countdown-begun]');
	if(check && check.name!=='bgs-m_silence.ogg') this.bgsDisableJump = true;
	check = Sound.load('[hyperspace-countdown-begun]');
	if(check && check.name!=='bgs-m_silence.ogg') this.bgsDisableJump = true;
	this.fillChatter();
	this.LRC = [[],[],[],[],[],[],[],[]];
	this.LRCMapping = true;
	this.LRCAreas = true;
	this.LRCLanes = true;
	this.lastMapPress = 0;
	this.LRCSp = [[],[],[],[],[],[],[],[]];
	this.LRCSpLoop = 0;
	var alllrc = [
		{id:0,type:1,posx:102.4,posy:0,radi:0.3,action:"LRCMapping",txt:"Advanced mapping:"},
		{id:0,type:1,posx:102.4,posy:17.72,radi:0.3,action:"LRCAreas",txt:"Areas:"},
		{id:0,type:1,posx:102.4,posy:22.592,radi:0.3,action:"LRCLanes",txt:"Spacelanes:"},
		{id:0,type:1,posx:102.4,posy:27.472,radi:0.3,action:"LRCSpecial",txt:"",ov:"1"},
		{id:0,type:1,posx:102.4,posy:32.74,radi:0.3,action:"LRCSpecial",txt:"",ov:"2"},
		{id:0,type:1,posx:102.4,posy:37.672,radi:0.3,action:"LRCSpecial",txt:"",ov:"3"},
		{id:0,type:1,posx:102.4,posy:42.856,radi:0.3,action:"LRCSpecial",txt:"",ov:"4"}
	];
	for(var i=0;i<alllrc.length;i++) this.addToLRC(alllrc[i]);
	this.exSettings = new Timer(this,this.setExternalSettings,1);
//	this.testov = "G8.png"; // Define overlay while testing.
//	this.testPos = [];
//	this.testTime = 0;
//	this.testPosB = null;
	delete this.killSelf;
};
this.killSelf = function(desc)
{
	if(desc!==null){
		player.consoleMessage(this.name+" - Check your Latest.log.",10);
		log(this.name,this.name+" - Shutting down."+desc);
	}
	for(var prop in this){if(prop!=='name' && prop!=='version') delete this[prop];}
	this.deactivated = true;
	return;
};
this.setExternalSettings = function()
{
	if(this.bgsImageSwitch){
		if(!worldScripts["oolite-contracts-cargo"].$cargoSummaryPageBackground) worldScripts["oolite-contracts-cargo"].$cargoSummaryPageBackground = "bgs-i_interface_cargo1.png";
		if(!worldScripts["oolite-contracts-parcels"].$parcelSummaryPageBackground) worldScripts["oolite-contracts-parcels"].$parcelSummaryPageBackground = "bgs-i_interface_parcel1.png";
		if(!worldScripts["oolite-contracts-passengers"].$passengerSummaryPageBackground) worldScripts["oolite-contracts-passengers"].$passengerSummaryPageBackground = "bgs-i_interface_passenger1.png";
	}
	this.exSettings.stop();
	delete this.exSettings;
	delete this.setExternalSettings;
	return;
};
this.addToLRCSpecial = function(obj)
{
	if(!obj || typeof(obj.ov)!=='string' || typeof(obj.gal)!=='number' || typeof(obj.txt)!=='string') return(false);
	this.LRCSp[obj.gal].push(obj);
	this.bgsX = true;
	return(true);
};
this.addToLRC = function(obj)
{
	if(!obj || typeof(obj.type)!=='number' || (typeof(obj.action)!=="string" && (typeof(obj.ov)!=="string" && typeof(obj.gal)!=="number"))) return(false);
	var mm;
	switch(obj.type){
		case 1:
			if(typeof(obj.posx)!=='number' || typeof(obj.posy)!=='number' || typeof(obj.radi)!=='number') return(false);
			obj.minmax = [obj.posx-obj.radi,obj.posx+obj.radi,obj.posy-obj.radi,obj.posy+obj.radi];
			break;
		case 2:
			if(typeof(obj.posx)!=='number' || typeof(obj.posy)!=='number' || typeof(obj.w)!=='number' || typeof(obj.h)!=='number') return(false);
			obj.minmax = [obj.posx-obj.w,obj.posx+obj.w,obj.posy-obj.h,obj.posy+obj.h];
			break;
		case 3:
			if(typeof(obj.nvert)!=='number' || typeof(obj.ax)!=='object' || typeof(obj.ay)!=='object') return(false);
			mm = [99,0,99,0];
			for(var ii=0;ii<obj.nvert;ii++){
				if(obj.ax[ii]<mm[0]) mm[0]=obj.ax[ii];
				if(obj.ax[ii]>mm[1]) mm[1]=obj.ax[ii];
				if(obj.ay[ii]<mm[2]) mm[2]=obj.ay[ii];
				if(obj.ay[ii]>mm[3]) mm[3]=obj.ay[ii];
			}
			obj.minmax = mm;
			break;
		case 4:
			if(typeof(obj.pos)!=='object') return(false);
			mm = [99,0,99,0];
			for(var ij=0;ij<obj.pos.length;ij++){
				if(obj.pos[ij][0]<mm[0]) mm[0]=obj.pos[ij][0];
				if(obj.pos[ij][0]>mm[1]) mm[1]=obj.pos[ij][0];
				if(obj.pos[ij][1]<mm[2]) mm[2]=obj.pos[ij][1];
				if(obj.pos[ij][1]>mm[3]) mm[3]=obj.pos[ij][1];
			}
			mm[0] -= 0.2;
			mm[1] += 0.2;
			mm[2] -= 0.2;
			mm[3] += 0.2;
			obj.minmax = mm;
			break;
		default: return(false);
	}
	if(typeof(obj.id)==='undefined') obj.id=obj.type;
	if(typeof(obj.action)==='string' && typeof(obj.gal)!=='number'){
		for(var k=0;k<8;k++) this.LRC[k].push(obj);
	} else this.LRC[obj.gal].unshift(obj);
	this.LRCResort = true;
	if(typeof(obj.id)==='undefined' || obj.id!==0) this.bgsX = true;
	return(true);
};
this.sortLRCMaps = function()
{
	this.LRC[galaxyNumber] = this.helper.arrSortByProperty(this.LRC[galaxyNumber],"id");
	delete this.LRCResort;
	return;
};
this.fillChatter = function()
{
	var shu;
	if(system.mainStation && system.mainStation.scriptInfo.bgs_chatter) shu = this.helper.arrShuffle(system.mainStation.scriptInfo.bgs_chatter.split("|"));
	else shu = this.helper.arrShuffle(this.chatterPool);
	this.bgsSoundPool[3].sound = shu;
	if(this.logging) log(this.name,"Chatter: "+shu);
	return;
};
this.alertConditionChanged = function()
{
	if(this.bgsDeadMan && this.bgsInit && player.ship.docked){
		if(guiScreen!=='GUI_SCREEN_LOAD' && this.bgsExGUIs.indexOf(guiScreen)===-1){
			if(this.bgsImageSwitch) setScreenBackground(this.bgsI.status);
			this.guiScreenChanged('GUI_SCREEN_STATUS','GUI_SCREEN_INTRO1');
		}
	}
	delete this.alertConditionChanged;
};
this.cleanXLRC = function()
{
	removeFrameCallback(this.xLRC);
	delete this.xLRC;
	this.LRCOV = null;
	return;
};
this.guiScreenChanged = function(to,from)
{
	if(this.testov){
		if(this.testPos.length){
			var ax = [],ay = [];
			for(var i=0;i<this.testPos.length;i++){
				//ax.push(this.testPos[i].x.toFixed(3)); ay.push(this.testPos[i].y.toFixed(3)); // area
				ax.push([this.testPos[i].x.toFixed(3),this.testPos[i].y.toFixed(3)]); // lane
			}
			log("POS x",ax); //log("POS y",ay);
			this.testPos = [];
		}
	}
	if(this.bgsX && player.ship.isValid && guiScreen==='GUI_SCREEN_LONG_RANGE_CHART'){
		if(player.ship.equipmentStatus('EQ_ADVANCED_NAVIGATIONAL_ARRAY')==='EQUIPMENT_OK'){
			if(this.bgsI.lrc) setScreenBackground(this.bgsI.lrc);
			if(this.LRCResort) this.sortLRCMaps();
			var curG = this.LRC[galaxyNumber];
			if((!curG.length || curG.length<8) && !this.LRCSp[galaxyNumber].length){
				if(curG.length<8) this.LRCInfo(0,"Advanced mapping off. No infos available.",0);
				if(this.testov) setScreenOverlay(this.testov);
			} else {
				this.LRCOV = null;
				this.LRCSpLoop = 0;
				this.xLRC = addFrameCallback(this.doBGSChartsTimer.bind(this));
			}
		}
	} else if(this.xLRC) this.cleanXLRC();
	if(!player.ship.docked) return;
	delete this.bgsDeadMan;
	if(this.bgsExGUIs.indexOf(to)!==-1){
		if(guiScreen==="GUI_SCREEN_MISSION" && mission.screenID){
			var id = mission.screenID.split("-");
			if(id.length===4 && id[0]==="oolite"){
				switch(id[3]){
					case "summary": this.chPlay({src:2,sound:"bgs-m_fx_interface_select.ogg"},1); break;
					case "details": this.chPlay({src:2,sound:"bgs-m_fx_interface_map.ogg"},1); break;
					case "none": this.chPlay({src:2,sound:"bgs-m_fx_interface_none.ogg"},1); break;
				}
			}
		}
		this.bgsSCA.stop();
		return;
	} else {
		if(to==='GUI_SCREEN_INTERFACES' || from==='GUI_SCREEN_MISSION' || from==='GUI_SCREEN_REPORT'){
			if(this.bgsMScreen && !this.bgsInit){
				this.restartDelay = (new Date()).getTime();
				this.bgsInit = true;
				if(this.logging) log(this.name,this.name+': Init restart-delay.');
			}
		}
		if(!this.ambientSounds) this.bgsSCA.stop();
		if(!this.fxSounds) this.bgsSCB.stop();
	}
	if(this.bgsInit && !this.bgsOff && to!=='GUI_SCREEN_MISSION') this.reinit();
	if(this.bgsImageSwitch){
		if((this.bgsDisableCrowd || this.bgsNoCrowd) && to==='GUI_SCREEN_STATUS') setScreenBackground(this.bgsI.noCrowd);
	}
};
this.doBGSChartsTimer = function(delta)
{
	if(!player.ship.isValid || !delta) return;
	if(guiScreen==='GUI_SCREEN_LONG_RANGE_CHART'){
		var pos = player.ship.cursorCoordinatesInLY,t,c1,c2,ov,curG;
		pos.x = this.helper.num2Prec(pos.x,3);
		pos.y = this.helper.num2Prec(pos.y,3);
		if(this.testov){
			if(this.testTime && this.testPosB && pos.distanceTo(this.testPosB)<0.01 && (!this.testPos.length || pos.distanceTo(this.testPos[this.testPos.length-1])>0.01)){
				this.testTime += delta;
				if(this.testTime>3){
					this.testPos.push(pos);
					this.testTime = 0;
					log(this.name,"pos:"+pos+" : "+this.LRC[galaxyNumber].length);
					var mySound = new SoundSource();
					mySound.sound = "bgs-c_cloak_fail.ogg";
					mySound.play();
				}
			} else this.testTime = 0.1;
			this.testPosB = pos;
		}
		curG = this.LRC[galaxyNumber];
		for(var i=0;i<curG.length;i++){
			t = curG[i];
			if(!this.LRCMapping && typeof(t.action)==='undefined') continue;
			if(!this.Collision2D.boundingBox(t.minmax,pos)) continue; // Bounding box
			switch(t.type){
				case 1: // Circle
					if(!this.LRCAreas && typeof(t.action)==='undefined') continue;
					c1 = new Vector3D([t.posx,t.posy,0]);
					if(pos.distanceTo(c1)>t.radi) continue;
					ov=true;
					break;
				case 2: // Rectangle
					if(!this.LRCAreas) continue;
					c1 = new Vector3D([t.posx,pos.y,0]);
					c2 = new Vector3D([pos.x,t.posy,0]);
					if(pos.distanceTo(c1)>t.w || pos.distanceTo(c2)>t.h) continue;
					ov=true;
					break;
				case 3: // Poly
					if(!this.LRCAreas) continue;
					var r = this.Collision2D.pointInPoly(t.nvert,t.ax,t.ay,pos,t.hasOwnProperty("con"));
					if(!r) continue;
					ov=true;
					break;
				case 4: // Lane
					if(!this.LRCLanes) continue;
					for(var l=0;l<t.pos.length;l++){
						c1 = new Vector3D([t.pos[l][0],t.pos[l][1],0]);
						if(l<t.pos.length-1){
							c2 = new Vector3D([t.pos[l+1][0],t.pos[l+1][1],0]);
							if(!this.Collision2D.pointOnLineB(c1,c2,pos,0.4)) continue;
						} else if(pos.distanceTo(c1)>0.4) continue;
						ov=true;
						break;
					}
					break;
			}
			if(ov){
				if(typeof(t.action)==='string'){
					if((clock.absoluteSeconds-this.lastMapPress)>1){
						if(typeof(t.ov)!=='string'){
							this[t.action] = !this[t.action];
							this.LRCInfo(0,t.txt+this[t.action],1);
						} else {
							var what;
							switch(t.ov){
								case "1":
									if(this.LRCSp[galaxyNumber].length){
										this.LRCSpLoop += 3;
										if(this.LRCSpLoop>=this.LRCSp[galaxyNumber].length) this.LRCSpLoop=0;
										what = "Specials: ";
										if(this.LRCSp[galaxyNumber].length>this.LRCSpLoop) what += this.LRCSp[galaxyNumber][this.LRCSpLoop].txt+" ";
										if(this.LRCSp[galaxyNumber].length>this.LRCSpLoop+1) what += this.LRCSp[galaxyNumber][this.LRCSpLoop+1].txt+" ";
										if(this.LRCSp[galaxyNumber].length>this.LRCSpLoop+2) what += this.LRCSp[galaxyNumber][this.LRCSpLoop+2].txt+" ";
										this.LRCInfo(0,what,1);
									} else this.LRCInfo(0,"No infos available",1);
									break;
								case "2":
									if(this.LRCSp[galaxyNumber].length>this.LRCSpLoop){
										what = this.LRCSp[galaxyNumber][this.LRCSpLoop];
										this.LRCInfo(what.ov,what.txt,1);
									} else this.LRCInfo(0,"No infos available",1);
									break;
								case "3":
									if(this.LRCSp[galaxyNumber].length>this.LRCSpLoop+1){
										what = this.LRCSp[galaxyNumber][this.LRCSpLoop+1];
										this.LRCInfo(what.ov,what.txt,1);
									} else this.LRCInfo(0,"No infos available",1);
									break;
								case "4":
									if(this.LRCSp[galaxyNumber].length>this.LRCSpLoop+2){
										what = this.LRCSp[galaxyNumber][this.LRCSpLoop+2];
										this.LRCInfo(what.ov,what.txt,1);
									} else this.LRCInfo(0,"No infos available",1);
									break;
							}
						}
					}
					this.lastMapPress = clock.absoluteSeconds;
					return;
				}
				if(!this.LRCOV || this.LRCOV!==t.ov){
					this.LRCOV = t.ov;
					this.LRCInfo(t.ov,0,1);
				}
				return;
			}
		}
		if(!ov){
			if(!this.testov){
				if(this.LRCOV){
					this.LRCOV = null;
					setScreenOverlay(null);
				}
			} else {
				if(this.LRCOV && this.LRCOV!==this.testov){
					this.LRCOV = null;
					this.LRCInfo(this.testov,0,0);
				}
			}
		}
	}
};
this.LRCInfo = function(ov,txt,snd)
{
	if(ov) setScreenOverlay(ov);
	if(txt) player.consoleMessage(txt);
	if(snd){this.bgsSCC.sound = "[@beep]"; this.bgsSCC.play();}
	return;
};
this.reinit = function()
{
	if(typeof(this.restartDelay)!=='undefined'){
		var c = (new Date()).getTime()-this.restartDelay;
		if(c<this.bgsDelay) return;
	}
	this.bgsCurrentSet = this.selectFromPool("DOCK");
	var i = this.bgsCurrentSet.length;
	while(i--){
		this.bgsCurrentSet[0].cmp = 0;
		if(this.bgsCurrentSet[i].src===1) this.bgsCurrentSet[i].init = 1;
	}
	this.bgsTimer.start();
	this.bgsInit = false;
	return;
};
this.selectFromPool = function(cond)
{
	var a = [], b = this.bgsSoundPool, c = false, d = this.bgsMusicPool;
	if(cond==="LAUNCH") c = true;
	var i = b.length;
	while(i--){
		if(cond===b[i].start){
			if(b[i].src===1){
				b[i].init = 1;
				if(c){
					if(player.ship.script.bgs_engine) b[i].sound = player.ship.script.bgs_engine;
					else if(player.ship.scriptInfo.bgs_engine) b[i].sound = player.ship.scriptInfo.bgs_engine;
				}
			}
			if(c){
				if(b[i].change===1){
					if(player.ship.script.bgs_engineUp) b[i].sound = player.ship.script.bgs_engineUp;
					else if(player.ship.scriptInfo.bgs_engineUp) b[i].sound = player.ship.scriptInfo.bgs_engineUp;
				}
				if(b[i].change===-1){
					if(player.ship.script.bgs_engineDown) b[i].sound = player.ship.script.bgs_engineDown;
					else if(player.ship.scriptInfo.bgs_engineDown) b[i].sound = player.ship.scriptInfo.bgs_engineDown;
				}
			}
			b[i].cmp = 0;
			a.push(b[i]);
		}
	}
	if(cond==="DOCK"){
		i = d.length;
		while(i--){
			if(cond===d[i].start){
				var sound = "";
				if(player.ship.dockedStation.scriptInfo.bgs_music) sound = player.ship.dockedStation.scriptInfo.bgs_music;
				else {
					sound = d[i].sound;
					if(typeof(d[i].sound)==='object') sound = d[i].sound[Math.floor(Math.random()*d[i].sound.length)];
				}
				if(!player.ship.dockedStation.scriptInfo.bgs_nomusic){
					if(this.stationMusic && guiScreen!=='GUI_SCREEN_MISSION' && !this.bgsOff){
						if(this.bgsMusic && !this.bgsMScreen) Sound.playMusic(this.bgsMusic,true);
						else {
							if(!this.bgsMScreen) Sound.playMusic(sound,true);
							this.bgsMusic = sound;
						}
					}
				} else this.bgsMusic = null;
				if(player.ship.dockedStation.scriptInfo.bgs_nocrowd || this.bgsDisableCrowd){
					a[1].type = "no"; a[4].type = "no"; a[7].type = "no";
					this.bgsNoCrowd = true;
				} else {
					a[1].type = "status"; a[4].type = "status"; a[7].type = "status";
					this.bgsNoCrowd = false;
				}
			}
		}
	} else if(cond==="WITCH"){
		if(player.ship.scriptInfo.bgs_countonly) this.bgsCountOnly = true;
		if(this.bgsCountOnly) a[0].sound = "bgs-m_silence.ogg";
	}
	if(this.logging) log(this.name,this.name+': New set:'+cond+' containing:'+a.length+' entries.'+a);
	return(a);
};
this.doBGSTimer = function()
{
	if(player.ship.docked){
		if(this.bgsExGUIs.indexOf(guiScreen)!==-1 || this.bgsOff){
			if(this.bgsOff){
				if(this.bgsMusic) Sound.stopMusic(this.bgsMusic);
			} else if(this.bgsMusic){
				if(guiScreen==='GUI_SCREEN_MISSION'){
					if(!mission.screenID || mission.screenID.substr(0,7)!=="oolite-") Sound.stopMusic(this.bgsMusic);
				} else Sound.stopMusic(this.bgsMusic);
			}
			if(this.bgsSCA.isPlaying){this.bgsSCA.stop(); return;}
			this.bgsMScreen = true;
			if(this.restartDelay) this.restartDelay = (new Date()).getTime();
			return;
		} else {
			if(this.bgsMScreen && this.restartDelay){
				var c = (new Date()).getTime()-this.restartDelay;
				if(c>this.bgsDelay){
					delete this.restartDelay;
					this.bgsMScreen = false;
					this.reinit();
				} else return;
			}
		}
		// Only necessary as workaround for not stopped soundsources on loading savedgame
		if(guiScreen==='GUI_SCREEN_LOAD'){
			if(this.bgsSCA.loop){
				this.bgsSCA.loop = false;
				this.bgsSCA.stop();
			}
		} else if(!this.bgsSCA.loop){
			this.bgsSCA.loop = true;
			this.bgsSCA.play();
		}
		if(!this.stationMusic && this.bgsMusic) Sound.stopMusic(this.bgsMusic);
		if(this.bgsInit){
			if(!this.bgsOff){
				this.reinit();
				return;
			}
		}
	}
	if(!this.bgsCurrentSet || !this.bgsCurrentSet.length) return;
	var i = this.bgsCurrentSet.length,cu;
	while(i--){
		var a = this.bgsCurrentSet[i].type;
		if(typeof(player[a])!=='undefined'){
			cu = player[a];
			if(cu!==this.bgsCurrentSet[i].muteOn){
				if(!this.bgsCurrentSet[i].init && this.bgsCurrentSet[i].cmp===cu) continue;
				if(cu && cu!==this.bgsCurrentSet[i].cmp && this.bgsCurrentSet[i].change===0) this.chPlay(this.bgsCurrentSet[i],1);
				if(typeof(this.bgsCurrentSet[i].init)==='number'){this.bgsCurrentSet[i].init = 0; this.bgsCurrentSet[i].cmp=cu;}
			} else {
				if(this.bgsCurrentSet[i].init===this.bgsCurrentSet[i].cmp) continue;
				this.chPlay(this.bgsCurrentSet[i]);
				this.bgsCurrentSet[i].cmp=cu;}
		} else {
			if(typeof(player.ship[a])!=='undefined'){
				cu = player.ship[a];
				if(cu!==this.bgsCurrentSet[i].muteOn){
					if(player.ship.docked && guiScreen===this.bgsCurrentSet[i].init && guiScreen!==this.bgsCurrentSet[i].cmp) this.chPlay(this.bgsCurrentSet[i],1);
					if(!this.bgsCurrentSet[i].init && this.bgsCurrentSet[i].cmp===cu){
						if(this.bgsCurrentSet[i].src===3 && !this.bgsSCC.isPlaying){
							this.bgsCurrentSet[i].init = 1;
							this.bgsCurrentSet[i].cmp = 0;
						}
						continue;
					}
					switch(this.bgsCurrentSet[i].change){
						case 1: if(cu>this.bgsCurrentSet[i].cmp+this.bgsJitterRemove) this.chPlay(this.bgsCurrentSet[i],1); break;
						case -1: if(cu<this.bgsCurrentSet[i].cmp-this.bgsJitterRemove) this.chPlay(this.bgsCurrentSet[i],1); break;
						case 0: if(cu!==this.bgsCurrentSet[i].cmp) this.chPlay(this.bgsCurrentSet[i],1); break;
						case 2: if(cu!==this.bgsCurrentSet[i].cmp) this.chPlay(this.bgsCurrentSet[i],1); break;
					}
					if(typeof(this.bgsCurrentSet[i].init)==='number'){
						this.bgsCurrentSet[i].init = 0;
						this.bgsCurrentSet[i].cmp=cu;
					} else this.bgsCurrentSet[i].cmp=guiScreen;
				} else {
					if(this.bgsCurrentSet[i].muteOn===-1) continue;
					this.bgsCurrentSet[i].cmp=cu;
					this.chPlay(this.bgsCurrentSet[i]);
				}
			}
		}
	}
	if(!player.ship.withinStationAegis && this.bgsSCC.isPlaying) this.bgsSCC.stop();
	return;
};
this.doBGSWPTimer = function()
{
	this.bgsCounter.wp--;
	if(!this.bgsCountOnly && this.bgsCounter.wp>13 && this.bgsCounter.hyper<this.bgsCounter.wp+2){
		if(!this.bgsCounter.wpType) this.bgsSCWP.sound = this.bgsWitchPool[this.bgsWitchPool.length-1].sound;
		else this.bgsSCWP.sound = this.bgsWitchPool[this.bgsWitchPool.length-2].sound;
		if(!this.bgsSCWP.isPlaying) this.bgsSCWP.play();
	} else {
		if(this.bgsCounter.wp<this.bgsCounter.wpSetByOXP && this.bgsCounter.wp>-1){
			this.bgsSCWP.sound = this.bgsWitchPool[this.bgsCounter.wp].sound;
			if(!this.bgsSCWP.isPlaying) this.bgsSCWP.play();
		}
	}
	if(!this.bgsHyperFX || !player.ship.isValid) return;
	if(this.bgsCounter.wp===-1){
		this.bgsSCWP.sound = "[bgs_fxHyper]";
		this.bgsSCWP.play();
	}
};
this.chPlay = function(obj,mode)
{
	var src = obj.src, sound = obj.sound;
	if(typeof(obj.sound)==='object'){
		if(src===3){
			if(!obj.sound.length){
				this.fillChatter();
				return;
			} else sound = obj.sound[0];
		} else sound = obj.sound[Math.floor(Math.random()*obj.sound.length)];
	}
	switch(src){
		case 3:
			if(this.ambientSounds){
				if((!obj.init && !this.bgsSCC.isPlaying) || this.bgsDisableChatter || this.bgsOff) return;
				if(this.bgsCounter.chatterScatter){
					this.bgsCounter.chatterScatter--;
					return;
				} else if(player.ship && player.ship.withinStationAegis && (clock.seconds&1)){
					var l = 0;
					if(system.mainStation) l = system.filteredEntities(this,function(entity){return(entity.isShip && !entity.isPlayer && entity.isPiloted && !entity.isDerelict && !entity.owner);},system.mainStation,52000);
					this.bgsCounter.chatterScatter = Math.ceil(((Math.random()*this.bgsChatterPause)+1)/(l.length+1));
				}
				this.bgsSCC.sound = sound;
				if(mode && player.alertCondition!==3){
					if(!this.bgsSCC.isPlaying){
						this.bgsSCC.play();
						this.bgsSoundPool[3].sound.shift();
					}
				} else this.bgsSCC.stop();
			}
			break;
		case 2:
			if(this.fxSounds){
				this.bgsSCB.sound = sound;
				if(mode && !this.bgsSCB.isPlaying) this.bgsSCB.play();
			}
			break;
		case 1:
			if(this.ambientSounds){
				this.bgsSCA.sound = sound;
				if(mode){
					if(!this.bgsSCA.isPlaying) this.bgsSCA.play();
				} else this.bgsSCA.stop();
			}
			break;
	}
	return;
};
this.shipWillLaunchFromStation = function(station)
{
	if(this.bgsDockingFX) this.setShaderTextures(station,0);
	this.bgsOff = false;
	this.bgsSoundPool[3].init=1;
	this.bgsSCA.stop();
	this.bgsSCB.stop();
	this.bgsSCC.stop();
	this.bgsCurrentSet = this.selectFromPool("LAUNCH");
	this.bgsTimer.start();
	this.bgsMusic = null;
	this.bgsHyperControl = [0,0,0];
	this.bgsMScreen = false;
};
this.setShaderTextures = function(st,land)
{
	if(land){
		this.bgsSCB.sound = "[bgs_fxEngineDown]";
		this.bgsSCB.play();
	}
	var shs = [0.5,1,2,3,5], sh = 2.5, as = 1.0, sit = null, sis = null;
	if(!st.isMainStation && !st.scriptInfo) return;
	if(st.scriptInfo){
		if(st.scriptInfo.bgs_tunnel_texture) sit = st.scriptInfo.bgs_tunnel_texture;
		if(st.scriptInfo.bgs_tunnel_shape) sis = parseFloat(st.scriptInfo.bgs_tunnel_shape);
	}
	if(st.isMainStation || sit || sis){
		if(!sis){
			var s = st.subEntities;
			var l = s.length;
			for(var i=0;i<l;i++){
				if(s[i].isDock){
					var bb = s[i].boundingBox,r;
					if(bb.x>=bb.y) r = bb.x/bb.y;
					else r = bb.y/bb.x;
					sh = shs[this.helper.clamp(Math.floor(r),4,0)];
					break;
				}
			}
		} else sh = sis;
		if(sh>1.1) as = (oolite.gameSettings.gameWindow.width/oolite.gameSettings.gameWindow.height)-0.5;
		else as = oolite.gameSettings.gameWindow.width/oolite.gameSettings.gameWindow.height;
		var ent = system.addVisualEffect("bgs_docking",player.ship.position.add(player.ship.vectorForward.multiply(250)));
		ent.shaderFloat1 = sh;
		ent.shaderFloat2 = as;
		if(!land) ent.shaderInt1 = 1;
		if(sit){
			var ta = ent.getMaterials();
			var tb = Object.keys(ta);
			ta[tb[0]].textures[0].name = sit;
			ent.setMaterials(ta);
		}
		st.breakPattern = false;
	}
	return;
};
this.playerCancelledJumpCountdown = this.playerJumpFailed = this.playerStartedAutoPilot = function()
{
	if(this.bgsWPTimer){this.bgsWPTimer.stop(); delete this.bgsWPTimer;}
	this.bgsSCWP.stop();
	this.bgsOff = false;
	this.bgsSoundPool[3].init=1;
	this.bgsSCA.stop();
	this.bgsCurrentSet = this.selectFromPool("LAUNCH");
	this.bgsTimer.start();
	this.bgsMusic = null;
};
this.shipWillExitWitchspace = function()
{
	if(!this.bgsHyperFX || player.ship.docked) return;
	system.breakPattern = false;
	var a = worldScripts.Cabal_Common_Overlay.ovAdd({cclov_type:2,cclov_blend:8,cclov_id:"BGSHYPER",cclov_fx:this.bgsHyperShader,cclov_autoremove:1});
	if(a){
		if(system.isInterstellarSpace) this.bgsHyperControl[1] = 1;
		else this.bgsHyperControl[1] = 0;
		this.bgsHyperControl[2] = oolite.gameSettings.gameWindow.width/oolite.gameSettings.gameWindow.height;
		a.shaderVector2 = this.bgsHyperControl;
	}
};
this.shipExitedWitchspace = function()
{
	this.bgsSCA.stop();
	this.bgsCurrentSet = this.selectFromPool("LAUNCH");
	this.bgsTimer.start();
	this.bgsMusic = null;
	if(this.bgsWPTimer){this.bgsWPTimer.stop(); delete this.bgsWPTimer;}
	this.bgsHyperControl = [0,0,0];
	if(!this.bgsHyperFX || player.ship.docked) return;
	if(this.bgsHyperFXWormhole){
		if(system.isInterstellarSpace) system.addVisualEffect("bgs_exitWormhole_misjump",player.ship.position.subtract(player.ship.vectorForward.multiply(200)));
		else system.addVisualEffect("bgs_exitWormhole_effect",player.ship.position.subtract(player.ship.vectorForward.multiply(200)));
	}
};
this.shipWillEnterWitchspace = function()
{
	if(this.xLRC) this.cleanXLRC();
	this.bgsSCC.stop();
};
this.shipWillDockWithStation = function(station)
{
	if(this.xLRC) this.cleanXLRC();
	this.bgsSCC.stop();
	if(this.bgsDockingFX) this.setShaderTextures(station,1);
};
this.shipDockedWithStation = function()
{
	this.bgsSCA.stop();
	this.bgsSCC.stop();
	if(this.bgsWPTimer){this.bgsWPTimer.stop(); delete this.bgsWPTimer;}
	this.bgsSCWP.stop();
	this.bgsCurrentSet = this.selectFromPool("DOCK");
	this.bgsTimer.start();
};
this.playerStartedJumpCountdown = function(type,duration)
{
	this.bgsSCA.stop();
	this.bgsCurrentSet = this.selectFromPool("WITCH");
	this.bgsTimer.start();
	switch(type){
		case "standard": this.bgsHyperControl[0] = 0; break;
		case "galactic": this.bgsHyperControl[0] = 1; break;
	}
	if(duration<1 || this.bgsDisableJump) return;
	this.bgsCounter.wp = duration;
	this.bgsCounter.wpType = (type==="standard"?0:1);
	this.bgsCounter.hyper = duration;
	if(!this.bgsWPTimer){
		this.bgsWPTimer = new Timer(this,this.doBGSWPTimer,0,1);
		if(this.bgsCountOffset){
			this.bgsWPTimer.stop();
			this.bgsWPTimer.nextTime = clock.absoluteSeconds+this.bgsCountOffset;
			this.bgsWPTimer.start();
		}
	} else this.bgsWPTimer.start();
};
this.shipEnteredStationAegis = function()
{
	this.fillChatter();
	this.bgsSoundPool[3].init=1;
};
this.shipDied = function()
{
	if(this.bgsWPTimer){this.bgsWPTimer.stop(); delete this.bgsWPTimer;}
	this.bgsTimer.stop();
	this.bgsSCWP.stop();
	this.bgsSCA.stop();
	this.bgsSCB.stop();
	this.bgsSCC.stop();
	if(this.xLRC) this.cleanXLRC();
};
this.shipLaunchedEscapePod = function()
{
	if(this.bgsSCWP) this.bgsSCWP.stop();
};
this.playerEnteredNewGalaxy = function()
{
	this.LRCSpLoop = 0;
	this.LRCResort = true;
};
this.oxpcSettings = {
	Info: {Name:"BGS-M",Display:"BGS",EarlyCall:true,EarlySet:true,Notify:true,
		InfoB:"1 - Internal logging.\n2 - Music when docked.\n3 - Ambient sounds (crowd and engine mumble).\n4 - Screen specific sounds and engine up/down.",
		InfoS:"1 - Delay in milliseconds before restart after mission screen.\n2 - Dampening jitter for joystick users. Use with care as it reduces responsivness.\n3 - Offset for countdown timer. It can help to 'correct' the countdown.",
		InfoE:"Crowd sounds, spoken jumpcountdown, chatter, Q-Mine sound, Hyperjump+Wormhole exit sequences via shader, longer pauses for chatter, reduced jump shader in case your machine can't handle it and the docking sequence."
	},
	Bool0: {Name:"logging",Def:false,Desc:"Logging functions."},
	Bool1: {Name:"stationMusic",Def:true,Desc:"Music when docked."},
	Bool2: {Name:"ambientSounds",Def:true,Desc:"Ambient sound layer."},
	Bool3: {Name:"fxSounds",Def:true,Desc:"FX sound layer."},
	SInt0: {Name:"bgsDelayS",Def:0x6,Max:0xf,Desc:"Delay in ms x 100"},
	SInt1: {Name:"bgsJitterRemoveS",Def:0x0,Max:0xff,Desc:"Threshold / 2500"},
	SInt2: {Name:"bgsCountOffsetS",Def:0x0,Max:0xf,Desc:"Offset ms x 50"},
	EInt0: {Name:"EIntA",Def:0x130,Max:0x1ff,Desc:["Disable crowd","Disable Countdown","Disable Chatter","QMine sound","Hyperjump","Wormholeexit","LongChatter","ReduxShader","DockingFX"]}
};
this.oxpcNotifyOnChange = function(n)
{
	if((n&2)){
		this.bgsDelay = this.bgsDelayS*100;
		this.bgsCountOffset = this.bgsCountOffsetS*0.05;
		this.bgsJitterRemove = this.bgsJitterRemoveS*0.0004;
	}
	if((n&4)){
		if((this.EIntA&1)) this.bgsDisableCrowd = true;
		else this.bgsDisableCrowd = false;
		if((this.EIntA&2)) this.bgsDisableJump = true;
		else this.bgsDisableJump = false;
		if((this.EIntA&4)) this.bgsDisableChatter = true;
		else this.bgsDisableChatter = false;
		if((this.EIntA&8)){
			this.bgsQPatch = true;
			this.shipSpawned = function(ship){
				if(ship.isValid && ship.isMine && ship.AI==="timebombAI.plist" && ship.name==="Quirium Cascade Mine" && ship.script.name==="oolite-default-ship-script"){
					if(ship.script.shipDied) ship.script.bgsShipDied = ship.script.shipDied;
					ship.script.shipDied = function(whom,why){
						if(ship.script.bgsShipDied) ship.script.bgsShipDied(whom,why);
						if(!player.ship.isValid || ship.position.distanceTo(player.ship.position)>25600) return;
						if(why && why==="cascade weapon"){var a = new SoundSource(); a.sound = "[bgs_fxQMine]"; a.play();}
			};}};
		} else {
			this.bgsQPatch = false;
			delete this.shipSpawned;
		}
		if((this.EIntA&16)) this.bgsHyperFX = true;
		else this.bgsHyperFX = false;
		if((this.EIntA&32)) this.bgsHyperFXWormhole = true;
		else this.bgsHyperFXWormhole = false;
		if((this.EIntA&64)) this.bgsChatterPause = 130;
		else this.bgsChatterPause = 24;
		if((this.EIntA&128)) this.bgsHyperShader = "bgs_hyper_redux";
		else this.bgsHyperShader = "bgs_hyper";
		if((this.EIntA&256)) this.bgsDockingFX = true;
		else this.bgsDockingFX = false;
	}
	return;
};
