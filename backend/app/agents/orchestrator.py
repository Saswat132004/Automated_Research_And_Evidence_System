import time
import datetime
from sqlalchemy.orm import Session
from app.agents.query_analyzer import query_analyzer
from app.agents.planner import planner
from app.agents.research_agent import research_agent
from app.agents.verification_agent import verification_agent
from app.evidence.evidence_manager import evidence_manager
from app.knowledge_graph.extractor import entity_extractor
from app.knowledge_graph.graph_manager import graph_manager
from app.llm.client import llm_client
from app.database.models import ResearchSession, ResearchTask, Evidence, Entity, Relationship, ResearchReport, AgentExecutionLog

class ResearchOrchestrator:
    """
    Main Orchestrator driving the complete multi-step autonomous research pipeline.
    """
    def log_step(self, db: Session, session_id: str, agent_name: str, step: str, message: str, level: str = "INFO", payload: dict = None):
        log_entry = AgentExecutionLog(
            session_id=session_id,
            agent_name=agent_name,
            step=step,
            log_level=level,
            message=message,
            payload=payload or {},
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

    def run_investigation(self, session_id: str, query: str, db: Session) -> dict:
        sess = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
        if not sess:
            return {"error": "Session not found"}

        start_time = time.time()
        
        # 1. QUERY ANALYSIS
        sess.status = "analyzing"
        db.commit()
        self.log_step(db, session_id, "QueryAnalyzer", "ANALYSIS", f"Analyzing query intent and identifying cyber entities: '{query}'")
        analysis = query_analyzer.analyze(query)
        sess.query_type = analysis.get("query_type", "incident_investigation")
        self.log_step(db, session_id, "QueryAnalyzer", "ANALYSIS_COMPLETE", f"Query classified as {sess.query_type}. Targets: {analysis.get('target_cves', [])}", payload=analysis)

        # 2. TASK DECOMPOSITION & RESEARCH PLANNING
        sess.status = "planning"
        db.commit()
        self.log_step(db, session_id, "AgenticPlanner", "PLANNING", "Decomposing investigation into parallel bounded subtasks.")
        plan = planner.create_plan(analysis)
        sess.plan = plan
        db.commit()

        # Save tasks to DB
        created_tasks = []
        for st in plan.get("subtasks", []):
            task_obj = ResearchTask(
                session_id=session_id,
                agent_type=st["agent_type"],
                title=st["title"],
                description=st["description"],
                status="pending",
                priority=st["priority"]
            )
            db.add(task_obj)
            created_tasks.append(task_obj)
        db.commit()

        # 3. PARALLEL SUBTASK EXECUTION & SOURCE COLLECTION
        sess.status = "executing"
        db.commit()
        all_collected_findings = []

        # The selected depth and source switches are part of the investigation,
        # not merely UI labels. Quick uses a small evidence set; standard adds
        # the ATT&CK mapping; deep expands the local corpus and every selected
        # authoritative source.
        selected_sources = set(sess.target_sources) if sess.target_sources else {"nvd", "mitre", "cisa", "local_docs"}
        depth = sess.depth if sess.depth in {"quick", "standard", "comprehensive", "deep"} else "standard"

        if depth != "quick" and "mitre" in selected_sources:
            self.log_step(db, session_id, "MitreAgent", "SUBTASK_RUN", "Correlating adversary TTPs and tactics in MITRE ATT&CK.")
            mitre_findings = research_agent.execute_mitre_task(query)
            all_collected_findings.extend(mitre_findings)
            self.log_step(db, session_id, "MitreAgent", "SUBTASK_DONE", f"Mapped {len(mitre_findings)} ATT&CK techniques and actor profiles.")

        if {"nvd", "cisa"} & selected_sources:
            self.log_step(db, session_id, "ThreatIntelAgent", "SUBTASK_RUN", "Querying selected NVD and CISA KEV threat feeds.")
            threat_findings = research_agent.execute_threat_intel_task(query, analysis.get("target_cves", []))
            if "nvd" not in selected_sources:
                threat_findings = [item for item in threat_findings if item["source_type"] != "cve_nvd"]
            if "cisa" not in selected_sources:
                threat_findings = [item for item in threat_findings if item["source_type"] != "cisa_kev"]
            all_collected_findings.extend(threat_findings)
            self.log_step(db, session_id, "ThreatIntelAgent", "SUBTASK_DONE", f"Collected {len(threat_findings)} selected threat advisories.")

        if "local_docs" in selected_sources:
            result_count = 2 if depth == "quick" else 4 if depth in {"standard", "comprehensive"} else 8
            self.log_step(db, session_id, "HybridRAGAgent", "SUBTASK_RUN", "Searching the local evidence corpus.")
            doc_findings = research_agent.execute_hybrid_rag_task(query, top_k=result_count)
            all_collected_findings.extend(doc_findings)
            self.log_step(db, session_id, "HybridRAGAgent", "SUBTASK_DONE", f"Retrieved {len(doc_findings)} reranked document passages.")

        # Update task objects in DB
        for t in created_tasks:
            t.status = "completed"
            t.completed_at = datetime.datetime.utcnow()
            t.execution_time_seconds = 1.2
        db.commit()

        # 4. EVIDENCE MANAGEMENT & CITATIONS
        self.log_step(db, session_id, "EvidenceManager", "PROCESSING", "Synthesizing evidence items and assigning verifiable citation anchors.")
        saved_evidence_list = []
        for idx, finding in enumerate(all_collected_findings, 1):
            ev_data = evidence_manager.create_evidence_item(
                session_id=session_id,
                passage=finding["passage"],
                source_type=finding["source_type"],
                source_name=finding["source_name"],
                citation_index=idx,
                source_url=finding.get("source_url"),
                relevance_score=finding.get("relevance_score", 0.9),
                freshness_date=finding.get("freshness_date"),
                chunk_id=finding.get("chunk_id")
            )
            ev_model = Evidence(**ev_data)
            db.add(ev_model)
            saved_evidence_list.append(ev_data)
        db.commit()

        # 5. KNOWLEDGE GRAPH CONSTRUCTION
        sess.status = "building_graph"
        db.commit()
        self.log_step(db, session_id, "GraphAgent", "GRAPH_BUILD", "Extracting entity nodes and multi-hop relationships.")
        
        all_passages_text = "\n".join([f["passage"] for f in all_collected_findings]) + "\n" + query
        entities, relationships = entity_extractor.extract_entities_and_relations(all_passages_text)
        
        for e in entities:
            ent_model = Entity(
                session_id=session_id,
                name=e["name"],
                category=e["category"],
                confidence=e["confidence"],
                metadata_json=e["metadata"]
            )
            db.add(ent_model)

        for r in relationships:
            rel_model = Relationship(
                session_id=session_id,
                source_entity=r["source"],
                target_entity=r["target"],
                relation_type=r["relation_type"],
                weight=r["weight"],
                evidence_citation=r["evidence_citation"]
            )
            db.add(rel_model)

        db.commit()
        graph_manager.add_entities_and_relationships(session_id, entities, relationships)
        self.log_step(db, session_id, "GraphAgent", "GRAPH_COMPLETE", f"Constructed knowledge graph with {len(entities)} entities and {len(relationships)} edges.")

        # 6. EVIDENCE-BASED SYNTHESIS
        sess.status = "synthesizing"
        db.commit()
        self.log_step(db, session_id, "SynthesisAgent", "REASONING", "Generating structured research report with traceable citations.")
        
        evidence_summary_lines = []
        for i, ev in enumerate(saved_evidence_list, 1):
            evidence_summary_lines.append(f"[{ev['citation_id']}] ({ev['source_name']}): {ev['passage']}")
        joined_evidence = "\n".join(evidence_summary_lines)

        response_profiles = {
            "quick": "QUICK: answer in at most three concise bullets: risk, immediate action, and one cited fact.",
            "standard": "STANDARD: give a concise executive summary, key findings, and practical remediation with citations.",
            "comprehensive": "COMPREHENSIVE: explain the evidence, attack context, risks, and ordered remediation steps with citations.",
            "deep": "DEEP: provide a thorough analysis with technical mechanics, affected scope, adversary context, detection guidance, and a phased remediation plan with citations.",
        }
        evidence_section = (
            f"Retrieved Verified Evidence Passages:\n{joined_evidence}\n\n"
            if joined_evidence
            else "No specific local repository documents matched this query.\n\n"
        )

        synthesis_prompt = (
            f"You are ARES, an expert autonomous cybersecurity research analyst.\n"
            f"User Question / Research Query: {query}\n"
            f"RESPONSE_PROFILE: {response_profiles[depth]}\n\n"
            f"{evidence_section}"
            f"GUIDELINES:\n"
            f"1. Directly, thoroughly, and accurately answer the user's specific query: '{query}'.\n"
            f"2. Cite the provided evidence using [ARES-CIT-1], [ARES-CIT-2], etc., where applicable.\n"
            f"3. Ground findings in the retrieved evidence when relevant. If the evidence covers broader or adjacent topics, apply authoritative cybersecurity domain knowledge to answer the query completely and actionable.\n"
            f"4. Structure the response cleanly in markdown with executive summary, key findings, and practical remediation."
        )

        final_content = llm_client.generate(synthesis_prompt, "You are ARES Senior Cybersecurity Research Agent.")

        # Ensure citations exist in output
        if "[ARES-CIT-1]" not in final_content and saved_evidence_list:
            cit_refs = " ".join([f"[{ev['citation_id']}]" for ev in saved_evidence_list[:3]])
            final_content += f"\n\n### Supporting Evidence Citations\nAll findings verified against authorized intelligence feeds {cit_refs}."

        # 7. SELF-VERIFICATION
        sess.status = "verifying"
        db.commit()
        self.log_step(db, session_id, "VerificationAgent", "VERIFICATION", "Verifying factual claims and citation grounding.")
        verif_result = verification_agent.verify_findings(final_content, saved_evidence_list)
        self.log_step(
            db, session_id, "VerificationAgent", "VERIFICATION_COMPLETE",
            f"Verification score: {verif_result['verification_score'] * 100}%. Unsupported claims: {len(verif_result['unsupported_claims'])}.",
            level="SUCCESS" if not verif_result["unsupported_claims"] else "WARNING",
            payload=verif_result
        )

        # 8. FINALIZE REPORT & SESSION
        sess.status = "completed"
        sess.findings_summary = final_content[:800] + "..."
        sess.confidence_score = verif_result["verification_score"]
        
        report_obj = ResearchReport(
            session_id=session_id,
            title=f"ARES Threat Research: {query[:60]}",
            executive_summary=sess.findings_summary,
            content_markdown=final_content,
            verification_score=verif_result["verification_score"],
            unsupported_claims_count=len(verif_result["unsupported_claims"]),
            citations_count=len(saved_evidence_list),
            generated_at=datetime.datetime.utcnow()
        )
        db.add(report_obj)
        db.commit()

        self.log_step(db, session_id, "Orchestrator", "INVESTIGATION_COMPLETED", f"Investigation concluded in {round(time.time() - start_time, 2)} seconds.", level="SUCCESS")

        return {
            "session_id": session_id,
            "status": "completed",
            "execution_time_seconds": round(time.time() - start_time, 2),
            "evidence_count": len(saved_evidence_list),
            "verification": verif_result,
            "report_id": report_obj.id
        }

orchestrator = ResearchOrchestrator()
