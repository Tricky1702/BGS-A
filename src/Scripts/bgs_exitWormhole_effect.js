"use strict";
this.name = "bgs_exitWormhole_effect";
this.author = "Pagroove, PhantorGorth, Thargoid and Svengali";
this.copyright = "(C)2010-2013, License:CC-by-nc-sa-3.0";
this.description = "Shrink effect script.";
this.version = "1.9";

this.effectSpawned = function()
{
	if(!this.visualEffect) return;
	this.duration = 0;
	this.callbackID = addFrameCallback(this.$shrinkSphere.bind(this));
};
this.$shrinkSphere = function(delta)
{
	if(!player.ship.isValid){
		this.visualEffect.remove();
		return;
	}
	this.visualEffect.scale(0.995);
	this.duration += delta;
	if(this.duration > 20) this.visualEffect.remove();
	else this.visualEffect.orientation = player.ship.orientation;
};
this.effectRemoved = function()
{
	if(this.callbackID) removeFrameCallback(this.callbackID);
	delete this.callbackID;
};
