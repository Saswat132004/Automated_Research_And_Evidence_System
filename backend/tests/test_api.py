import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)

def test_system_health():
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "vector_index" in data

def test_threat_intel_endpoints():
    res = client.get("/api/v1/threat-intel/cve/CVE-2021-44228")
    assert res.status_code == 200
    data = res.json()
    assert data["cve"]["cve_id"] == "CVE-2021-44228"

    kev_res = client.get("/api/v1/threat-intel/cisa-kev")
    assert kev_res.status_code == 200
    assert len(kev_res.json()) > 0

    mitre_res = client.get("/api/v1/threat-intel/mitre-attack")
    assert mitre_res.status_code == 200
    assert "tactics" in mitre_res.json()

def test_evaluation_benchmark():
    res = client.get("/api/v1/evaluation/latest")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "recall_at_k" in data["metrics"]
