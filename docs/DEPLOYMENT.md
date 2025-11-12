# Deployment Guide

This comprehensive guide will walk you through deploying the Hyperliquid Mobile Companion app to Apple's TestFlight for beta testing.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Updating Your Build](#updating-your-testflight-build)
- [Troubleshooting](#troubleshooting)
- [Commands Reference](#common-commands-reference)

---

## Prerequisites

Before you begin deploying to TestFlight, ensure you have:

### Required Accounts

#### 1. Apple Developer Account ($99/year)
- Sign up at [developer.apple.com](https://developer.apple.com)
- Complete enrollment process (may take 24-48 hours)
- Have your Apple ID credentials ready
- Note your Team ID (found in account settings)

#### 2. Expo Account (Free)
- Sign up at [expo.dev](https://expo.dev)
- Free for unlimited builds
- Remember your username for configuration

### Required Software

Ensure these are already installed from the [Getting Started guide](../README.md#getting-started):
- macOS (required for iOS builds)
- Node.js 18+
- Xcode (latest version)
- Expo CLI
- **EAS CLI**: `npm install -g eas-cli`

---

## Step-by-Step Deployment

### Step 1: Configure EAS (Expo Application Services)

First, log in to your Expo account:

```bash
eas login
```

Enter your Expo credentials when prompted.

**Verify login:**
```bash
eas whoami
```

This should display your Expo username.

---

### Step 2: Update App Configuration

Edit `app.json` to customize your app metadata:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "owner": "your-expo-username"
  }
}
```

**Important Configuration Values:**

- **`name`**: Your app's display name (appears under the icon)
  - Example: "Hyperliquid Mobile", "My Trading App"
  
- **`slug`**: URL-friendly identifier
  - Must be lowercase, no spaces
  - Example: "hyperliquid-mobile", "my-trading-app"
  
- **`bundleIdentifier`**: Unique app identifier in reverse domain notation
  - Must be globally unique on the App Store
  - Example: `com.yourcompany.yourapp`
  - **Cannot be changed after first App Store submission**
  
- **`owner`**: Your Expo username
  - Must match your Expo account username
  
- **`version`**: App version number (semantic versioning)
  - Start with "1.0.0"
  - Increment for each new build

---

### Step 3: Configure EAS Build

If this is your first build, initialize EAS:

```bash
eas build:configure
```

This command will:
1. Create an `eas.json` configuration file
2. Set up build profiles (development, preview, production)
3. Configure platform-specific settings

**Verify `eas.json` contents:**

```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "default"
      }
    }
  }
}
```

---

### Step 4: Create App Store Connect Record

Before building, you need to register your app in App Store Connect.

1. **Navigate to App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Create New App**
   - Click **"My Apps"**
   - Click the **"+"** button
   - Select **"New App"**

3. **Fill in App Information**
   - **Platform**: iOS
   - **Name**: Your app name (must be unique on the App Store)
     - This can be different from your `app.json` name
     - Check availability before proceeding
   - **Primary Language**: English (or your preference)
   - **Bundle ID**: Must exactly match `bundleIdentifier` from `app.json`
     - Use the dropdown to select the bundle ID
     - If not listed, create it in Apple Developer portal first
   - **SKU**: Any unique identifier for internal tracking
     - Example: `your-app-001`, `hyperliquid-mobile-v1`
   - **User Access**: Full Access (recommended)

4. **Click "Create"**

**Note**: You don't need to fill out all app metadata yet. This can be done later if you plan to release to the full App Store.

---

### Step 5: Build for iOS

Now you're ready to build your app. This process takes 15-30 minutes.

```bash
eas build --platform ios --profile production
```

**What happens during the build:**

1. **Code Upload**: Your code is uploaded to EAS servers
2. **Apple Login**: You'll be prompted to log in to your Apple Developer account
   - Enter your Apple ID email
   - Enter your Apple ID password
   - Complete 2FA if enabled
3. **Provisioning**: EAS automatically creates/manages:
   - Provisioning profiles
   - Signing certificates
   - Push notification certificates
4. **Compilation**: Your app is compiled for iOS
5. **Packaging**: An `.ipa` file is created

**Build Progress:**

You can monitor your build at:
- Terminal output (shows real-time progress)
- Expo dashboard: `https://expo.dev/accounts/[your-username]/projects/[your-slug]/builds`

**When complete, you'll see:**
```
✔ Build successful!
https://expo.dev/accounts/[username]/projects/[slug]/builds/[build-id]
```

**Save this URL** - you can download the `.ipa` file from here if needed.

---

### Step 6: Submit to TestFlight

Once the build completes, submit it to TestFlight:

```bash
eas submit --platform ios
```

**You'll be prompted for:**

1. **Apple ID**: Your Apple Developer account email
2. **App-specific password**: 
   - Create one at [appleid.apple.com](https://appleid.apple.com)
   - Go to "Security" → "App-Specific Passwords"
   - Generate new password
   - Use it for this submission (you can reuse it)
3. **Apple Team ID**:
   - Found in Apple Developer account at [developer.apple.com](https://developer.apple.com/account)
   - Click on "Membership" in the sidebar
   - Copy the "Team ID"

**Submission Process:**

EAS will:
1. Download your build
2. Upload to App Store Connect via Transporter API
3. Initiate TestFlight processing

**Alternative: Manual Submission**

If automatic submission fails, you can submit manually:

1. Download the `.ipa` file from the EAS build page
2. Open **Transporter** app (comes with Xcode, or download from Mac App Store)
3. Drag and drop the `.ipa` file into Transporter
4. Click **"Deliver"**
5. Wait for upload to complete

---

### Step 7: Configure TestFlight

After submission, configure your TestFlight settings:

1. **Go to App Store Connect**
   - Navigate to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Select your app

2. **Navigate to TestFlight Tab**
   - Click on the **"TestFlight"** tab at the top

3. **Wait for Processing**
   - Status will show "Processing" initially
   - Typically takes 5-30 minutes
   - You'll receive an email when processing is complete
   - Refresh the page to see status updates

4. **Once Processed:**
   - Click on your build (shows version and build number)
   - Add **"What to Test"** notes for testers
     - Describe new features
     - Highlight areas needing testing
     - Note any known issues
   
5. **Export Compliance** (First Build Only)
   - Required for all iOS apps
   - Click **"Provide Export Compliance Information"**
   - Answer the questions:
     - **"Does your app use encryption?"**
       - For this app: Select **"No"** (unless you modified encryption)
       - The app uses standard HTTPS (exempt from declaration)
     - Follow the wizard if you need to declare encryption
   - Click **"Start Internal Testing"** when complete

---

### Step 8: Add Testers

TestFlight supports two types of testing groups:

#### Internal Testing (Recommended for Initial Testing)

**Limits**: Up to 100 testers, instant access

1. Go to **TestFlight** → **Internal Testing**
2. Click **"+"** next to "Internal Testers"
3. Add testers by email:
   - Enter email addresses
   - Testers must have an Apple ID
   - Testers must be added to your App Store Connect team first
4. Click **"Add"**
5. Testers receive email invitations immediately

**To add team members:**
- Go to **Users and Access** in App Store Connect
- Click **"+"** to add new user
- Assign "App Manager" or "Developer" role
- They can now be added as internal testers

#### External Testing (For Broader Beta Testing)

**Limits**: Up to 10,000 testers, requires Apple review (24-48 hours)

1. Go to **TestFlight** → **External Testing**
2. Click **"+"** to create a new group
3. Give the group a name (e.g., "Beta Testers")
4. Add your build to the group
5. Add testers:
   - **By Email**: Enter email addresses
   - **Public Link**: Create a public link anyone can use
6. Submit for **Beta App Review**:
   - Required before external testers can access
   - Takes 24-48 hours
   - Apple reviews for basic functionality and policy compliance

---

### Step 9: Install TestFlight App

Instruct your testers to:

1. **Install TestFlight**
   - Download **TestFlight** from the App Store
   - It's a free app from Apple

2. **Accept Invitation**
   - Open the invitation email
   - Click **"View in TestFlight"** or **"Start Testing"**
   - This opens the TestFlight app

3. **Install Your App**
   - Tap **"Install"** in TestFlight
   - Wait for download to complete
   - App appears on home screen

4. **Launch and Test**
   - Open the app
   - Test features
   - Report issues via TestFlight

**Providing Feedback:**
Testers can:
- Submit feedback via TestFlight app
- Take screenshots that include metadata
- Report crashes (automatically sent to you)

---

### Quick Deployment Script

For faster subsequent deployments, use the included script:

```bash
./build_and_publish
```

This script automatically:
- Increments build number
- Builds for iOS
- Submits to TestFlight
- Handles common errors
- Shows progress and status

**Before using:**
- Make it executable: `chmod +x build_and_publish`
- Review the script to understand what it does
- Ensure all credentials are configured

---

## Updating Your TestFlight Build

When you want to release a new version:

### 1. Update Version Number

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.1.0"  // Increment from 1.0.0
  }
}
```

**Version Numbering:**
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

### 2. Build and Submit

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### 3. Add Release Notes

In App Store Connect:
1. Go to TestFlight → Your Build
2. Click **"Test Details"**
3. Add "What's New" notes describing changes
4. Save

Testers will see these notes when the update is available.

### 4. Notify Testers

TestFlight automatically notifies testers when a new build is available. You can also:
- Send an email announcement
- Post in your testing group chat
- Add release notes to the build

---

## Troubleshooting

### Build Failures

#### Issue: "Bundle identifier already exists"

**Cause**: Another app is using your bundle identifier.

**Solution**: 
```json
// Change bundleIdentifier in app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp2"
    }
  }
}
```

Make sure to update App Store Connect with the new bundle ID.

---

#### Issue: "No provisioning profile found"

**Cause**: EAS couldn't create or find provisioning profiles.

**Solution**:
1. Ensure you're logged in: `eas login`
2. Verify Apple Developer account connection: `eas credentials`
3. Reset credentials:
   ```bash
   eas credentials
   # Select "iOS" → "Remove all credentials" → Try build again
   ```
4. Let EAS manage credentials (recommended)

---

#### Issue: "Invalid code signing"

**Cause**: Code signing certificates are misconfigured.

**Solution**:
```bash
eas credentials
# Select "iOS" → "Distribution Certificate" → "Remove" → "Create new"
```

Let EAS manage all certificates and provisioning profiles.

---

#### Issue: "Build failed with unknown error"

**Solutions:**
1. **Check build logs**: `eas build:view [build-id]`
2. **Clean cache and retry**:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```
3. **Verify app.json syntax** (JSON must be valid)
4. **Check dependencies**: `npm install` to ensure all packages are installed
5. **Review EAS forums**: [expo.dev/eas](https://expo.dev/eas)

---

### Submission Failures

#### Issue: "Invalid App Store Connect API Key"

**Cause**: Authentication failed.

**Solution**:
1. Create app-specific password at [appleid.apple.com](https://appleid.apple.com)
2. Go to Security → App-Specific Passwords → Generate
3. Use this password (not your regular password) when prompted by EAS

---

#### Issue: "Export compliance missing"

**Cause**: Export compliance not filled out in App Store Connect.

**Solution**:
1. Go to App Store Connect
2. TestFlight → Your Build → "Provide Export Compliance Information"
3. Answer encryption questions
4. For this app, typically answer **"No"**

---

#### Issue: "Build rejected during TestFlight processing"

**Causes**: Various compliance issues.

**Solution**:
1. Check email from Apple for specific reason
2. Common issues:
   - Missing privacy descriptions in `Info.plist`
   - Broken binary
   - Metadata issues
3. Fix issue and resubmit

---

### TestFlight Processing Issues

#### Issue: Processing takes forever

**Normal timing**: 5-30 minutes

**If stuck for > 1 hour:**
1. Check App Store Connect for error messages
2. Check email for compliance issues from Apple
3. Try refreshing the TestFlight page
4. Contact Apple Developer Support if no error after 24 hours

---

#### Issue: Build appears but can't install

**Solutions:**
1. Ensure tester's email matches their Apple ID
2. Verify tester accepted the invitation
3. Check tester's device iOS version is compatible
4. Remove and re-add tester

---

### App Crashes on TestFlight

#### Debugging crashes:

1. **Check version**: Ensure tester has the correct version
2. **Review crash logs**:
   - App Store Connect → TestFlight → Build → Crashes
   - Download crash logs for analysis
3. **Test locally first**:
   ```bash
   npm run ios
   ```
4. **Check Expo logs**: Visit your build page for runtime logs
5. **Add more logging**: Use `console.log()` to track issues

#### Common crash causes:
- Missing native dependencies
- API endpoint issues
- Unhandled promise rejections
- Memory issues on older devices

---

### Network and Connectivity Issues

#### Issue: "Can't connect to EAS servers"

**Solutions:**
1. Check internet connection
2. Try different network (disable VPN)
3. Check Expo status: [status.expo.dev](https://status.expo.dev)
4. Wait and retry (temporary server issues)

---

## Common Commands Reference

### Build Commands

```bash
# Build for iOS (production)
eas build --platform ios --profile production

# Build for iOS (development)
eas build --platform ios --profile development

# Build with clean cache
eas build --platform ios --clear-cache

# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Cancel a running build
eas build:cancel

# View build logs
eas build:view [build-id] --logs
```

### Submission Commands

```bash
# Submit to TestFlight
eas submit --platform ios

# Check submission status
eas submit:list

# Submit specific build
eas submit --platform ios --id [build-id]
```

### Credentials Commands

```bash
# Manage credentials
eas credentials

# View current credentials
eas credentials --list

# Remove all credentials (fresh start)
eas credentials --clear
```

### Project Commands

```bash
# Check logged-in user
eas whoami

# Login to Expo
eas login

# Logout
eas logout

# View project info
eas project:info

# Initialize EAS in project
eas init
```

### Debugging Commands

```bash
# View detailed build logs
eas build:view [build-id] --logs

# Check configuration
eas config

# Validate eas.json
eas build --platform ios --dry-run
```

---

## Best Practices

### Before Building

- ✅ Test locally on simulator: `npm run ios`
- ✅ Run linter: `npm run lint`
- ✅ Run type checker: `npm run type-check`
- ✅ Update version number in `app.json`
- ✅ Test on physical device if possible
- ✅ Review recent changes

### During Testing

- ✅ Add detailed "What to Test" notes
- ✅ Start with internal testers
- ✅ Collect feedback systematically
- ✅ Monitor crash reports
- ✅ Respond to tester feedback quickly

### Before Full Release

- ✅ Complete thorough testing cycle
- ✅ Fix all critical bugs
- ✅ Optimize performance
- ✅ Prepare App Store metadata
- ✅ Create app screenshots
- ✅ Write app description
- ✅ Submit for App Store Review

---

## Resources

### Official Documentation

- **Expo EAS Build**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **Expo EAS Submit**: [docs.expo.dev/submit/introduction](https://docs.expo.dev/submit/introduction/)
- **Apple TestFlight**: [developer.apple.com/testflight](https://developer.apple.com/testflight/)
- **App Store Connect**: [help.apple.com/app-store-connect](https://help.apple.com/app-store-connect/)

### Community Support

- **Expo Forums**: [forums.expo.dev](https://forums.expo.dev)
- **Expo Discord**: [chat.expo.dev](https://chat.expo.dev)
- **Stack Overflow**: Tag `expo` or `react-native`

### Tools

- **Transporter**: [apps.apple.com/us/app/transporter](https://apps.apple.com/us/app/transporter/id1450874784)
- **Expo Build Dashboard**: [expo.dev/accounts/[username]/builds](https://expo.dev)
- **App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

---

## Next Steps

After successful TestFlight deployment:

1. **Gather Feedback**: Collect tester feedback and bug reports
2. **Iterate**: Fix issues and add features
3. **Update Regularly**: Release new TestFlight builds frequently
4. **Prepare for Release**: When ready, submit to App Store Review
5. **Marketing**: Prepare App Store listing, screenshots, and promotional materials

For questions or issues not covered here, please check the [GitHub repository](https://github.com/yourusername/hyperliquid-mobile-companion) or file an issue.

---

**Good luck with your deployment! 🚀**

