from fastapi import APIRouter
from app.threat_intel.cve_nvd import nvd_client
from app.threat_intel.cisa_kev import cisa_client
from app.threat_intel.mitre_attack import mitre_client

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence Feeds"])

@router.get("/cve/{cve_id}")
def get_cve_intel(cve_id: str):
    details = nvd_client.get_cve_details(cve_id)
    kev = cisa_client.lookup_cve(cve_id)
    return {
        "cve": details,
        "cisa_kev": kev
    }

@router.get("/cisa-kev")
def get_cisa_kev(limit: int = 50):
    return cisa_client.get_all_vulnerabilities(limit=limit)

@router.get("/mitre-attack")
def get_mitre_attack_info():
    return {
        "tactics": mitre_client.get_tactics(),
        "techniques": mitre_client.get_techniques(),
        "threat_actors": mitre_client.get_threat_actors()
    }
