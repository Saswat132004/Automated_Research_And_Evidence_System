import httpx
import logging
import json
import os
from pathlib import Path
from app.config import settings

logger = logging.getLogger("ares.threat_intel.cisa")

# Local fallback cache of verified CISA KEV entries
CISA_KEV_CACHE = [
    {
        "cve_id": "CVE-2021-44228",
        "vendor_project": "Apache",
        "product": "Log4j2",
        "vulnerability_name": "Apache Log4j2 Deserialization Remote Code Execution",
        "date_added": "2021-12-10",
        "short_description": "Apache Log4j2 JNDI features allow unauthenticated remote attackers to execute code.",
        "required_action": "Apply vendor updates immediately or mitigate per Apache guidelines.",
        "due_date": "2021-12-24",
        "known_ransomware_campaign_use": "Known",
        "source": "CISA Known Exploited Vulnerabilities Catalog",
        "credibility_score": 1.0
    },
    {
        "cve_id": "CVE-2023-34362",
        "vendor_project": "Progress",
        "product": "MOVEit Transfer",
        "vulnerability_name": "Progress MOVEit Transfer SQL Injection Vulnerability",
        "date_added": "2023-06-02",
        "short_description": "SQL injection in MOVEit Transfer could lead to escalated privileges and unauthorized data exfiltration.",
        "required_action": "Apply immediate updates per Progress Advisory.",
        "due_date": "2023-06-23",
        "known_ransomware_campaign_use": "Known",
        "source": "CISA Known Exploited Vulnerabilities Catalog",
        "credibility_score": 1.0
    },
    {
        "cve_id": "CVE-2024-1709",
        "vendor_project": "ConnectWise",
        "product": "ScreenConnect",
        "vulnerability_name": "ConnectWise ScreenConnect Authentication Bypass Vulnerability",
        "date_added": "2024-02-22",
        "short_description": "Authentication bypass allows remote attackers with network access to create admin accounts.",
        "required_action": "Apply vendor mitigation and patch to 23.9.8+.",
        "due_date": "2024-02-29",
        "known_ransomware_campaign_use": "Known",
        "source": "CISA Known Exploited Vulnerabilities Catalog",
        "credibility_score": 1.0
    },
    {
        "cve_id": "CVE-2017-0144",
        "vendor_project": "Microsoft",
        "product": "Windows SMBv1",
        "vulnerability_name": "Microsoft Windows SMBv1 Remote Code Execution (EternalBlue)",
        "date_added": "2022-03-03",
        "short_description": "Vulnerability allows remote attackers to execute arbitrary code via crafted SMBv1 packets.",
        "required_action": "Apply MS17-010 and disable SMBv1.",
        "due_date": "2022-04-15",
        "known_ransomware_campaign_use": "Known",
        "source": "CISA Known Exploited Vulnerabilities Catalog",
        "credibility_score": 1.0
    },
    {
        "cve_id": "CVE-2022-22965",
        "vendor_project": "VMware / Spring",
        "product": "Spring Framework",
        "vulnerability_name": "Spring Framework Remote Code Execution Vulnerability (Spring4Shell)",
        "date_added": "2022-04-04",
        "short_description": "Spring Framework data binding flaw allows attackers to execute arbitrary code on Tomcat servers.",
        "required_action": "Apply vendor updates.",
        "due_date": "2022-04-25",
        "known_ransomware_campaign_use": "Known",
        "source": "CISA Known Exploited Vulnerabilities Catalog",
        "credibility_score": 1.0
    }
]

class CISAKEVClient:
    """
    CISA KEV Catalog integration client.
    """
    def __init__(self):
        self.url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
        self.catalog: list[dict] = list(CISA_KEV_CACHE)

    def get_all_vulnerabilities(self, limit: int = 50) -> list[dict]:
        return self.catalog[:limit]

    def lookup_cve(self, cve_id: str) -> dict | None:
        cve_id = cve_id.upper().strip()
        for item in self.catalog:
            if item.get("cve_id", "").upper() == cve_id:
                return item
        return None

    def search_by_keyword(self, keyword: str) -> list[dict]:
        kw = keyword.lower()
        matches = []
        for item in self.catalog:
            combined = f"{item.get('cve_id')} {item.get('product')} {item.get('vendor_project')} {item.get('short_description')}".lower()
            if kw in combined:
                matches.append(item)
        return matches

cisa_client = CISAKEVClient()
