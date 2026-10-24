import hashlib
import io
from pathlib import Path
from typing import Any

import pypdf


def _file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _chunk_id(corpus_id: str, char_start: int, char_end: int, content_hash: str) -> str:
    raw = f"{corpus_id}:{char_start}:{char_end}:{content_hash}"
    return "ch_" + hashlib.sha256(raw.encode()).hexdigest()[:16]


def extract_text(data: bytes, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        reader = pypdf.PdfReader(io.BytesIO(data))
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        return "\n".join(pages)
    if suffix == ".pptx":
        import xml.etree.ElementTree as ET
        import zipfile
        z = zipfile.ZipFile(io.BytesIO(data))
        slides = []
        for name in sorted(z.namelist()):
            if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
                text = " ".join(ET.fromstring(z.read(name)).itertext())
                slides.append(text)
        return "\n\n".join(slides)
    return data.decode("utf-8", errors="replace")


def _split_recursive(text: str, size: int, overlap: int) -> list[tuple[int, int]]:
    separators = ["\n\n", "\n", ". ", " ", ""]
    chunks: list[tuple[int, int]] = []

    def _split(start: int, end: int, sep_idx: int) -> None:
        segment = text[start:end]
        if len(segment) <= size:
            if segment.strip():
                chunks.append((start, end))
            return
        sep = separators[sep_idx] if sep_idx < len(separators) else ""
        if sep:
            parts = segment.split(sep)
        else:
            parts = [segment[i : i + size] for i in range(0, len(segment), size - overlap)]

        pos = start
        for part in parts:
            part_end = pos + len(part)
            if sep and pos < part_end:
                part_end += len(sep)
            part_end = min(part_end, end)
            if len(text[pos:part_end]) > size and sep_idx < len(separators) - 1:
                _split(pos, part_end, sep_idx + 1)
            elif text[pos:part_end].strip():
                chunks.append((pos, part_end))
            pos = part_end

    _split(0, len(text), 0)

    merged: list[tuple[int, int]] = []
    for start, end in chunks:
        if merged and (end - merged[-1][0]) <= size:
            merged[-1] = (merged[-1][0], end)
        else:
            merged.append((start, end))
    return merged


def chunk_text(
    corpus_id: str,
    text: str,
    file_hash: str,
    size: int,
    overlap: int,
) -> list[dict[str, Any]]:
    spans = _split_recursive(text, size, overlap)
    result = []
    for char_start, char_end in spans:
        content = text[char_start:char_end]
        if not content.strip():
            continue
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:8]
        cid = _chunk_id(corpus_id, char_start, char_end, content_hash)
        result.append(
            {
                "chunk_id": cid,
                "corpus_id": corpus_id,
                "text": content,
                "char_start": char_start,
                "char_end": char_end,
            }
        )
    return result


def compute_file_hash(data: bytes) -> str:
    return _file_hash(data)
