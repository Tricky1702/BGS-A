/* BGS Docking Effect
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
 * Player ship script to setup the BGS docking effect.
 */

"use strict";
this.author = "Svengali and Tricky";
this.copyright = "$COPYRIGHT$";
this.description = "FX script";
this.license = "$LICENSE$";
this.name = "bgs_docking_effect";
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
