#!/bin/bash
APP_ID=$1

TARG_ATTRIBUTES='        TargetAttributes = {
                      1D6058900D05DD3D006BFB54 = {
                        DevelopmentTeam = 4HK36Z99TA;
                        ProvisioningStyle = Manual;
                        SystemCapabilities = {
                          com.apple.Push = {
                            enabled = 1;
                          };
                        };
                      };
                    };'
PROV_PROFILE='				PROVISIONING_PROFILE = "8748f00c-fb05-4d07-bc52-494b73b39be9";
				PROVISIONING_PROFILE_SPECIFIER = "match AdHoc com.schoolloop.mobileloop.'${APP_ID}'";'
DEV_TEAM='				DEVELOPMENT_TEAM = 4HK36Z99TA;'
IDENTITY='				"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Distribution";'
ENTITLEMENT='		D4943D801DE97CA200DAE4F6 /* MobileLoop.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; name = MobileLoop.entitlements; path = MobileLoop/MobileLoop.entitlements; sourceTree = "<group>"; };'
ENTITLEMENT_CHILD='				D4943D801DE97CA200DAE4F6 /* MobileLoop.entitlements */,'
CODE_SIGN_ENT='				CODE_SIGN_ENTITLEMENTS = MobileLoop/MobileLoop.entitlements;'

cp app/platforms/ios/MobileLoop/Entitlements-Debug.plist app/platforms/ios/MobileLoop/MobileLoop.entitlements
printf '%s\n' /LastUpgradeCheck a "$TARG_ATTRIBUTES" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj;
printf '%s\n' /LastUpgradeCheck a "$PROV_PROFILE" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' /PRODUCT_NAME a "$PROV_PROFILE" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' ?PRODUCT_NAME a "$PROV_PROFILE" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' /CLANG_ENABLE_OBJC_ARC a "$IDENTITY" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' /COPY_PHASE_STRIP a "$DEV_TEAM" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' ?COPY_PHASE_STRIP a "$DEV_TEAM" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' /GAI.h a "$ENTITLEMENT" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' ?EB87FDF41871DAF40020F90C - a "$ENTITLEMENT_CHILD" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' /CLANG_ENABLE_OBJC_ARC a "$CODE_SIGN_ENT" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
printf '%s\n' ?COPY_PHASE_STRIP - a "$CODE_SIGN_ENT" . w q | ex -s app/platforms/ios/MobileLoop.xcodeproj/project.pbxproj
