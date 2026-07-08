"""Hot/Warm/Cold lead scoring. Never shown to the visitor — travels only in
the webhook payload to the owner.
"""

from __future__ import annotations

from typing import Literal

from app.services.calculator import starting_prices

BudgetBand = Literal["under_20m", "20m_35m", "35m_50m", "over_50m"]
Timeline = Literal["this_month", "1_3_months", "3_plus_months"]
Score = Literal["hot", "warm", "cold"]

_BUDGET_RANGES: dict[BudgetBand, tuple[int, float]] = {
    "under_20m": (0, 20_000_000),
    "20m_35m": (20_000_000, 35_000_000),
    "35m_50m": (35_000_000, 50_000_000),
    "over_50m": (50_000_000, float("inf")),
}

_NEAR_TERM_TIMELINES: set[Timeline] = {"this_month", "1_3_months"}


def budget_fits_a_listed_unit(budget_band: BudgetBand) -> bool:
    lower, upper = _BUDGET_RANGES[budget_band]
    return any(lower <= price < upper for price in starting_prices().values())


def score_lead(budget_band: BudgetBand, timeline: Timeline) -> Score:
    fits_budget = budget_fits_a_listed_unit(budget_band)
    near_term = timeline in _NEAR_TERM_TIMELINES

    if fits_budget and near_term:
        return "hot"
    if fits_budget or near_term:
        return "warm"
    return "cold"
