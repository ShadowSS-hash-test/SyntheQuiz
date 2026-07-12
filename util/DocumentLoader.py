# document_loader.py

import os
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_core.documents import Document

from .config import (
    MAX_PAGES,
    MAX_FILE_SIZE_MB,
    MAX_CHARACTERS,
    ALLOWED_FILE_TYPES,
)


class UnsupportedFileTypeError(Exception):
    """Raised when the uploaded file extension isn't supported."""
    pass


class DocumentTooLargeError(Exception):
    """Raised when the document exceeds page, character, or size limits."""
    pass


def _check_file_size(file_path: str) -> None:
    """Reject files above MAX_FILE_SIZE_MB before we even try to load them."""
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise DocumentTooLargeError(
            f"File is {size_mb:.2f}MB, max allowed is {MAX_FILE_SIZE_MB}MB"
        )


def _check_pdf_page_limit(documents: list[Document]) -> None:
    """PDF loader returns one Document per page - check count directly."""
    if len(documents) > MAX_PAGES:
        raise DocumentTooLargeError(
            f"Document has {len(documents)} pages, max allowed is {MAX_PAGES}"
        )


def _check_character_limit(documents: list[Document]) -> None:
    """DOCX/TXT loaders often return the whole file as one Document,
    so page count doesn't apply. Use total character count as a proxy instead."""
    total_chars = sum(len(doc.page_content) for doc in documents)
    if total_chars > MAX_CHARACTERS:
        raise DocumentTooLargeError(
            f"Document has {total_chars:,} characters, max allowed is {MAX_CHARACTERS:,} "
            f"(roughly equivalent to {MAX_PAGES} pages)"
        )


def load_document(file_path: str) -> list[Document]:
    """
    Load a PDF, DOCX, or TXT file into LangChain Document objects.
    Enforces file size limits upfront, and page/character limits after loading.

    Raises:
        UnsupportedFileTypeError: if extension isn't in ALLOWED_FILE_TYPES
        DocumentTooLargeError: if file/page/character limits are exceeded
    """
    extension = os.path.splitext(file_path)[1].lower()

    if extension not in ALLOWED_FILE_TYPES:
        raise UnsupportedFileTypeError(
            f"Unsupported file type: {extension}. Allowed types: {ALLOWED_FILE_TYPES}"
        )

    # Check file size before doing any parsing work - fail fast
    _check_file_size(file_path)

    if extension == ".pdf":
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        _check_pdf_page_limit(documents)

    elif extension == ".docx":
        loader = Docx2txtLoader(file_path)
        documents = loader.load()
        _check_character_limit(documents)

    elif extension == ".txt":
        loader = TextLoader(file_path)
        documents = loader.load()
        _check_character_limit(documents)

    return documents