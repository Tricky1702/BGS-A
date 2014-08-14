"use strict";
this.name = "bgs_docking_effect";
this.author = "Svengali";
this.copyright = "CC-by";
this.description = "FX script";
this.version = "1.9";

this.effectSpawned = function()
{
	this.getRid = clock.absoluteSeconds;
	this.ovFCBID = addFrameCallback(this.repos.bind(this));
	this.ridTime = this.getRid+2.6;
	this.sts = player.ship.status;
};
this.effectRemoved = function()
{
	removeFrameCallback(this.ovFCBID);
};
this.repos = function(delta)
{
	if(!player.ship.isValid || this.getRid>this.ridTime || this.sts!==player.ship.status) this.visualEffect.remove();
	this.getRid = clock.absoluteSeconds;
	if(!delta) return;
	this.visualEffect.position = player.ship.position.add(player.ship.vectorForward.multiply(250));
	this.visualEffect.orientation = player.ship.orientation;
	return;
};
