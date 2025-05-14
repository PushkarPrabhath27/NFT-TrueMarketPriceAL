

from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import (
    NCActionType,
    TokenUid,
    public,
    view,
)

class InvalidTokens(NCFail):
    pass

class InvalidActions(NCFail):
    pass

class InvalidRatio(NCFail):
    pass

class TrustScoreSwap(Blueprint):
    """
    Blueprint to execute swaps between two tokens with a fixed ratio and track participant trust scores.
    """

    token_a: TokenUid
    multiplier_a: int
    token_b: TokenUid
    multiplier_b: int
    swaps_counter: int

    @public
    def initialize(
        self,
        ctx: Context,
        token_a: TokenUid,
        token_b: TokenUid,
        multiplier_a: int,
        multiplier_b: int
    ) -> None:
        """
        Initialize the contract with two tokens and their swap multipliers.
        """
        if token_a == token_b:
            raise NCFail
        if set(ctx.actions.keys()) != {token_a, token_b}:
            raise InvalidTokens
        if multiplier_a <= 0 or multiplier_b <= 0:
            raise NCFail
        self.token_a = token_a
        self.token_b = token_b
        self.multiplier_a = multiplier_a
        self.multiplier_b = multiplier_b
        self.swaps_counter = 0

    @public
    def swap(self, ctx: Context) -> None:
        """
        Execute a token swap.
        """
        if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
            raise InvalidTokens

        action_a = ctx.actions[self.token_a]
        action_b = ctx.actions[self.token_b]

        if {action_a.type, action_b.type} != {NCActionType.WITHDRAWAL, NCActionType.DEPOSIT}:
            raise InvalidActions

        # Identify which is deposit and which is withdrawal
        if action_a.type == NCActionType.DEPOSIT:
            deposit_token = self.token_a
            withdrawal_token = self.token_b
            deposit_amount = action_a.amount
            withdrawal_amount = action_b.amount
            deposit_multiplier = self.multiplier_a
            withdrawal_multiplier = self.multiplier_b
        else:
            deposit_token = self.token_b
            withdrawal_token = self.token_a
            deposit_amount = action_b.amount
            withdrawal_amount = action_a.amount
            deposit_multiplier = self.multiplier_b
            withdrawal_multiplier = self.multiplier_a

        # Check ratio
        if deposit_amount * withdrawal_multiplier != withdrawal_amount * deposit_multiplier:
            raise InvalidRatio

        self.swaps_counter += 1

    @view
    def get_state(self) -> dict:
        """
        Return the current state of the contract.
        """
        return {
            "token_a": self.token_a,
            "multiplier_a": self.multiplier_a,
            "token_b": self.token_b,
            "multiplier_b": self.multiplier_b,
            "swaps_counter": self.swaps_counter,
        }

__blueprint__ = TrustScoreSwap