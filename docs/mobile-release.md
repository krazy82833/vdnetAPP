# Mobile Release Guide

This project is currently an Expo React Native app. GitHub can publish test
builds only after a real mobile build pipeline produces binary artifacts.

## Android APK

The workflow `.github/workflows/mobile-release.yml` can build a test APK on
GitHub Actions.

Steps:

1. Open GitHub repository `krazy82833/vdnetAPP`.
2. Go to `Actions`.
3. Select `Build mobile test release`.
4. Click `Run workflow`.
5. Use a tag such as `v0.1.0-test.1`.
6. After the workflow finishes, open `Releases` and download the generated
   `VDNet-<tag>.apk`.

The APK is for testing. Store-ready Android delivery still needs signing,
versioning, icons, privacy policy, and production build configuration.

## iOS IPA

iOS cannot produce an installable IPA without Apple signing. A Windows machine
cannot locally create a signed iOS app. GitHub Actions can build IPA only after
these repository secrets are configured:

- `IOS_CERTIFICATE_BASE64`: base64 encoded `.p12` signing certificate.
- `IOS_CERTIFICATE_PASSWORD`: password for the `.p12`.
- `IOS_PROVISION_PROFILE_BASE64`: base64 encoded `.mobileprovision` profile.
- `EXPORT_OPTIONS_PLIST_BASE64`: base64 encoded `ExportOptions.plist`.
- `KEYCHAIN_PASSWORD`: temporary keychain password used by the workflow.

After those secrets are added, run the same workflow. It will attach
`VDNet-<tag>.ipa` to the GitHub Release.

## Current Limitation

Do not upload fake `.apk` or `.ipa` files. Testers need real platform binaries:

- Android can be built through GitHub Actions with the included workflow.
- iOS requires Apple Developer signing material or an EAS/Apple build pipeline.
