

from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import NCActionType, TokenUid, public, view

class Swap(Blueprint):
    """Blueprint to execute swaps between two tokens with a fixed ratio."""

    token_a: TokenUid
    multiplier_a: int
    token_b: TokenUid
    multiplier_b: int
    swaps_counter: int

    @public
    def initialize(self, ctx: Context, token_a: TokenUid, multiplier_a: int, token_b: TokenUid, multiplier_b: int) -> None:
        if token_a == token_b:
            raise NCFail("Tokens must be different")
        if multiplier_a <= 0 or multiplier_b <= 0:
            raise NCFail("Multipliers must be positive integers")
        self.token_a = token_a
        self.multiplier_a = multiplier_a
        self.token_b = token_b
        self.multiplier_b = multiplier_b
        self.swaps_counter = 0

    @public
    def swap(self, ctx: Context, from_token: TokenUid, amount: int) -> None:
        if amount <= 0:
            raise NCFail("Amount must be positive")
        if from_token == self.token_a:
            to_token = self.token_b
            from_multiplier = self.multiplier_a
            to_multiplier = self.multiplier_b
        elif from_token == self.token_b:
            to_token = self.token_a
            from_multiplier = self.multiplier_b
            to_multiplier = self.multiplier_a
        else:
            raise NCFail("Invalid token for swap")
        # Check ratio
        if amount % from_multiplier != 0:
            raise NCFail("Amount must be a multiple of the multiplier")
        to_amount = (amount // from_multiplier) * to_multiplier
        # Check deposit and withdrawal actions
        actions = ctx.actions
        if from_token not in actions or actions[from_token].type != NCActionType.DEPOSIT or actions[from_token].amount != amount:
            raise NCFail("Must deposit the correct amount of from_token")
        if to_token not in actions or actions[to_token].type != NCActionType.WITHDRAWAL or actions[to_token].amount != to_amount:
            raise NCFail("Must withdraw the correct amount of to_token")
        self.swaps_counter += 1

    @view
    def get_state(self) -> dict:
        return {
            "token_a": self.token_a,
            "multiplier_a": self.multiplier_a,
            "token_b": self.token_b,
            "multiplier_b": self.multiplier_b,
            "swaps_counter": self.swaps_counter
        }

__blueprint__ = Swap