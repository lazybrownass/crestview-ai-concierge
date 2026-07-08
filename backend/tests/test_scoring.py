from app.services.calculator import starting_prices
from app.services.scoring import budget_fits_a_listed_unit, score_lead


def test_no_listed_unit_is_priced_over_50m() -> None:
    # Sanity check the fixture assumption the rest of this file relies on:
    # over_50m is the one band that fits no current listing.
    assert all(price < 50_000_000 for price in starting_prices().values())
    assert budget_fits_a_listed_unit("over_50m") is False
    assert budget_fits_a_listed_unit("20m_35m") is True


def test_hot_when_budget_fits_and_timeline_is_near_term() -> None:
    assert score_lead("20m_35m", "this_month") == "hot"


def test_warm_when_only_budget_fits() -> None:
    assert score_lead("35m_50m", "3_plus_months") == "warm"


def test_warm_when_only_timeline_is_near_term() -> None:
    assert score_lead("over_50m", "1_3_months") == "warm"


def test_cold_when_neither_fits() -> None:
    assert score_lead("over_50m", "3_plus_months") == "cold"
