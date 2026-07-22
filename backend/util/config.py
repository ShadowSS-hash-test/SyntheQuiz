# config.py
# Centralized constants for document processing.
# These are business logic rules, not secrets - they don't belong in .env

# --- Document upload limits ---
MAX_PAGES = 100                # max pages for PDF (1 Document object per page)
MAX_FILE_SIZE_MB = 10          # safety net for image-heavy or unusually dense files
MAX_CHARACTERS = 250_000        # fallback limit for DOCX/TXT where "pages" don't apply directly
                                 # (~100 pages x ~2500 chars/page average)

ALLOWED_FILE_TYPES = [".pdf", ".docx", ".txt"]

# --- Chunking ---
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# --- Embedding ---
EMBEDDING_BATCH_SIZE = 20       # chunks per embedding API call
EMBEDDING_BATCH_DELAY_SECONDS = 1  # delay between batches to respect 110 RPM limit

CHROMA_DB_PATH = "./chroma_data"
RETRIEVAL_TOP_K = 4   