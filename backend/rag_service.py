"""
RAG Service — Retrieval-Augmented Generation Pipeline
Handles document ingestion, chunking, embedding, FAISS indexing, and semantic retrieval.

Uses:
  - LangChain for text splitting
  - sentence-transformers for embeddings
  - FAISS for vector storage
  - PDF/DOCX/OCR for document processing
"""

import os
import json
import hashlib
from typing import List, Optional
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

# LangChain text splitter
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Sentence Transformers for embeddings
from sentence_transformers import SentenceTransformer

# FAISS for vector search
import faiss
import numpy as np

# Document processing
import re

router = APIRouter(prefix="/api/rag", tags=["RAG"])

# ── Configuration ─────────────────────────────────────────────────────────────

VECTOR_STORE_DIR = os.path.join(os.path.dirname(__file__), "vector_store")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
EMBEDDING_DIM = 384  # Dimension for all-MiniLM-L6-v2

os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

# ── Global State ──────────────────────────────────────────────────────────────

_embedder: Optional[SentenceTransformer] = None
_index: Optional[faiss.IndexFlatL2] = None
_chunks: List[dict] = []  # Parallel list of chunk metadata

def _get_embedder():
    global _embedder
    if _embedder is None:
        print("[RAG] Loading embedding model:", EMBEDDING_MODEL)
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
        print("[RAG] Embedding model loaded successfully")
    return _embedder

def _get_or_create_index():
    global _index, _chunks
    if _index is not None:
        return _index
    
    index_path = os.path.join(VECTOR_STORE_DIR, "faiss.index")
    chunks_path = os.path.join(VECTOR_STORE_DIR, "chunks.json")
    
    if os.path.exists(index_path) and os.path.exists(chunks_path):
        _index = faiss.read_index(index_path)
        with open(chunks_path, "r", encoding="utf-8") as f:
            _chunks = json.load(f)
        print(f"[RAG] Loaded existing index with {_index.ntotal} vectors")
    else:
        _index = faiss.IndexFlatL2(EMBEDDING_DIM)
        _chunks = []
        print("[RAG] Created new FAISS index")
    
    return _index

def _save_index():
    if _index is None:
        return
    index_path = os.path.join(VECTOR_STORE_DIR, "faiss.index")
    chunks_path = os.path.join(VECTOR_STORE_DIR, "chunks.json")
    faiss.write_index(_index, index_path)
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(_chunks, f, ensure_ascii=False)

# ── Text Extraction ──────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        # Try pdf-parse style extraction
        import subprocess
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        try:
            # Use pdftotext if available
            result = subprocess.run(
                ["pdftotext", "-layout", tmp_path, "-"],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        finally:
            os.unlink(tmp_path)
    except Exception:
        pass
    
    # Fallback: basic text extraction
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        # Remove binary noise
        text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:50000] if text else ""
    except Exception:
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes."""
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        try:
            import mammoth
            with open(tmp_path, "rb") as f:
                result = mammoth.extract_raw_text(f)
                return result.value.strip()
        except ImportError:
            # Fallback: try basic XML extraction
            import zipfile
            from io import BytesIO
            
            with zipfile.ZipFile(BytesIO(file_bytes)) as z:
                if "word/document.xml" in z.namelist():
                    xml_content = z.read("word/document.xml").decode("utf-8")
                    text = re.sub(r'<[^>]+>', ' ', xml_content)
                    return re.sub(r'\s+', ' ', text).strip()
        finally:
            os.unlink(tmp_path)
    except Exception:
        return ""
    return ""

# ── Text Chunking ────────────────────────────────────────────────────────────

def chunk_text(text: str, source: str = "unknown") -> List[dict]:
    """Split text into overlapping chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    
    splits = splitter.split_text(text)
    chunks = []
    
    for i, chunk_text_content in enumerate(splits):
        chunk_id = hashlib.md5(f"{source}:{i}:{chunk_text_content[:50]}".encode()).hexdigest()
        chunks.append({
            "id": chunk_id,
            "text": chunk_text_content,
            "source": source,
            "chunk_index": i,
            "total_chunks": len(splits),
        })
    
    return chunks

# ── API Endpoints ─────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    text: Optional[str] = None
    file_name: str = "document"
    file_type: str = "text"

class QueryRequest(BaseModel):
    query: str
    topic: Optional[str] = ""
    top_k: int = 3

@router.post("/ingest")
async def ingest_document(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    file_name: Optional[str] = Form("document"),
):
    """Ingest a document into the RAG knowledge base."""
    global _chunks
    
    extracted_text = ""
    source_name = file_name or "document"
    
    if file:
        file_bytes = await file.read()
        source_name = file.filename or source_name
        ext = os.path.splitext(source_name)[1].lower()
        
        if ext == ".pdf":
            extracted_text = extract_text_from_pdf(file_bytes)
        elif ext in (".docx", ".doc"):
            extracted_text = extract_text_from_docx(file_bytes)
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    elif text:
        extracted_text = text
    else:
        raise HTTPException(status_code=400, detail="No file or text provided")
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document")
    
    # Chunk the text
    new_chunks = chunk_text(extracted_text, source_name)
    if not new_chunks:
        raise HTTPException(status_code=400, detail="No chunks generated")
    
    # Generate embeddings
    embedder = _get_embedder()
    texts = [c["text"] for c in new_chunks]
    embeddings = embedder.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    
    # Add to FAISS index
    index = _get_or_create_index()
    embeddings_np = np.array(embeddings, dtype=np.float32)
    index.add(embeddings_np)
    _chunks.extend(new_chunks)
    
    # Persist
    _save_index()
    
    return {
        "success": True,
        "source": source_name,
        "chunks_added": len(new_chunks),
        "total_chunks": len(_chunks),
        "text_length": len(extracted_text),
    }

@router.post("/query")
async def query_knowledge_base(req: QueryRequest):
    """Query the knowledge base for relevant chunks."""
    index = _get_or_create_index()
    
    if index.ntotal == 0:
        return {"chunks": [], "query": req.query, "message": "Knowledge base is empty"}
    
    # Generate query embedding
    embedder = _get_embedder()
    query_text = f"{req.topic} {req.query}".strip() if req.topic else req.query
    query_embedding = embedder.encode([query_text], normalize_embeddings=True)
    query_np = np.array(query_embedding, dtype=np.float32)
    
    # Search FAISS
    k = min(req.top_k, index.ntotal)
    distances, indices = index.search(query_np, k)
    
    results = []
    for i, idx in enumerate(indices[0]):
        if idx < 0 or idx >= len(_chunks):
            continue
        chunk = _chunks[idx]
        results.append({
            "text": chunk["text"],
            "source": chunk["source"],
            "chunk_index": chunk["chunk_index"],
            "score": float(1.0 / (1.0 + distances[0][i])),  # Convert distance to similarity
        })
    
    return {"chunks": results, "query": req.query, "total_indexed": index.ntotal}

@router.get("/status")
async def rag_status():
    """Check RAG service status."""
    index = _get_or_create_index()
    
    # Get unique sources
    sources = list(set(c.get("source", "unknown") for c in _chunks))
    
    return {
        "available": True,
        "documentCount": len(sources),
        "chunkCount": index.ntotal,
        "sources": sources,
        "embeddingModel": EMBEDDING_MODEL,
        "chunkSize": CHUNK_SIZE,
        "chunkOverlap": CHUNK_OVERLAP,
    }

@router.delete("/clear")
async def clear_knowledge_base():
    """Clear the entire knowledge base."""
    global _index, _chunks
    _index = faiss.IndexFlatL2(EMBEDDING_DIM)
    _chunks = []
    _save_index()
    return {"success": True, "message": "Knowledge base cleared"}
