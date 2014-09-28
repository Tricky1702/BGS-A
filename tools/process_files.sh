#!/bin/sh

# process_files.sh
#
# Copyright © 2014 Richard Thomas Harrison (Tricky)
#
# This work is licensed under the Creative Commons License
# Attribution-Noncommercial-Share Alike 4.0 International (CC BY-NC-SA 4.0)
#
# To view a copy of this license, visit
# http://creativecommons.org/licenses/by-nc-sa/4.0/ or send an email
# to info@creativecommons.org

PWD=`pwd`
eval `sed -n 's/^\s*basedir\s*=\s*\(.*\)\s*$/BASEDIR="\1"/p' $PWD/config`
NAME="$1"

if [ "x$NAME" == "x" ]; then
  eval `sed -n 's/^\s*name\s*=\s*\(.*\)\s*$/NAME="\1"/p' $PWD/config`

  if [ "x$NAME" == "x" ]; then
    exit 1
  fi
fi

VERSION="$2"

if [ "x$VERSION" == "x" ]; then
  eval `sed -n 's/^\s*version\s*=\s*\(.*\)\s*$/VERSION="\1"/p' $PWD/config`

  if [ "x$VERSION" == "x" ]; then
    exit 1
  fi
fi

OXPNAME="$NAME""_$VERSION"
EXPORTDIR="$BASEDIR/$OXPNAME"

function process() {
  FN="$1"
  BN="`basename $1`"

  if [ "x$BN" == "x$OXPNAME" ]; then
    RD="$PWD/Doc"
  elif [ "x$BN" == "x$OXPNAME.oxp" ]; then
    RD="$PWD/src"
  else
    RD="$PWD/src/$BN"
  fi

  touch -m --reference="$RD" "$1"

  for fn in `find $1 -maxdepth 1 -type f -exec basename {} \;`
  do
    echo -ne "* Processing $fn...                    \\r"
    touch -m --reference="$RD/$fn" "$1/$fn"
  done

  echo -ne "\\n"
}

echo "= $EXPORTDIR ="
echo "== Updating variables =="
find $EXPORTDIR/$OXPNAME.oxp/Scripts -type f -iname "*.js" -exec tools/process_file.sh $PWD {} \;
echo "== Fixing directory ACL's =="
find $EXPORTDIR -type d -exec chown -c $USER.Users {} \; -exec chmod -c 0755 {} \;
echo "== Fixing file ACL's =="
find $EXPORTDIR -type f -exec chown -c $USER.Users {} \; -exec chmod -c 0644 {} \;
echo "== Fixing reference times =="

for dir in `find $EXPORTDIR -type d -print`
do
  echo "=== $dir ==="
  process $dir
done
