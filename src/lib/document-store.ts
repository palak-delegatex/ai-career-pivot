export interface GeneratedDocument {
  id: string;
  type: "resume" | "cover-letter";
  title: string;
  targetRole: string;
  company?: string;
  content: string;
  createdAt: string;
  status: "draft" | "ready" | "downloaded";
}

const STORAGE_KEY = "aicp_generated_documents";

function readDocs(): GeneratedDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDocs(docs: GeneratedDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function getDocuments(): GeneratedDocument[] {
  return readDocs().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveDocument(doc: Omit<GeneratedDocument, "id" | "createdAt" | "status">): GeneratedDocument {
  const newDoc: GeneratedDocument = {
    ...doc,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "ready",
  };
  const docs = readDocs();
  docs.push(newDoc);
  writeDocs(docs);
  return newDoc;
}

export function updateDocumentStatus(id: string, status: GeneratedDocument["status"]) {
  const docs = readDocs();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) {
    docs[idx].status = status;
    writeDocs(docs);
  }
}

export function deleteDocument(id: string) {
  const docs = readDocs().filter((d) => d.id !== id);
  writeDocs(docs);
}
