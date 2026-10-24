from ragdoctor.diagnosis.verdict import assign_verdict
from ragdoctor.scoring.retrieval import hit_at_k, mrr, recall_at_k, score_retrieval
from ragdoctor.store.models import VerdictEnum
from ragdoctor.validation.calibration import cohen_kappa


class TestRetrievalMetrics:
    def test_hit_at_k_found(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_02"}
        assert hit_at_k(retrieved, gold, 3) == 1.0

    def test_hit_at_k_not_found(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_99"}
        assert hit_at_k(retrieved, gold, 3) == 0.0

    def test_hit_at_k_cutoff(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_03"}
        assert hit_at_k(retrieved, gold, 2) == 0.0
        assert hit_at_k(retrieved, gold, 3) == 1.0

    def test_recall_at_k_full(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_01", "ch_02"}
        assert recall_at_k(retrieved, gold, 3) == 1.0

    def test_recall_at_k_partial(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_01", "ch_99"}
        assert recall_at_k(retrieved, gold, 3) == 0.5

    def test_recall_at_k_empty_gold(self):
        assert recall_at_k(["ch_01"], set(), 5) == 1.0

    def test_mrr_first(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_01"}
        assert mrr(retrieved, gold) == 1.0

    def test_mrr_second(self):
        retrieved = ["ch_01", "ch_02", "ch_03"]
        gold = {"ch_02"}
        assert abs(mrr(retrieved, gold) - 0.5) < 1e-9

    def test_mrr_not_found(self):
        retrieved = ["ch_01", "ch_02"]
        gold = {"ch_99"}
        assert mrr(retrieved, gold) == 0.0

    def test_score_retrieval_full(self):
        retrieved = [{"chunk_id": "ch_01"}, {"chunk_id": "ch_02"}]
        result = score_retrieval(retrieved, ["ch_01"], k=2)
        assert result["hit_at_2"] == 1.0
        assert result["mrr"] == 1.0


class TestVerdictAssignment:
    def _base_probes(self):
        return {"gold_context_correct": True, "retrieved_context_correct": True, "no_context_correct": False}

    def test_pass_verdict(self):
        probes = {"gold_context_correct": True, "retrieved_context_correct": True, "no_context_correct": False}
        scores = {"faithfulness": 0.9, "answer_accuracy": 0.9}
        verdict, detail = assign_verdict(
            gold_chunk_ids=["ch_01"],
            retrieved_ids=["ch_01", "ch_02"],
            retrieved_set={"ch_01", "ch_02"},
            top_k_set={"ch_01", "ch_02"},
            probes=probes,
            question_type="factoid",
            scores=scores,
        )
        assert verdict == VerdictEnum.PASS

    def test_retrieval_miss_verdict(self):
        probes = {"gold_context_correct": True, "retrieved_context_correct": False, "no_context_correct": False}
        scores = {"faithfulness": 0.2, "answer_accuracy": 0.0}
        verdict, detail = assign_verdict(
            gold_chunk_ids=["ch_gold"],
            retrieved_ids=["ch_01", "ch_02"],
            retrieved_set={"ch_01", "ch_02"},
            top_k_set={"ch_01", "ch_02"},
            probes=probes,
            question_type="factoid",
            scores=scores,
        )
        assert verdict == VerdictEnum.RETRIEVAL_MISS

    def test_parametric_leak(self):
        probes = {"gold_context_correct": True, "retrieved_context_correct": True, "no_context_correct": True}
        scores = {"faithfulness": 1.0, "answer_accuracy": 1.0}
        verdict, _ = assign_verdict(
            gold_chunk_ids=["ch_01"],
            retrieved_ids=["ch_01"],
            retrieved_set={"ch_01"},
            top_k_set={"ch_01"},
            probes=probes,
            question_type="factoid",
            scores=scores,
        )
        assert verdict == VerdictEnum.PARAMETRIC_LEAK

    def test_failed_to_abstain(self):
        probes = {"gold_context_correct": False, "retrieved_context_correct": True, "no_context_correct": False}
        scores = {"faithfulness": 0.5, "answer_accuracy": 0.9}
        verdict, _ = assign_verdict(
            gold_chunk_ids=[],
            retrieved_ids=["ch_01"],
            retrieved_set={"ch_01"},
            top_k_set={"ch_01"},
            probes=probes,
            question_type="unanswerable",
            scores=scores,
        )
        assert verdict == VerdictEnum.FAILED_TO_ABSTAIN


class TestCohenKappa:
    def test_perfect_agreement(self):
        labels = ["A", "B", "C", "A", "B"]
        assert cohen_kappa(labels, labels) == 1.0

    def test_no_agreement(self):
        a = ["A", "B", "A", "B"]
        b = ["B", "A", "B", "A"]
        kappa = cohen_kappa(a, b)
        assert kappa < 0

    def test_partial_agreement(self):
        a = ["A", "B", "A", "B", "A", "B"]
        b = ["A", "A", "A", "B", "B", "B"]
        kappa = cohen_kappa(a, b)
        assert -1.0 <= kappa <= 1.0

    def test_empty_lists(self):
        assert cohen_kappa([], []) == 0.0

    def test_mismatched_lengths(self):
        assert cohen_kappa(["A"], ["A", "B"]) == 0.0
