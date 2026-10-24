from collections import Counter


def cohen_kappa(labels_a: list[str], labels_b: list[str]) -> float:
    if len(labels_a) != len(labels_b) or not labels_a:
        return 0.0
    n = len(labels_a)
    categories = list(set(labels_a) | set(labels_b))
    observed_agreement = sum(1 for a, b in zip(labels_a, labels_b, strict=True) if a == b) / n

    count_a = Counter(labels_a)
    count_b = Counter(labels_b)
    expected_agreement = sum(
        (count_a.get(cat, 0) / n) * (count_b.get(cat, 0) / n) for cat in categories
    )
    if expected_agreement == 1.0:
        return 1.0
    return (observed_agreement - expected_agreement) / (1.0 - expected_agreement)
