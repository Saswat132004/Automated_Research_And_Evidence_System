# Security Advisory: ConnectWise ScreenConnect Authentication Bypass
**Reference: ARES-SEC-2024-001 | CVE-2024-1709 & CVE-2024-1708**

## Vulnerability Summary
ConnectWise ScreenConnect versions 23.9.7 and prior contain a critical authentication bypass flaw tracked as CVE-2024-1709 (CVSS 10.0 Critical). An unauthenticated remote attacker can access the initial setup wizard (`SetupWizard.aspx`) on already configured servers by passing an alternate request path.

## Attack Vector
By accessing `https://target:8040/SetupWizard.aspx/anything`, the server bypasses authorization checks and permits the user to create a new administrator account. Once administrative access is established, adversaries utilize ScreenConnect's built-in command execution and extensions feature to upload malicious `.dll` or `.ashx` payloads (CVE-2024-1708 path traversal), executing system commands as `SYSTEM` or `root`.

## Observed Threat Campaigns
Within 48 hours of public disclosure, ransomware groups including LockBit and BlackCat/ALPHV leveraged the bypass to deploy encryptors across managed service provider (MSP) client networks.

## Remediation Steps
1. Upgrade immediately to ScreenConnect version 23.9.8 or later.
2. For on-premise deployments that cannot be immediately updated, restrict access to port 8040 and 8041 to trusted management subnets only.
3. Review audit logs for rogue administrative accounts created via `SetupWizard.aspx`.
