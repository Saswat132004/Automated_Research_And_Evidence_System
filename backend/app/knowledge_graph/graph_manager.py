import networkx as nx

class KnowledgeGraphManager:
    """
    Constructs and analyzes cybersecurity knowledge graphs using NetworkX.
    """
    def __init__(self):
        self.graphs: dict[str, nx.DiGraph] = {}

    def get_or_create_graph(self, session_id: str) -> nx.DiGraph:
        if session_id not in self.graphs:
            self.graphs[session_id] = nx.DiGraph()
        return self.graphs[session_id]

    def add_entities_and_relationships(self, session_id: str, entities: list[dict], relationships: list[dict]):
        g = self.get_or_create_graph(session_id)

        for ent in entities:
            node_id = ent.get("id") or ent.get("name")
            g.add_node(
                node_id,
                name=ent.get("name"),
                category=ent.get("category", "ENTITY"),
                confidence=ent.get("confidence", 0.9),
                metadata=ent.get("metadata", {})
            )

        for rel in relationships:
            src = rel.get("source")
            tgt = rel.get("target")
            if src and tgt:
                g.add_edge(
                    src,
                    tgt,
                    relation_type=rel.get("relation_type", "RELATED_TO"),
                    weight=rel.get("weight", 1.0),
                    citation=rel.get("evidence_citation", "")
                )

    def export_graph_data(self, session_id: str) -> dict:
        g = self.get_or_create_graph(session_id)

        # Compute degree centrality and PageRank
        degree_dict = dict(g.degree()) if len(g) > 0 else {}
        pagerank_dict = nx.pagerank(g) if len(g) > 1 else {n: 1.0 for n in g.nodes()}

        nodes = []
        for node_id, data in g.nodes(data=True):
            nodes.append({
                "id": str(node_id),
                "label": data.get("name", str(node_id)),
                "category": data.get("category", "UNKNOWN"),
                "degree": degree_dict.get(node_id, 0),
                "pagerank": round(pagerank_dict.get(node_id, 0.1), 4),
                "confidence": data.get("confidence", 0.9),
                "metadata": data.get("metadata", {})
            })

        edges = []
        for u, v, data in g.edges(data=True):
            edges.append({
                "source": str(u),
                "target": str(v),
                "label": data.get("relation_type", "RELATED_TO"),
                "weight": data.get("weight", 1.0),
                "citation": data.get("citation", "")
            })

        return {
            "session_id": session_id,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "nodes": nodes,
            "edges": edges
        }

    def clear(self, session_id: str):
        if session_id in self.graphs:
            del self.graphs[session_id]

graph_manager = KnowledgeGraphManager()
