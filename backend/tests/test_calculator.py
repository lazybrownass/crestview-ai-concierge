import pytest

from app.services.calculator import CalculatorError, installment_calculator


def test_standard_2bed_matches_payment_plan_worked_example() -> None:
    breakdown = installment_calculator("2-bed", 0.20, 36)
    assert breakdown.unit_price == 32_400_000
    assert breakdown.down_payment == 6_480_000
    assert breakdown.monthly_installment == 630_000
    assert breakdown.possession_payment == 3_240_000
    assert breakdown.total == breakdown.unit_price


def test_totals_reconcile_to_the_rupee_for_odd_terms() -> None:
    breakdown = installment_calculator("1-bed", 0.15, 47)
    assert breakdown.total == breakdown.unit_price
    assert (
        breakdown.down_payment + breakdown.monthly_installment * 47 + breakdown.possession_payment
        == (breakdown.unit_price)
    )


def test_unknown_unit_type_raises() -> None:
    with pytest.raises(CalculatorError):
        installment_calculator("penthouse", 0.20, 36)


def test_down_payment_out_of_range_raises() -> None:
    with pytest.raises(CalculatorError):
        installment_calculator("2-bed", 0.05, 36)


def test_months_out_of_range_raises() -> None:
    with pytest.raises(CalculatorError):
        installment_calculator("2-bed", 0.20, 72)
