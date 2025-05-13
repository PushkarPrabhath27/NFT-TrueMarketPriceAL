Blueprint development guidelines
Introduction
This article is the primary reference material to consult while developing a blueprint. It provides guidelines for its design and implementation and details each of its technical aspects. Now, to understand the overall mechanics of blueprints, see Nano contracts: how it works.

SDK
Hathor core provides an SDK for blueprint development in Python 3. It is possible that in the future the blueprint SDK will be expanded to other languages. For now, you will need to develop your blueprint using Python 3.

Module
A blueprint must be implemented as a single Python module — namely, a single file my_blueprint.py.

Imports
You can only import names explicitly allowed by the blueprint SDK. The following snippet provides an exhaustive list of allowed imports:

imports_you_can_use.py
# Standard and related third parties
from math import ceil, floor
from typing import NamedTuple, Optional, TypeAlias

# Hathor (local application/library)
from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import (
    Address,
    Amount,
    BlueprintId,
    ContractId,
    NCAction,
    NCActionType,
    public,
    SignedData,
    Timestamp,
    TokenUid,
    TxOutputScript,
    VertexId,
    view,
)

Any import outside this list will not be allowed. For the hathor.nanocontracts package interface documentation, see Blueprint development — API.

Built-ins
The following snippet provides an exhaustive list of built-in names that are not allowed for use:

forbidden_builtin_names.py
"""
Restricted Names List:
- __builtins__
- __import__
- compile
- delattr
- dir
- eval
- exec
- getattr
- globals
- hasattr
- input
- locals
- open
- setattr
- vars
"""

Classes
Like any regular Python module, your module may contain multiple classes, but only one should be the blueprint itself. The blueprint class is the one that models contracts and is used to instantiate them. You should not define more than one blueprint class in a single module. Your module may also include other classes, but only for ancillary purposes, such as error specification. In short, your module should have one and only one blueprint class.

You must indicate to Hathor protocol which is your blueprint class. Suppose MyBlueprint is that class:

For a built-in blueprint, add MyBlueprint to module hathor-core/hathor/nanocontracts/blueprints/__init__.py.
For an on-chain blueprint, add the statement __blueprint__ = MyBlueprint somewhere in your module after defining MyBlueprint.
The following snippet presents an example of on-chain blueprint module:

my_blueprint.py
# Start with the imports.
# Remember: only allowed imports.
from hathor.nanocontracts.blueprint import Blueprint

...

# Define any ancillary classes:
class InvalidToken(NCFail):
    pass

...

# Define the blueprint class.
# This is the class that will be used to instantiate contracts.
# We suggest you to use the same name as the module:
class MyBlueprint(Blueprint):

...

# Finally, assign the primary class to Hathor protocol:
__blueprint__ = MyBlueprint

Attributes
Contract attributes must have values of types explicitly allowed by the blueprint SDK. The following snippet provides an exhaustive list of the allowed types:

allowed_attribute_types.py
"""Attribute data types you can use:
Built-in types:
- int
- str
- float
- bool
- bytes
- list
- set
- dict
- tuple

Standard library types:
- NamedTuple

hathor.nanocontracts package types:
- Address
- Amount
- BlueprintId
- ContractId
- Script
- SignedData
- Timestamp
- TokenUid
- VertexId
"""

Any attribute value with a type not included in this list will not be allowed. For the data types provided by hathor.nanocontracts, see Blueprint development — API.

info
Note that, for now, instances of classes defined within the blueprint module itself cannot be used as attribute values.

Class attributes
Blueprints do not support class attributes. In object-oriented programming, such as in Python, which is used for blueprint development in Hathor's SDK, classes can have both class and instance attributes. Instance attributes hold individual values for each object instantiated from the class, whereas class attributes share values across all instances.

Although Python allows for class attributes, they are not permitted in blueprint development. As a result, nano contracts instantiated from the same blueprint do not share any dynamic values; they only share static, hard-coded values from the blueprint's source code.

Methods
When to use each type of method?
Define the public method initialize for contract creation.
Define other public methods for contract execution, providing the contract's functionalities to users.
Define view methods to implement logic that can be used both internally by other methods and externally by users.
Define internal methods to implement logic that can be used only by other methods.
How to define the type of a method?
Methods are designated as public, view, or internal by the usage of decorators. Public methods must be marked with the @public decorator, as seen in the bet method of the bet blueprint:

@public
def bet(self, ctx: Context, address: Address, score: str) -> None:
  """Make a bet."""
  ...

View methods must be marked with the @view decorator, as seen in the get_max_withdrawal method of the bet blueprint:

@view
def get_max_withdrawal(self, address: Address) -> int:
  """Return the maximum amount available for withdrawal."""
  ...

Any method not marked as either @public or @view is internal, as seen in the _get_action method of the bet blueprint:

def _get_action(self, ctx: Context) -> NCAction:
  """Return the only action available; fails otherwise."""
  ...

note
The underscore at the beginning of the internal method name is optional and is used here as a good practice in Python programming to indicate internal methods.

Finally, a method shall not be marked as both @public and @view.

info
To reiterate:

@public: public method.
@view: view method.
No decorator: internal method.
@public and view decorators together: error.
How can each method be called?
Public methods can be called externally by users via nano contracts transactions, and by other contracts executing; and internally by other public methods. Public methods can call any other method of the contract.

View methods can be called externally by users via full node API requests, and internally by any other method. View methods can call other view methods, cannot call public methods, and can call internal methods as long as these do not change the attributes of the contract.

Internal methods can only be called internally by any other method. They cannot be called externally by users. Internal methods can call other internal methods and view methods, and cannot call public methods. Be careful while implementing state changes within internal methods. This will work fine as long as the method is not used, directly or indirectly, by a view method.

The golden rule is that the primary call dictates if the state of a contract can or cannot be changed. If the first method called in a contract is public, the internal methods subsequently called can alter the contract’s attributes. However, if the first method is a view, the internal methods called must not alter the state of the contract. If they do, the call will raise an exception.

The following snippet presents an example of valid calls between methods in a blueprint:

class FooBar(Blueprint):
  ...

  @public
  def initialize(self, ctx: Context, *args) -> None:
    ...
    # Some attribute of this blueprint
    self.dummy = 0
    ...

  @public
  def foobar(self, ctx: Context, *args) -> None:
    ...
    # foobar is public and therefore can call any other method:
    self.foo(ctx)
    self.bar()
    self._grok()
    self._qux()
    ...

  @public
  def foo(self, ctx: Context) -> None:
    ...

  @view
  def bar(self) -> int:
    ...
    # Can call the internal methods
    # as long as they don't change attributes
    self._qux()

  # No decorator, it's an internal method
  def _grok(self) -> str:
    ...
    # Be careful!
    # This method changes attributes;
    # shall not be called by view methods
    self.dummy += 1
    ...

  # Another internal method
  def _qux(self) -> bool:
    ...
    # This method doesn't change attributes;
    # can be safely called by view methods
    ...

In a nutshell, when the primary call is a view method, you need to ensure that no method in the call chain tries to alter the contract’s attributes. Typically, you will have public methods providing the contract’s functionalities, view methods for user queries, and internal methods as helpers.

What can each method do?
No method can directly alter the contract's balance. The contract's balance is controlled by Hathor protocol and is only updated after a public method completes successfully without throwing an exception, thereby authorizing all proposed deposits and withdrawals. The next section details this balance update process.

Regarding attributes, public methods can change them, and internal methods can also change them as long as they are never part of a chain call originated by a view method; because view methods cannot change attributes. The only effect of a view method should be compute and return a value.

Parameters
Public methods
When designing the business logic of your public methods, you will have access to the following data:

The state of the contract itself.
Information about the calling NC transaction and the current blockchain state via Context.
The method's specific parameters.
Public methods must have at least two parameters. (1) Since this is Python, the first parameter must be the object itself, namely the contract state — conventionally referred to as self. (2) The second parameter must always be a Context object. (3) After that, there can be zero, one, or more additional parameters. For example:

@public
def bet(self, ctx: Context, address: Address, score: str) -> None:
  """Make a bet."""
  ...

The method's specific parameters can only take values explicitly allowed, as listed in the next subsection: Arguments.

View methods
View methods must have self as the first parameter and may have zero, one, or more additional parameters. For example:

@view
def get_max_withdrawal(self, address: Address) -> int:
  """Return the maximum amount available for withdrawal."""
  ...

Again, method's specific parameters can only take values explicitly allowed, as listed in the next subsection: Arguments.

Internal methods
Internal methods must have the first parameter self and may have zero, one, or more additional parameters. However, unlike public and view methods, internal methods can have parameters of any valid type within the blueprint. For example:

def _assess_credit(self, address: Address) -> bool:
  """Return if credit should or not be provided to given address."""
  ...


tip
Note that self provides access to the contract's attributes and methods, but not to its multi-token balance. As mentioned earlier, the contract cannot alter its balance (it can only authorize Hathor protocol to make such changes), and to read its balance, it needs to use methods in Context, as explained in subsection Balance — updating.

Arguments
Argument passing:

Public and view methods: positional-only
Internal methods: any supported in Python
When calling a public or view method, contract users pass arguments in JSON format. Specifically, for public methods, this is done through args member in API requests. args is a JSON array of arguments to be passed to the invoked public method. When executing this method, Hathor platform serializes the arguments from JSON to Python.

The following snippet provides two pieces of information. (1) The left column contains an exhaustive list of the Python types allowed for parameters. (2) The right column shows the corresponding JSON type that must be passed as an argument by the contract user:

python_json_args.py
"""Parameter type in Python -> Argument type in JSON:

Python -> JSON

Built-in types:
- int -> number, without fraction or exponent — e.g, 301
- str -> string
- float -> number, with fraction without exponent — e.g., 301.09
- bool -> true or false
- bytes -> string
- list -> array
- dict -> object
- tuple -> array

Standard library types:
- NamedTuple -> array

hathor.nanocontracts package types:
- Address -> string
- Amount -> number, without fraction or exponent — e.g, 301
- SignedData -> array
- Timestamp -> number, without fraction or exponent — e.g, 1720699200
- TokenUid -> string
- VertexId -> string

Only types in the left can be used to parameters.
In turn, contract users should pass the correspondent JSON type.
"""

Note that the serialization that occurs when a method is invoked is the reverse of what is shown in the snippet. In other words, the serialization happens from JSON arguments to Python. The order in the snippet was arranged to make it easier to identify and select the types to be used in your parameters.

For example, suppose your blueprint implements the following public method:

@public
def foo(self, ctx: Context, address: Address, amount: Amount, event_date: Timestamp, token: TokenUid) -> None:
  ...

To call this method, the contract user must pass an args array with the correct number of arguments and the corresponding JSON types:

"args": [
  "WRV28Nwa6hdA6ntRtw264qtEZMX7p5EJCq",
  1000,
  1830708900,
  "000063f99b133c7630bc9d0117919f5b8726155412ad063dbbd618bdc7f85d7a"
]

Where:

args[0]: a string representing an address encoded in Base58check
args[1]: a number representing an amount of tokens
args[2]: a number representing a Unix-epoch timestamp
args[3]: a string representing a token UID, 32 bytes in hexadecimal
tip
In short, the blueprint developer defines a parameter's type in Python, and contract users should provide a corresponding JSON-type argument. Therefore, as a blueprint developer, you should document the interface of your blueprint in JSON format for contract users (DApp developers and end users). For an example of a blueprint interface reference, see the documentation for blueprint Bet.

Return value
Public methods should execute to the end and return nothing (None) to indicate successful execution and raise an exception to indicate a failed execution. Take, for example, the swap demo blueprint available in the SDK. In the snippet below, we see in the method signature its return and in its body an exception being raised:

@public
def swap(self, ctx: Context) -> None:
  """Execute a token swap."""
  if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
    raise InvalidTokens
    ...

Pre-invocation validations
Hathor protocol performs a series of validations before invoking a public method of a blueprint. If an NC (nano contract) transaction requests a withdrawal greater than the contract's funds, Hathor protocol ensures the method will not be called. Therefore, you don't need to worry about checking insufficient funds for withdrawals. For example, suppose Alice wants to withdraw 10 tokens A, but there are no tokens A in the contract's balance. In this case, Hathor protocol discards the transaction without even invoking the method.

Hathor protocol always passes a set of actions, where each deposit and withdrawal action refers to a distinct token. The actions object is a dictionary of NCAction, where each key is a token UID, and each value is an NCAction. Therefore, each existing token on Hathor platform can only appear once in actions. For example, this is a set of actions you might receive in the actions dictionary:

actions:
  <token_A_UID>:
    type: DEPOSIT
    token_uid: <token_A_UID>
    amount: 100
  <token_B_UID>:
    type: WITHDRAWAL
    token_uid: <token_B_UID>
    amount: 50
  <token_C_UID>:
    type: DEPOSIT
    token_uid: <token_C_UID>
    amount: 10
  <token_D_UID>:
    type: WITHDRAWAL
    token_uid: <token_D_UID>
    amount: 30

And here is a set of actions that you will never receive as argument in your method calls, where the same token appears more than once

actions:
  <token_A_UID>:
    type: DEPOSIT
    token_uid: <token_A_UID>
    amount: 100
  <token_A_UID>:
    type: DEPOSIT
    token_uid: <token_A_UID>
    amount: 50
  <token_B_UID>:
    type: DEPOSIT
    token_uid: <token_B_UID>
    amount: 10
  <token_B_UID>:
    type: WITHDRAWAL
    token_uid: <token_B_UID>
    amount: 30

Balances
Reading
As previously mentioned, the multi-token balance of a contract is not one of its attributes. As a result, to read its balance, a contract needs to use the following methods of the Context object:

get_balance(token_id: TokenUid) -> Amount
Reads the balance of the contract for a given token.
get_htr_balance() -> Amount
Reads the balance of the contract for HTR.
In the snippet below, we see examples of using these methods:

@public
def foo(self, ctx: Context, token_id: TokenUid) -> None:
  ...
  foo_balance = ctx.get_balance(token_id)

@view
def bar(self) -> None:
  ...
  bar_balance = ctx.get_htr_balance()


Note that Context does not know which tokens a contract can receive deposits from. From Context's point of view, a contract can have a non-zero balance of any token registered on Hathor ledger (blockchain).

Additionally, Context is also not capable of listing and informing the contract which tokens it has a non-zero balance of. Therefore, the contract needs to know in advance which token it wants to check the balance of. That is, it cannot discover at runtime which tokens are present in its multi-token balance. As a result, it is necessary to have attributes to store which tokens a contract can receive deposits from, and among those, which ones it has already received.

Updating
Public methods do not directly change the contract balance. Instead, they authorize or deny the whole set of deposit and withdrawal requests made by users in NC transactions. Once authorized, it is Hathor protocol that performs the deposits and withdrawals (in the resolution phase). As a result, you cannot have a statement in a public method that modifies the contract balance.

Public methods cannot create deposit actions. Obviously, a contract cannot create a deposit in itself. Only a user can decide to make a deposit to a contract.

Public methods cannot create withdrawal actions. For example, suppose you want to add logic to a public method that, at runtime, creates a withdrawal action of 10 tokens A to be sent to any address. Can this be done? No.

To reiterate, public methods cannot define fund transfers from their balance to an address at runtime. The logic of a public method should only update attributes and authorize or deny the whole set of deposits and withdrawals in the NC transaction that called it.

You should take this into account when designing your blueprint. For example, suppose you want to create a blueprint that models the use case of "collectible trading cards" (e.g., Pokémon TCG, baseball cards, Magic the Gathering) sold in "blind boxes." Let's see the requirements for this type of use case:

The use case comprises a collection of trading cards.
These cards are sold in "blind boxes," each containing, for example, 5 cards.
The contents of each blind box are hidden, random, and only revealed after being opened, containing any of the 5 cards in the collection.
The trading card will be modeled as a collection of NFTs, where each card is an NFT.
The contract will hold a supply of NFTs in its balance, to be used as a stock for the blind boxes.
The user interacts with the contract to purchase a blind box.
Each blind box costs, for example, 10 tokens A.
The contract is responsible for generating and selling these blind boxes.
When called to execute the sale of a blind box to a user, the contract should generate, randomly and at runtime, the user's blind box using the NFTs in its balance, which serves as its stock.
At first, you might think of modeling the sale of blind boxes in this blueprint as follows:

A user creates an NC transaction calling the buy_blind_box method and sending only a deposit of 10 tokens A, with no arguments in args.
buy_blind_box verifies that the deposit equates to the purchase of exactly 1 blind box, priced at 10 tokens A.
buy_blind_box randomly selects 5 NFTs from those available in its balance.
buy_blind_box sends the 5 NFTs to the caller's address.
However, as we've seen, it is not possible for the contract to decide to send funds at runtime. All fund transfers occur through withdrawals and must be previously requested in the calling NC transaction. So how can this use case be modeled, given that the user cannot know in advance which NFTs can be withdrawn from the contract?

To model this type of use case, two contract executions will always be necessary:

The first will request the purchase and generates the product.
The second will request to collect the purchased product.
For our collectible trading cards blueprint, we could model it as follows:

A public method buy_blind_box that receives purchase orders through a deposit, randomly generates the blind box, and then saves in the contract's state that the buyer's calling address is entitled to collect the 5 NFTs selected in the blind box.
A view method reveal_blind_box that the user will use to discover which NFTs they can withdraw. This would be the real life equivalent to opening the physical blind box package and looking at the cards.
A public method get_blind_box that the user will use to withdraw the 5 NFTs contained in the blind box they purchased from the contract.
Business logic
Design each public method so that they implement business rules in order to:

Authorize or deny the whole set of actions present in the calling NC transaction, based on its current state, the user passed arguments and the Context object.
Update the contract's attributes. This update may or may not include records that fund transfers (i.e., withdrawals) are available for given addresses.
However, it cannot provoke the send of funds by itself. There needs to be a specific method for this, like get_blind_box and new NC transactions requesting such transfers in the form of withdrawals from the contract.
For example, in the case of collectible trading cards mentioned in the previous section, the public method buy_blind_box should:

Verify that actions contains only one deposit action with a value of 10 tokens A (the sale price of the blind box).
Randomly select 5 of these NFTs from the universe of NFTs available in its balance.
Finally, update its attributes to record that the buyer, represented by the calling address (in the NC transaction), is entitled to withdraw the 5 selected NFTs.
The same applies to the public method get_blind_box:

Verify if actions contains exactly 5 actions, one to withdraw each NFT revealed in the blind box.
Verify if the calling address (in the NC transaction) is entitled to withdraw the 5 requested NFTs.
Update its attributes to record that the buyer has already collected their blind box.
End its execution by returning nothing (None), signaling to Hathor protocol that authorizes the withdrawals.
When designing your blueprint, remember that there are two reasons why users execute a nano contract: The first and most common (1) is when the user wants to utilize a functionality of the contract, which will most often result in a set of deposits and withdrawals that they can make to/from the contract. For example, a bet blueprint has the public method bet, which users use to place bets on a bet contract.

The second reason (2) is when a special type of user, called an oracle, wants to provide off-chain data that a contract needs to operate. Still using the bet blueprint as an example, it has the public method set_result to be used by the oracle to report the result of a betting event (e.g., a football match, an MMA fight, etc.).

Current capabilities
Blueprint composability
Blueprints are composable. Through Python's multiple inheritance, it is possible to develop blueprints that reuse and extend other blueprints, making them modular and flexible. For example, in the current catalog of Hathor platform, there is the bet blueprint. You can develop a blueprint called SportsBet that will be a subclass of the Bet class:

class SportsBet(Bet):
  """Sports bet blueprint that specifies useful stuff for sport events."""
  ...

Furthermore, a blueprint can inherit from multiple other blueprints simultaneously. For example, in the current catalog of the Hathor platform, there is the liquidity pool blueprint. You can develop a blueprint called LiquiditySports that is a subclass of both the Bet and LiquidityPool classes:

class LiquiditySports(Bet, LiquidityPool):
  """Liquidity pool for swapping placed bets."""
  ...

Oracles
Nano contracts support oracles. An oracle is an individual or organization that provides off-chain data that a contract needs to operate. You can define none, one, or multiple oracles to address different data demands in your blueprint. For example, in a sports bet contract, an oracle is required to inform the result of a match.

Each oracle is identified by a TxOutputScript. You will use this to ensure that only those defined as oracles can successfully execute a certain public method. For example, the bet blueprint has the public method set_result:

@public
def set_result(self, ctx: Context, result: SignedData[Result]) -> None:
  """Set final result. This method is called by the oracle."""
  self.fail_if_result_is_available()
  if not result.checksig(self.oracle_script):
    raise InvalidOracleSignature
  self.final_result = result.data

By comparing the data of the NC transaction that executed the contract (i.e., called the set_result method) with the oracle_script, the method will only allow the final_result to be set by the oracle. In a nutshell, any user can call the method through a valid NC transaction, but the execution will only be successful if it the transaction was signed by the entity defined as the oracle.

Cross-contract calls
Nano contracts are interoperable. This means that the execution of one contract is able to call another one. For example, suppose an NC transaction calls the execution of the abc method of the ABC contract. During its execution, the abc method of the ABC contract could call the execution of the cde method of the CDE contract.

This results in the possibility of call chains involving multiple contracts. For example, when called by ABC, the cde method of the CDE contract could call the execution of the efg method of the EFG contract, and so on.

Smart contracts nature
Some nano contract characteristics you need to consider are inherent to the nature of smart contracts in general. In other words, they are not unique to Hathor; they are common across all smart contract platforms.

Atomic
When modeling your blueprint, remember that the execution of a nano contract has atomic behavior. If the execution fails, nothing happens. If successful, all changes to the contract’s attributes occur, and all actions registered in the calling transaction are executed, thus changing the contract’s balance.

For example, suppose a nano contract ABC has a method abc. During its execution, abc changes the values of several of its attributes. If abc executes to completion without exceptions, it returns nothing (None), and Hathor protocol will execute all the deposits and withdrawals in the NC transaction that called abc. Thus, the state of the ABC contract will be updated.

On the other hand, if an exception occurs during the execution of abc, all attribute changes are discarded, none of the actions are performed, and the contract's state does not change.

Passive
Like conventional smart contracts, nano contracts are passive. They only execute when called through transactions validated on the blockchain. Event-driven logic cannot be implemented in blueprints and must instead be implemented off-chain, in components of integrated systems. Note that this is not unique to Hathor; it is common across all smart contract platforms.

What's next?
Blueprint development — nano contracts flow: to consult while designing a blueprint.
Blueprint development — API: to consult the API provided by the blueprint SDK for developers.
Develop a blueprint — part 1: hands-on tutorial to assist developers to conceive and design a blueprint.
Develop a blueprint — part 2: hands-on tutorial to assist developers to implement and test a blueprint.
Set up a localnet: for integration testing of blueprints, nano contracts, and DApps.