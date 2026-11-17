import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst")  # analyst, researcher, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    sessions = relationship("ResearchSession", back_populates="user", cascade="all, delete-orphan")


class ResearchSession(Base):
    __tablename__ = "research_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    query_type = Column(String, default="incident_investigation")  # vulnerability, threat_actor, incident, malware, compliance
    status = Column(String, default="pending")  # pending, analyzing, planning, executing, synthesizing, verifying, completed, failed
    depth = Column(String, default="comprehensive")  # quick, standard, comprehensive, deep
    target_sources = Column(JSON, default=list)  # ["nvd", "mitre", "cisa", "local_docs"]
    plan = Column(JSON, default=dict)
    findings_summary = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
    tasks = relationship("ResearchTask", back_populates="session", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="session", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="session", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="session", cascade="all, delete-orphan")
    reports = relationship("ResearchReport", back_populates="session", cascade="all, delete-orphan")
    logs = relationship("AgentExecutionLog", back_populates="session", cascade="all, delete-orphan")


class ResearchTask(Base):
    __tablename__ = "research_tasks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    agent_type = Column(String, nullable=False)  # query_analyzer, planner, cve_researcher, mitre_agent, doc_agent, verifier
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, running, completed, failed
    priority = Column(Integer, default=1)
    results = Column(JSON, default=dict)
    execution_time_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    session = relationship("ResearchSession", back_populates="tasks")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt, md
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256_hash = Column(String, index=True)
    doc_metadata = Column(JSON, default=dict)
    chunk_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding_index = Column(Integer, nullable=True)
    chunk_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("Document", back_populates="chunks")
    evidence_items = relationship("Evidence", back_populates="chunk")


class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    chunk_id = Column(String, ForeignKey("document_chunks.id"), nullable=True)
    passage = Column(Text, nullable=False)
    source_type = Column(String, nullable=False)  # local_doc, cve_nvd, mitre_attack, cisa_kev, web
    source_name = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    credibility_score = Column(Float, default=0.85)  # 0.0 - 1.0 based on authority & verification
    relevance_score = Column(Float, default=0.0)
    freshness_date = Column(String, nullable=True)
    citation_id = Column(String, nullable=False)  # e.g. [ARES-CIT-1]
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ResearchSession", back_populates="evidence")
    chunk = relationship("DocumentChunk", back_populates="evidence_items")


class Source(Base):
    __tablename__ = "sources"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    source_type = Column(String, nullable=False)  # api, advisory, standard, repository
    url = Column(String, nullable=True)
    reliability_rating = Column(Float, default=0.9)
    is_authorized = Column(Boolean, default=True)
    last_synced = Column(DateTime, nullable=True)


class Entity(Base):
    __tablename__ = "entities"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)  # THREAT_ACTOR, CVE, MALWARE, TACTIC, TOOL, TARGET, VULNERABILITY
    confidence = Column(Float, default=0.9)
    metadata_json = Column(JSON, default=dict)
    
    session = relationship("ResearchSession", back_populates="entities")


class Relationship(Base):
    __tablename__ = "relationships"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    source_entity = Column(String, nullable=False)
    target_entity = Column(String, nullable=False)
    relation_type = Column(String, nullable=False)  # EXPLOITS, ATTRIBUTED_TO, TARGETS, USES_TOOL, MITIGATES
    weight = Column(Float, default=1.0)
    evidence_citation = Column(String, nullable=True)
    
    session = relationship("ResearchSession", back_populates="relationships")


class ResearchReport(Base):
    __tablename__ = "research_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    title = Column(String, nullable=False)
    executive_summary = Column(Text, nullable=False)
    content_markdown = Column(Text, nullable=False)
    pdf_path = Column(String, nullable=True)
    verification_score = Column(Float, default=1.0)
    unsupported_claims_count = Column(Integer, default=0)
    citations_count = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ResearchSession", back_populates="reports")


class AgentExecutionLog(Base):
    __tablename__ = "agent_execution_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("research_sessions.id"), nullable=False)
    task_id = Column(String, nullable=True)
    agent_name = Column(String, nullable=False)
    step = Column(String, nullable=False)
    log_level = Column(String, default="INFO")  # INFO, WARNING, ERROR, SUCCESS
    message = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ResearchSession", back_populates="logs")
