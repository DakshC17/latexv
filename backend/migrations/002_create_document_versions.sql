-- 002_create_document_versions.sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    latex TEXT NOT NULL,
    pdf_url TEXT,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'success',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_versions_doc_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_created ON document_versions(created_at DESC);
