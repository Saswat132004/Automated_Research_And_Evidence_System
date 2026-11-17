import re

CYBER_KEYWORDS = {
    "MALWARE": ["ransomware", "trojan", "cobalt strike", "mimikatz", "log4shell", "wannacry", "notpetya", "blackcat", "lockbit", "emotet"],
    "THREAT_ACTOR": ["apt28", "apt29", "cozy bear", "fancy bear", "lazarus", "sandworm", "volt typhoon", "cl0p", "lockbit syndicate"],
    "TOOL": ["jndi:ldap", "powershell", "cmd.exe", "curl", "certutil", "screenconnect", "moveit", "log4j"],
    "TACTIC": ["initial access", "execution", "privilege escalation", "defense evasion", "credential dumping", "lateral movement", "c2", "ransomware impact"]
}

class EntityExtractor:
    """
    Extracts structured cybersecurity entities and contextual relationships from unstructured evidence.
    """
    def extract_entities_and_relations(self, text: str, evidence_id: str = "") -> tuple[list[dict], list[dict]]:
        text_lower = text.lower()
        entities = []
        seen_entities = set()

        # 1. Regex CVEs
        cves = list(set(re.findall(r"CVE-\d{4}-\d{4,7}", text, re.IGNORECASE)))
        for cve in cves:
            cve_clean = cve.upper()
            if cve_clean not in seen_entities:
                entities.append({
                    "id": cve_clean,
                    "name": cve_clean,
                    "category": "CVE",
                    "confidence": 1.0,
                    "metadata": {"source": "regex_extract"}
                })
                seen_entities.add(cve_clean)

        # 2. Extract Threat Actors
        for actor in CYBER_KEYWORDS["THREAT_ACTOR"]:
            if actor in text_lower:
                actor_name = actor.title()
                if actor_name not in seen_entities:
                    entities.append({
                        "id": actor_name,
                        "name": actor_name,
                        "category": "THREAT_ACTOR",
                        "confidence": 0.95,
                        "metadata": {"type": "APT / Cybercrime"}
                    })
                    seen_entities.add(actor_name)

        # 3. Extract Malware & Tools
        for mal in CYBER_KEYWORDS["MALWARE"]:
            if mal in text_lower:
                mal_name = mal.title()
                if mal_name not in seen_entities:
                    entities.append({
                        "id": mal_name,
                        "name": mal_name,
                        "category": "MALWARE",
                        "confidence": 0.9,
                        "metadata": {"classification": "Malicious Payload"}
                    })
                    seen_entities.add(mal_name)

        for tool in CYBER_KEYWORDS["TOOL"]:
            if tool in text_lower:
                tool_name = tool.upper() if len(tool) <= 4 else tool.title()
                if tool_name not in seen_entities:
                    entities.append({
                        "id": tool_name,
                        "name": tool_name,
                        "category": "TOOL",
                        "confidence": 0.85,
                        "metadata": {"utility": "Vector / Utility"}
                    })
                    seen_entities.add(tool_name)

        # 4. Extract Tactics
        for tactic in CYBER_KEYWORDS["TACTIC"]:
            if tactic in text_lower:
                tac_name = tactic.title()
                if tac_name not in seen_entities:
                    entities.append({
                        "id": tac_name,
                        "name": tac_name,
                        "category": "TACTIC",
                        "confidence": 0.88,
                        "metadata": {"framework": "MITRE ATT&CK"}
                    })
                    seen_entities.add(tac_name)

        # Build Relationships
        relationships = []
        actors = [e["name"] for e in entities if e["category"] == "THREAT_ACTOR"]
        cve_nodes = [e["name"] for e in entities if e["category"] == "CVE"]
        malware_nodes = [e["name"] for e in entities if e["category"] == "MALWARE"]
        tools = [e["name"] for e in entities if e["category"] == "TOOL"]
        tactics = [e["name"] for e in entities if e["category"] == "TACTIC"]

        # Threat Actor -> CVE
        for a in actors:
            for c in cve_nodes:
                relationships.append({
                    "source": a,
                    "target": c,
                    "relation_type": "EXPLOITS",
                    "weight": 1.0,
                    "evidence_citation": evidence_id
                })

        # Malware -> CVE
        for m in malware_nodes:
            for c in cve_nodes:
                relationships.append({
                    "source": m,
                    "target": c,
                    "relation_type": "LEVERAGES",
                    "weight": 0.9,
                    "evidence_citation": evidence_id
                })

        # CVE -> Tool / Target
        for c in cve_nodes:
            for t in tools:
                relationships.append({
                    "source": c,
                    "target": t,
                    "relation_type": "TARGETS_SERVICE",
                    "weight": 0.85,
                    "evidence_citation": evidence_id
                })

        # Actor -> Tactic
        for a in actors:
            for tac in tactics:
                relationships.append({
                    "source": a,
                    "target": tac,
                    "relation_type": "USES_TACTIC",
                    "weight": 0.8,
                    "evidence_citation": evidence_id
                })

        return entities, relationships

entity_extractor = EntityExtractor()
