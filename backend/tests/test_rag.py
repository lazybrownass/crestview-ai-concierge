from app.services.rag import get_index, retrieve


def test_index_loads_all_docs() -> None:
    index = get_index()
    doc_names = {c.doc for c in index.chunks}
    assert doc_names == {
        "faq",
        "payment-plan",
        "listings",
        "possession-schedule",
        "maintenance-policy",
        "pet-policy",
        "amenities",
        "booking-process",
    }


def test_installment_query_returns_payment_plan_chunk() -> None:
    results = retrieve("what is the monthly installment for a 2 bed with 20 percent down", top_k=3)
    assert results, "expected at least one retrieved chunk"
    top = results[0]
    assert top.chunk.doc == "payment-plan"
    assert top.chunk.section_index >= 1
    assert "PAYMENT PLAN" in top.citation
    assert "§" in top.citation


def test_possession_query_returns_possession_schedule_chunk() -> None:
    results = retrieve("when will tower b be handed over", top_k=3)
    docs = {r.chunk.doc for r in results}
    assert "possession-schedule" in docs
