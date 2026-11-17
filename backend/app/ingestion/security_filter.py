import ipaddress
import os
import re
from urllib.parse import urlparse
from fastapi import HTTPException
from app.config import settings

class SecurityFilter:
    """
    Guards ARES against SSRF, directory traversal, malicious files, and unauthorized execution.
    """
    BLOCKED_IP_NETWORKS = [
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("169.254.0.0/16"),  # Cloud metadata / link local
        ipaddress.ip_network("::1/128"),
        ipaddress.ip_network("fc00::/7"),
    ]

    @classmethod
    def validate_upload_file(cls, filename: str, file_size: int):
        # 1. Check file size
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB."
            )

        # 2. Prevent directory traversal
        sanitized = os.path.basename(filename)
        if sanitized != filename or ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid file name: directory traversal detected.")

        # 3. Check allowed extensions
        ext = os.path.splitext(filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

    @classmethod
    def validate_url(cls, url: str) -> str:
        """
        Guards against SSRF and internal network probing.
        """
        parsed = urlparse(url)
        if parsed.scheme.lower() not in settings.ALLOWED_SCHEMES:
            raise HTTPException(status_code=400, detail="Disallowed URL scheme. Only HTTP and HTTPS are permitted.")

        hostname = parsed.hostname
        if not hostname:
            raise HTTPException(status_code=400, detail="Invalid URL hostname.")

        # Check for IP address targeting private networks
        try:
            ip = ipaddress.ip_address(hostname)
            for net in cls.BLOCKED_IP_NETWORKS:
                if ip in net:
                    raise HTTPException(status_code=403, detail="SSRF protection: Private/loopback IPs are blocked.")
        except ValueError:
            # It is a domain name
            pass

        # Check against allowed domains or general internet access
        # If domain allowlist is active, enforce:
        allowed = any(hostname.lower() == domain or hostname.lower().endswith("." + domain) for domain in settings.ALLOWED_DOMAINS)
        if not allowed:
            # Allow common academic / cybersecurity repositories
            if not any(token in hostname.lower() for token in ["gov", "edu", "org", "nist", "mitre", "cve"]):
                raise HTTPException(
                    status_code=403,
                    detail=f"Domain '{hostname}' is not in the approved threat intelligence research allowlist."
                )

        return url

    @classmethod
    def sanitize_query(cls, query: str) -> str:
        # Prevent prompt injection markers and excessive whitespace
        clean = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", query)
        return clean.strip()[:1000]

security_filter = SecurityFilter()
