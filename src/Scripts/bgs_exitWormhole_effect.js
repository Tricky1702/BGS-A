/* BGS Exit Wormhole Effect
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
 * Player ship script to setup the BGS exit wormhole effect.
 */

"use strict";
this.author = "Pagroove, PhantorGorth, Thargoid and Svengali";
this.copyright = "$COPYRIGHT$";
this.description = "Shrink effect script.";
this.license = "$LICENSE$";
this.name = "bgs_exitWormhole_effect";
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
