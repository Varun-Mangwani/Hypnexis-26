"""
Populate ragdoctor.db with the demo corpus, chunk embeddings, evaluation run,
and 24 test cases so that live evaluation and demo replay are instant offline.
"""
import json
import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend" / "src"))

from sqlmodel import Session, select
from ragdoctor.config import settings
from ragdoctor.store.models import Chunk, Corpus, Run, RunStatusEnum, TestCase
from ragdoctor.store.session import engine, init_db
from ragdoctor.ingest.parser import chunk_text, compute_file_hash, extract_text
from ragdoctor.ingest.embedder import embed_chunks


def main():
    print("[prepare_demo] Initializing DB schema...")
    init_db()

    demo_dir = REPO_ROOT / "data" / "demo"
    fixtures_dir = REPO_ROOT / "contract" / "fixtures"

    with Session(engine) as session:
        corpus_id = "corp_demo_001"
        existing_corpus = session.exec(select(Corpus).where(Corpus.corpus_id == corpus_id)).first()

        if not existing_corpus:
            print("[prepare_demo] Ingesting demo documents...")
            all_chunks = []
            demo_files = list(demo_dir.glob("*.txt"))
            for doc in demo_files:
                content = doc.read_bytes()
                file_hash = compute_file_hash(content)
                text = extract_text(content, doc.name)
                chunks = chunk_text(corpus_id, text, file_hash, 512, 64)
                for c in chunks:
                    c["doc_name"] = doc.name
                all_chunks.extend(chunks)

            print(f"[prepare_demo] Computing embeddings for {len(all_chunks)} chunks...")
            embedded = embed_chunks(all_chunks)

            corpus = Corpus(
                corpus_id=corpus_id,
                filename="Financial & Technical Architecture Corpus (Q3-2026)",
                file_hash="demo_hash_q3",
                chunk_count=len(embedded),
            )
            session.add(corpus)

            # Also add alias for frontend corpus-demo-001
            corpus_alt = Corpus(
                corpus_id="corpus-demo-001",
                filename="Financial & Technical Architecture Corpus (Q3-2026)",
                file_hash="demo_hash_q3",
                chunk_count=len(embedded),
            )
            session.add(corpus_alt)

            for c in embedded:
                session.add(Chunk(
                    chunk_id=c["chunk_id"],
                    corpus_id=corpus_id,
                    text=c["text"],
                    char_start=c["char_start"],
                    char_end=c["char_end"],
                    embedding_hash=c["embedding_hash"],
                ))
            session.commit()
            print(f"[prepare_demo] Ingested {len(embedded)} chunks into DB.")
        else:
            print("[prepare_demo] Corpus already exists in DB.")

        # Ingest Runs & Cases from run_cases.json
        run_cases_path = fixtures_dir / "run_cases.json"
        run_summary_path = fixtures_dir / "run_summary.json"

        if run_cases_path.exists() and run_summary_path.exists():
            summary = json.loads(run_summary_path.read_text(encoding="utf-8"))
            cases = json.loads(run_cases_path.read_text(encoding="utf-8"))

            run_ids = ["run-demo-eval-001", "run_demo_001"]
            for rid in run_ids:
                existing_run = session.exec(select(Run).where(Run.run_id == rid)).first()
                if not existing_run:
                    print(f"[prepare_demo] Creating demo run {rid}...")
                    run = Run(
                        run_id=rid,
                        corpus_id=corpus_id,
                        status=RunStatusEnum.COMPLETED,
                        config_hash="cfg_demo_eval_001",
                        manifest=json.dumps({
                            "generator_model": "gpt-4o-mini",
                            "judge_model": "gpt-4o",
                            "embed_model": "BAAI/bge-small-en-v1.5",
                            "top_k": 5,
                            "chunk_size": 512,
                            "chunk_overlap": 64,
                            "faithfulness_threshold": 0.5,
                            "answer_accuracy_threshold": 0.5,
                        }),
                        num_questions=len(cases),
                        tokens_used=summary.get("token_usage", 142850),
                        scores=json.dumps(summary.get("scores", {})),
                    )
                    session.add(run)

                    for c in cases:
                        case_id = c["id"] if rid == "run-demo-eval-001" else f"db_{c['id']}"
                        session.add(TestCase(
                            case_id=case_id,
                            run_id=rid,
                            question=c["question"],
                            question_type=c.get("question_type", "factual"),
                            gold_answer=c.get("gold_answer", c.get("answer", "")),
                            gold_chunk_ids=json.dumps(c.get("gold_chunk_ids", ["chunk-101"])),
                            retrieved=json.dumps(c.get("retrieved", [])),
                            answer=c.get("answer", ""),
                            claims=json.dumps(c.get("claims", [])),
                            scores=json.dumps(c.get("scores", {})),
                            probes=json.dumps(c.get("probes", {})),
                            verdict=c.get("verdict"),
                            verdict_detail=c.get("verdict_detail", ""),
                            explanation=c.get("explanation", ""),
                            fix_suggestion=c.get("fix_suggestion", ""),
                        ))
                    session.commit()
                    print(f"[prepare_demo] Populated run {rid} with {len(cases)} cases.")
                else:
                    print(f"[prepare_demo] Run {rid} already exists.")

    print("[prepare_demo] Demo preparation complete. All caches populated.")


if __name__ == "__main__":
    main()
