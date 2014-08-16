# Makefile
#
# Copyright © 2014 Richard Thomas Harrison (Tricky)
#
# This work is licensed under the Creative Commons License
# Attribution-Noncommercial-Share Alike 4.0 International (CC BY-NC-SA 4.0)
#
# To view a copy of this license, visit
# http://creativecommons.org/licenses/by-nc-sa/4.0/ or send an email
# to info@creativecommons.org
#
# Makefile for the BackGroundSet OXP/OXZ.

ifndef HOME
	HOME := /home/$(USER)
endif

SHELL := /bin/sh
CP := $(shell which cp) -a
RM := $(shell which rm) -f
MV := $(shell which mv)
MD := $(shell which mkdir)
CAT := $(shell which cat)
SED := $(shell which sed)
ZIP := $(shell which zip)
GIT := $(shell which git)

BASEDIR := $(shell $(SED) -n 's/^\s*basedir\s*=\s*\(.*\)\s*$$/\1/p' config)
OXZ := $(shell $(SED) -n 's/^\s*oxz\s*=\s*\(.*\)\s*$$/\1/p' config)
OXPINSTALL := $(shell $(SED) -n 's/^\s*oxpinstall\s*=\s*\(.*\)\s*$$/\1/p' config)
OXZINSTALL := $(shell $(SED) -n 's/^\s*oxzinstall\s*=\s*\(.*\)\s*$$/\1/p' config)
SUBDIR := $(shell $(SED) -n 's/^\s*subdir\s*=\s*\(.*\)\s*$$/\1/p' config)
_NAME := $(shell $(SED) -n 's/^\s*name\s*=\s*\(.*\)\s*$$/\1/p' config)
_VERSION := $(shell $(SED) -n 's/^\s*version\s*=\s*\(.*\)\s*$$/\1/p' config)

ifeq ($(OXZ),true)
	_AUTHOR := $(shell $(SED) -n 's/^\s*author\s*=\s*\(.*\)\s*$$/\1/p' config)
	_CATEGORY := $(shell $(SED) -n 's/^\s*category\s*=\s*\(.*\)\s*$$/\1/p' config)
	_COPYRIGHT := $(shell $(SED) -n -e 's/^\s*copyright\s*=\s*\(.*\)\s*$$/\1/p' config)
	_DESCRIPTION := $(shell $(SED) -n 's/^\s*description\s*=\s*\(.*\)\s*$$/\1/p' config)
	_DOWNLOAD_URL := $(shell $(SED) -n 's/^\s*download_url\s*=\s*\(.*\)\s*$$/\1/p' config)
	_IDENTIFIER := $(shell $(SED) -n 's/^\s*identifier\s*=\s*\(.*\)\s*$$/\1/p' config)
	_INFORMATION_URL := $(shell $(SED) -n 's/^\s*information_url\s*=\s*\(.*\)\s*$$/\1/p' config)
	_LICENSE := $(shell $(SED) -n 's/^\s*license\s*=\s*\(.*\)\s*$$/\1/p' config)
	_LICENSE_FULL := $(shell $(SED) -n 's/^\s*license_full\s*=\s*\(.*\)\s*$$/\1/p' config)
	_LICENSE_URL := $(shell $(SED) -n 's/^\s*license_url\s*=\s*\(.*\)\s*$$/\1/p' config)
	_REQUIRED_OOLITE_VERSION := $(shell $(SED) -n 's/^\s*required_oolite_version\s*=\s*\(.*\)\s*$$/\1/p' config)
	_TITLE := $(shell $(SED) -n 's/^\s*title\s*=\s*\(.*\)\s*$$/\1/p' config)
endif

ifeq ($(realpath ./.git),)
	VER_GITREV := 0
else
	VER_GITREV := $(shell $(GIT) rev-list --count HEAD)
endif

VERREV := $(shell echo "${_VERSION}b${VER_GITREV}")

BASENAME := $(_NAME)_$(_VERSION)
OXPNAME := $(BASENAME).oxp
OXZNAME :=

ifeq ($(OXZ),true)
	OXZNAME := $(_IDENTIFIER).oxz
endif

OOLITEDIRS =

ADDONDIRS := $(patsubst %,%/AddOns,$(OXPINSTALL))

ifeq ($(SUBDIR),)
	OXPDIRS := $(patsubst %,%/$(OXPNAME),$(ADDONDIRS))
else
	OXPDIRS := $(patsubst %,%/$(SUBDIR)/$(OXPNAME),$(ADDONDIRS))
endif

ifeq ($(OXZ),true)
	ADDONDIRS := $(patsubst %,%/AddOns,$(OXZINSTALL))

	ifeq ($(SUBDIR),)
		OXZPATH := $(patsubst %,%/$(OXZNAME),$(ADDONDIRS))
	else
		OXZPATH := $(patsubst %,%/$(SUBDIR)/$(OXZNAME),$(ADDONDIRS))
	endif
endif

BASEOXPDIR := $(BASEDIR)/$(BASENAME)/$(OXPNAME)

TMPDIR := $(BASEDIR)/tmp/$(_NAME)

.PHONY: default all test bgs release clean reallyclean

default: test

all: bgs

bgs: $(BASEDIR)/$(BASENAME) process_files docs makearchive $(OXPDIRS) $(OXZPATH)

test:
	@echo "BASEDIR:             \`$(BASEDIR)'"
	@echo "OXZ:                 \`$(OXZ)'"
	@echo "OXPINSTAL:           \`$(OXPINSTALL)'"
	@echo "SUBDIR:              \`$(SUBDIR)'"
	@echo "_NAME:               \`$(_NAME)'"
	@echo "_VERSION:            \`$(_VERSION)'"
	@echo "VERREV:              \`$(VERREV)'"
	@echo "BASENAME:            \`$(BASENAME)'"
	@echo "OXPNAME:             \`$(OXPNAME)'"
	@echo "OXPDIRS:             \`$(OXPDIRS)'"
ifeq ($(OXZ),true)
	@echo "_IDENTIFIER:         \`$(_IDENTIFIER)'"
	@echo "OXZNAME:             \`$(OXZNAME)'"
	@echo "OXZINSTALL:          \`$(OXZINSTALL)'"
	@echo "OXZPATH:             \`$(OXZPATH)'"
endif

release: clean bgs

$(OXPDIRS):
	@$(MD) -p $@
	$(CP) -t $@ $(BASEOXPDIR)/*

$(OXZPATH):
ifeq ($(OXZ),true)
	$(CP) -L $(BASEDIR)/$(_NAME)_$(VERREV).oxz $@
endif

$(BASEDIR)/$(BASENAME)/$(OXPNAME):
	@$(MD) -p $@

$(BASEDIR)/$(BASENAME): $(BASEDIR)/$(BASENAME)/$(OXPNAME)
	$(CP) src/* $@/$(OXPNAME)

docs:
	$(CP) Doc/BGS-A_1.9.3_Readme.rtf $(BASEDIR)/$(BASENAME)
	$(CP) Doc/BGS-A_1.9.3_Readme.rtf $(BASEDIR)/$(BASENAME)/$(OXPNAME)

process_files:
	@tools/process_files.sh $(_NAME) $(_VERSION)

makemanifest:
	@$(SED) \
		-e 's/[$$]AUTHOR[$$]/$(_AUTHOR)/' \
		-e 's/[$$]CATEGORY[$$]/$(_CATEGORY)/' \
		-e 's/[$$]COPYRIGHT[$$]/$(_COPYRIGHT)/' \
		-e 's/[$$]DESCRIPTION[$$]/$(_DESCRIPTION)/' \
		-e 's=[$$]DOWNLOAD_URL[$$]=$(_DOWNLOAD_URL)=' \
		-e 's/[$$]IDENTIFIER[$$]/$(_IDENTIFIER)/' \
		-e 's=[$$]INFORMATION_URL[$$]=$(_INFORMATION_URL)=' \
		-e 's/[$$]LICENSE[$$]/$(_LICENSE)/' \
		-e 's/[$$]LICENSE_FULL[$$]/$(_LICENSE_FULL)/' \
		-e 's=[$$]LICENSE_URL[$$]=$(_LICENSE_URL)=' \
		-e 's/[$$]REQUIRED_OOLITE_VERSION[$$]/$(_REQUIRED_OOLITE_VERSION)/' \
		-e 's/[$$]TITLE[$$]/$(_TITLE)/' \
		-e 's/[$$]VERSION[$$]/$(_VERSION)/' manifest.plist > $(BASEOXPDIR)/manifest.plist

makezip:
	@cd $(BASEDIR) && $(ZIP) -q9or $(_NAME)_$(VERREV).zip $(BASENAME)
	@cd $(BASEDIR) && $(ZIP) -T $(_NAME)_$(VERREV).zip
	@cd $(BASEDIR) && ln -sf $(_NAME)_$(VERREV).zip $(BASENAME).zip

makeoxz:
ifeq ($(OXZ),true)
	@cd $(BASEOXPDIR) && $(ZIP) -q9or $(BASEDIR)/$(_NAME)_$(VERREV).oxz .
	@cd $(BASEDIR) && $(ZIP) -T $(_NAME)_$(VERREV).oxz
	@cd $(BASEDIR) && ln -sf $(_NAME)_$(VERREV).oxz $(BASENAME).oxz
endif

makearchive: makemanifest makezip makeoxz

cleantmp:
	$(RM) -r $(TMPDIR)

cleanzip:
	$(RM) $(BASEDIR)/$(_NAME)_$(VERREV).zip
	$(RM) $(BASEDIR)/$(BASENAME).zip

cleanoxz:
ifeq ($(OXZ),true)
	$(RM) $(BASEDIR)/$(_NAME)_$(VERREV).oxz
	$(RM) $(BASEDIR)/$(BASENAME).oxz
endif

cleanoxp:
	$(RM) -r $(BASEDIR)/$(BASENAME)
	$(RM) -r $(OXPDIRS)
ifeq ($(OXZ),true)
	$(RM) $(OXZPATH)
endif

clean: cleantmp cleanzip cleanoxz cleanoxp

reallyclean: clean
