#!/bin/sh

# process_file.sh
#
# Copyright © 2014 Richard Thomas Harrison (Tricky)
#
# This work is licensed under the Creative Commons License
# Attribution-Noncommercial-Share Alike 4.0 International (CC BY-NC-SA 4.0)
#
# To view a copy of this license, visit
# http://creativecommons.org/licenses/by-nc-sa/4.0/ or send an email
# to info@creativecommons.org

PWD=$1

eval `sed -n 's/^\s*author\s*=\s*\(.*\)\s*$/AUTHOR="\1"/p' $PWD/config`
eval `sed -n 's/^\s*copyright\s*=\s*\(.*\)\s*$/COPYRIGHT="\1"/p' $PWD/config`
eval `sed -n 's/^\s*license\s*=\s*\(.*\)\s*$/LICENSE="\1"/p' $PWD/config`
eval `sed -n 's/^\s*license_full\s*=\s*\(.*\)\s*$/LICENSE_FULL="\1"/p' $PWD/config`
eval `sed -n 's/^\s*license_url\s*=\s*\(.*\)\s*$/LICENSE_URL="\1"/p' $PWD/config`
eval `sed -n 's/^\s*version\s*=\s*\(.*\)\s*$/VERSION="\1"/p' $PWD/config`

sed -n -e 's/[$]AUTHOR[$]/$AUTHOR/' -e 's/[$]COPYRIGHT[$]/$COPYRIGHT/' -e 's/[$]LICENSE[$]/$LICENSE/' -e 's/[$]LICENSE_FULL[$]/$LICENSE_FULL/' -e 's=[$]LICENSE_URL[$]=$LICENSE_URL=' -e 's/[$]VERSION[$]/$VERSION/' $2 > $2.new
mv $2.new $2
