"""Pure-function installment math. Unit prices are read from the listings
corpus doc (starting price per unit type) so the calculator never drifts
from what the bot tells buyers the units cost.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
LISTINGS_PATH = REPO_ROOT / "content" / "docs" / "listings.md"

POSSESSION_PCT = 0.10
MIN_DOWN_PCT = 0.10
MAX_DOWN_PCT = 0.30
MIN_MONTHS = 12
MAX_MONTHS = 60

_TOWER_HEADING_RE = re.compile(r"^##\s+Tower\s+\w+\s+[—-]\s+(\d)\s+Bed$")
_PRICE_RE = re.compile(r"^-\s+Price:\s+PKR\s+([\d,]+)$")


class CalculatorError(ValueError):
    pass


@dataclass(frozen=True)
class InstallmentBreakdown:
    unit_type: str
    unit_price: int
    down_payment_pct: float
    months: int
    down_payment: int
    monthly_installment: int
    possession_payment: int
    total: int


@lru_cache(maxsize=1)
def starting_prices() -> dict[str, int]:
    """{'1-bed': lowest listed price, ...} parsed from listings.md."""
    text = LISTINGS_PATH.read_text(encoding="utf-8")
    current_beds: int | None = None
    prices_by_beds: dict[int, list[int]] = {}

    for line in text.splitlines():
        stripped = line.strip()
        tower_match = _TOWER_HEADING_RE.match(stripped)
        if tower_match:
            current_beds = int(tower_match.group(1))
            continue
        price_match = _PRICE_RE.match(stripped)
        if price_match and current_beds is not None:
            price = int(price_match.group(1).replace(",", ""))
            prices_by_beds.setdefault(current_beds, []).append(price)

    return {f"{beds}-bed": min(prices) for beds, prices in prices_by_beds.items()}


def installment_calculator(
    unit_type: str, down_payment_pct: float, months: int
) -> InstallmentBreakdown:
    prices = starting_prices()
    normalized_type = unit_type.strip().lower().replace(" ", "-")
    if normalized_type not in prices:
        available = ", ".join(sorted(prices))
        raise CalculatorError(f"Unknown unit type '{unit_type}'. Choose from: {available}.")
    if not (MIN_DOWN_PCT <= down_payment_pct <= MAX_DOWN_PCT):
        raise CalculatorError(
            f"Down payment must be between {MIN_DOWN_PCT:.0%} and {MAX_DOWN_PCT:.0%}."
        )
    if not (MIN_MONTHS <= months <= MAX_MONTHS):
        raise CalculatorError(
            f"Installment term must be between {MIN_MONTHS} and {MAX_MONTHS} months."
        )

    price = prices[normalized_type]
    down_payment = round(price * down_payment_pct)
    possession_payment = round(price * POSSESSION_PCT)
    installment_total = price - down_payment - possession_payment
    monthly_installment = installment_total // months
    # fold the integer-division remainder into the possession payment so the
    # three figures always reconcile to the rupee against unit_price
    possession_payment += installment_total - monthly_installment * months

    return InstallmentBreakdown(
        unit_type=normalized_type,
        unit_price=price,
        down_payment_pct=down_payment_pct,
        months=months,
        down_payment=down_payment,
        monthly_installment=monthly_installment,
        possession_payment=possession_payment,
        total=down_payment + monthly_installment * months + possession_payment,
    )
