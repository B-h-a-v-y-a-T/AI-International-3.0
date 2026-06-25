// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Retrieval Agent
// Calls the Python RAG microservice for document-grounded responses.
// Falls back to keyword-based context if RAG is unavailable.
// ═══════════════════════════════════════════════════════════════════════════════

const RAG_BASE_URL = process.env.RAG_URL || 'http://localhost:8050';

export async function run(context) {
  const { message, topic } = context;

  // Try RAG service first
  try {
    const ragResult = await queryRAG(message, topic);
    if (ragResult && ragResult.chunks && ragResult.chunks.length > 0) {
      return {
        source: 'rag',
        context: ragResult.chunks.map(c => c.text).join('\n\n'),
        citations: ragResult.chunks.map(c => ({
          source: c.source || 'Knowledge Base',
          page: c.page || null,
          chunk: c.text?.slice(0, 200) || '',
        })),
        available: true,
      };
    }
  } catch (err) {
    // RAG service unavailable — fall through to fallback
  }

  // Fallback: return empty context (tutor will rely on its own knowledge)
  return {
    source: 'none',
    context: '',
    citations: [],
    available: false,
  };
}

// ── Ingest document into RAG ─────────────────────────────────────────────────

export async function ingestDocument(filePath, fileName, fileType) {
  try {
    const response = await fetch(`${RAG_BASE_URL}/api/rag/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: filePath, file_name: fileName, file_type: fileType }),
    });
    if (!response.ok) throw new Error(`RAG ingest failed: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('[KnowledgeAgent] Ingest error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Query RAG service ────────────────────────────────────────────────────────

async function queryRAG(query, topic = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${RAG_BASE_URL}/api/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topic, top_k: 3 }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
}

// ── Check RAG status ─────────────────────────────────────────────────────────

export async function getRAGStatus() {
  try {
    const response = await fetch(`${RAG_BASE_URL}/api/rag/status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return { available: false };
    return await response.json();
  } catch {
    return { available: false, documentCount: 0 };
  }
}
