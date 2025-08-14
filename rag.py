import json
import faiss
from sentence_transformers import SentenceTransformer

class RAG:
    def __init__(self, knowledge_base_path='knowledge_base.json'):
        self.model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
        self.knowledge_base = self._load_knowledge_base(knowledge_base_path)
        self.index = self._create_vector_store()

    def _load_knowledge_base(self, path):
        with open(path, 'r') as f:
            return json.load(f)

    def _create_vector_store(self):
        questions = [item['question'] for item in self.knowledge_base]
        embeddings = self.model.encode(questions)
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)
        return index

    def search(self, query, k=1):
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(query_embedding, k)
        
        # Simple threshold to avoid irrelevant results
        if distances[0][0] > 1.0:
            return None
            
        return [self.knowledge_base[i] for i in indices[0]]
