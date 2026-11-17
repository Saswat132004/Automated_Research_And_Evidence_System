import re

MITRE_TACTICS = [
    {"id": "TA0001", "name": "Initial Access", "description": "Techniques used to gain an initial foothold within a network."},
    {"id": "TA0002", "name": "Execution", "description": "Techniques that result in adversary-controlled code running on a local or remote system."},
    {"id": "TA0003", "name": "Persistence", "description": "Techniques adversaries use to maintain their access across restarts or changed credentials."},
    {"id": "TA0004", "name": "Privilege Escalation", "description": "Techniques used to gain higher-level permissions on a system or network."},
    {"id": "TA0005", "name": "Defense Evasion", "description": "Techniques used to avoid detection throughout their compromise."},
    {"id": "TA0006", "name": "Credential Access", "description": "Techniques for stealing credentials like account names and passwords."},
    {"id": "TA0007", "name": "Discovery", "description": "Techniques an adversary may use to gain knowledge about the system and internal network."},
    {"id": "TA0008", "name": "Lateral Movement", "description": "Techniques adversaries use to enter and control remote systems on a network."},
    {"id": "TA0011", "name": "Command and Control", "description": "Techniques adversaries use to communicate with systems under their control."},
    {"id": "TA0010", "name": "Exfiltration", "description": "Techniques used to steal data from your network."},
    {"id": "TA0040", "name": "Impact", "description": "Techniques used to disrupt availability or compromise integrity."}
]

MITRE_TECHNIQUES = [
    {
        "id": "T1190",
        "tactic": "Initial Access",
        "name": "Exploit Public-Facing Application",
        "description": "Adversaries may attempt to exploit a vulnerability in an Internet-facing computer or program using software flaws, bugs, or misconfigurations.",
        "detection": "Monitor application logs for anomalous process spawns and suspicious inbound web requests."
    },
    {
        "id": "T1059",
        "tactic": "Execution",
        "name": "Command and Scripting Interpreter",
        "description": "Adversaries may abuse command and script interpreters (PowerShell, Bash, Python, Windows Command Shell) to execute commands.",
        "detection": "Enable PowerShell script block logging and command line process auditing (Event ID 4688)."
    },
    {
        "id": "T1078",
        "tactic": "Defense Evasion / Initial Access",
        "name": "Valid Accounts",
        "description": "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, or Privilege Escalation.",
        "detection": "Audit anomalous login times, geolocation anomalies, and impossible travel."
    },
    {
        "id": "T1003",
        "tactic": "Credential Access",
        "name": "OS Credential Dumping",
        "description": "Adversaries may attempt to dump credentials from memory (e.g., LSASS) or file storage.",
        "detection": "Monitor process access to LSASS and block unauthorized handles using Credential Guard."
    },
    {
        "id": "T1486",
        "tactic": "Impact",
        "name": "Data Encrypted for Impact",
        "description": "Adversaries may encrypt data on target systems or within the network to interrupt availability to system and network resources.",
        "detection": "Monitor sudden mass file rename/modification bursts and rapid shadow copy deletion."
    },
    {
        "id": "T1071",
        "tactic": "Command and Control",
        "name": "Application Layer Protocol",
        "description": "Adversaries may communicate using application layer protocols (HTTP, HTTPS, DNS) to blend into existing network traffic.",
        "detection": "Inspect TLS certificates, detect beaconing intervals, and analyze DNS query volume."
    },
    {
        "id": "T1021",
        "tactic": "Lateral Movement",
        "name": "Remote Services (SMB/RDP)",
        "description": "Adversaries may use valid accounts to log into a service that accepts remote connections such as SMB, SSH, or RDP.",
        "detection": "Correlate network connection logs with administrative logon sessions."
    }
]

THREAT_ACTORS = [
    {
        "name": "APT29 (Cozy Bear)",
        "origin": "Russian Federation",
        "target_sectors": ["Government", "Think Tanks", "Defense", "Cloud Providers"],
        "known_ttps": ["T1190", "T1078", "T1059", "T1071"],
        "associated_cves": ["CVE-2023-34362", "CVE-2021-44228"]
    },
    {
        "name": "APT28 (Fancy Bear)",
        "origin": "Russian Federation",
        "target_sectors": ["Military", "Elections", "Aerospace"],
        "known_ttps": ["T1190", "T1003", "T1059"],
        "associated_cves": ["CVE-2017-0144"]
    },
    {
        "name": "Lazarus Group",
        "origin": "Democratic People's Republic of Korea",
        "target_sectors": ["Financial Services", "Cryptocurrency", "Critical Infrastructure"],
        "known_ttps": ["T1190", "T1486", "T1059", "T1071"],
        "associated_cves": ["CVE-2021-44228", "CVE-2017-0144"]
    },
    {
        "name": "LockBit Syndicate",
        "origin": "Financially Motivated Cybercrime",
        "target_sectors": ["Healthcare", "Manufacturing", "Education", "Government"],
        "known_ttps": ["T1190", "T1486", "T1078", "T1021"],
        "associated_cves": ["CVE-2024-1709", "CVE-2023-34362"]
    },
    {
        "name": "Volt Typhoon",
        "origin": "People's Republic of China",
        "target_sectors": ["Critical Infrastructure", "Telecommunications", "Energy"],
        "known_ttps": ["T1190", "T1078", "T1059"],
        "associated_cves": ["CVE-2024-1709", "CVE-2022-22965"]
    }
]

class MitreAttackClient:
    """
    MITRE ATT&CK framework navigator and threat mapper.
    """
    def get_tactics(self):
        return MITRE_TACTICS

    def get_techniques(self):
        return MITRE_TECHNIQUES

    def get_threat_actors(self):
        return THREAT_ACTORS

    def map_query_to_mitre(self, query: str) -> dict:
        q_lower = query.lower()
        matched_techniques = []
        matched_actors = []

        for tech in MITRE_TECHNIQUES:
            t_id = tech["id"].lower()
            t_name = tech["name"].lower()
            if t_id in q_lower or t_name in q_lower:
                matched_techniques.append(tech)
            elif "rce" in q_lower and tech["id"] in ["T1190", "T1059"]:
                matched_techniques.append(tech)
            elif "ransomware" in q_lower and tech["id"] in ["T1486", "T1078"]:
                matched_techniques.append(tech)

        for actor in THREAT_ACTORS:
            if actor["name"].lower() in q_lower or any(syn in q_lower for syn in ["cozy bear", "fancy bear", "lazarus", "lockbit", "volt typhoon"]):
                if actor not in matched_actors:
                    matched_actors.append(actor)

        # Ensure default mapping if general query
        if not matched_techniques:
            matched_techniques = [MITRE_TECHNIQUES[0], MITRE_TECHNIQUES[1]]
        if not matched_actors:
            matched_actors = [THREAT_ACTORS[0]]

        return {
            "matched_techniques": matched_techniques,
            "matched_actors": matched_actors,
            "tactics": MITRE_TACTICS
        }

mitre_client = MitreAttackClient()
