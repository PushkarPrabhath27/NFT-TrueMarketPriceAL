Develop a blueprint — part 2
Introduction
This article is part 2 of the 2-part tutorial to assist developers in getting started with the blueprint SDK. By the end of the tutorial, you will have developed your first blueprint using the SDK. In this part, you will implement (code) and test your first blueprint.

If you haven't completed part 1 of this tutorial yet, proceed to Develop a blueprint — part 1.

Background
Hathor core — the official and reference client for a Hathor full node — provides a software development kit (SDK) for blueprint development in Python 3.

Prerequisite
To execute this part of the tutorial, first install Hathor core from source code. See:
How to install Hathor core from source code

Then, to use the blueprint SDK, download and switch to the branch experimental/nano-testnet-v1.7.3.

Overview of the task
In part 1 of this tutorial, we conceived and designed the blueprint. In this part, we implement (code) and test the designed blueprint. Let's continue using the simple swap contract as an example for our blueprint.

Using the blueprint SDK, each blueprint should be implemented as a single module. In addition, a second module containing the unit tests for the blueprint should be written.

Thus, during this tutorial, we will code the following two new Python modules in hathor-core:

hathor-core/hathor/nanocontracts/blueprints/swap.py
hathor-core/tests/nanocontracts/blueprints/test_swap.py
We suggest you expand the following pane and perform an inspectional reading of the entire blueprint's code that we will develop. This will give you the initial context needed to understand the step-by-step we will perform throughout the tutorial:

hathor-core/hathor/nanocontracts/blueprints/swap.py
Sequence of steps
We will represent the process of implementing and testing our blueprint's code through a hands-on walkthrough divided into this sequence of steps:

Create the blueprint module.
Write the initialize method.
Write the swap method.
Write the is_ratio_valid method.
Review the blueprint module.
Create the unit test module.
Write the test_lifecycle method.
Write the _initialize method.
Write the _swap method.
Review the blueprint unit test module.
Task execution
Now, it's time to get your hands dirty. In this section, we will describe the steps in detail.

To begin, let's suppose you have already opened Hathor core source code in your code editor.

Step 1: create the blueprint module
In the project directory tree, navigate to /hathor/nanocontracts/blueprints/. There, you will find the source code of all built-in blueprints. Each blueprint is implemented as a single module.

Let's create the swap.py file for our blueprint, and add the standard imports that are necessary for (if not all) almost all blueprints:
hathor-core/hathor/nanocontracts/blueprints/swap.py
from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import NCActionType, TokenUid, public, view

Let's understand the utility of each of these imports:

Blueprint is the base class for defining blueprints.
Context is the class that models the context in which a transaction on the blockchain calls a blueprint method. Through a Context object, a blueprint method can access data from the calling transaction.
NCFail is the base class that models failures in contract execution as exceptions.
NCActionType is the class that models the possible actions that can be taken with a contract by the blockchain from an accounting perspective. An action can be a 'deposit' or a 'withdrawal' of a token held by a contract.
TokenUid is an alias for the bytes type. In Hathor, a token is identified by a unique 32-byte identifier.
public is a decorator used to mark a blueprint method as public, meaning a method that is only executed if called from a validated transaction on the blockchain.
view is a decorator used to mark a blueprint methods as view, meaning a methods that can't change the contract state.
We define our Swap class that inherits from Blueprint, and that will model swap contracts:
hathor-core/hathor/nanocontracts/blueprints/swap.py
from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import NCActionType, TokenUid, public, view

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

Our class will then have five instance attributes. The use of type annotations, although not required, will facilitate the understanding of our code:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  # TokenA identifier and quantity multiplier.
  token_a: TokenUid
  multiplier_a: int

  # TokenB identifier and quantity multiplier.
  token_b: TokenUid
  multiplier_b: int

  # Count number of swaps executed.
  swaps_counter: int

Step 2: write the initialize method
Every blueprint must implement the public method initialize. All public methods must be marked with the public decorator. By doing this, we allow Hathor protocol to check if the transaction called a method that it could call — i.e., a public method.

Parameters
For the proper initialization of a swap contract, the transaction must provide as arguments the two tokens with which the contract will operate (token_a and token_b) and the conversion ratio between them (defined by multiplier_a and multiplier_b). Additionally, a Context object must also be passed as an argument.

A Context object provides:

tx: the transaction id that called the method.
address: the wallet address that called the method.
timestamp: the timestamp of the first block confirming the transaction.
actions: a dictionary where the keys are token_uid and the values are NCAction objects.
In turn, an NCAction object is a tuple that contains:

type of the action, which can be DEPOSIT or WITHDRAWAL.
token_uid that identifies the token to which the deposit or withdrawal action refers.
amount that describes the quantity (amount) of tokens to be transferred to or from the contract's balance.
actions denotes the set of deposits and withdrawals that the transaction is requesting to be made to and/or from the contract. Note that Hathor protocol will not validate transactions that have two action referring to the same token (token_uid). Thus, we will only receive in our blueprint as arguments for public method calls a Context object in which each token is related to a single deposit or withdrawal.

initialize signature
As mentioned in part 1 (of this tutorial), the methods of a contract cannot alter its balance. When a public method successfully completes its execution — that is, it runs to completion without raising exceptions — it should not produce a return value (it returns None), and then all actions contained in the set of actions are executed simultaneously on the blockchain. That is, all the deposits and withdrawals requested by the transaction.

For this, we define the following signature and docstring for our initialize method:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def initialize(
    self,
    ctx: Context,
    token_a: TokenUid,
    token_b: TokenUid,
    multiplier_a: int,
    multiplier_b: int
  ) -> None:
    """Initialize the contract."""

Let's see how blockchain users will make use of this method. Let's use again the example presented in part 1, where we assume a user wants to create a swap contract that operates with tokens A and B, with a conversion rate of 2/1, and initially wants to load the contract with 200 tokens A and 100 tokens B.

To do this, they will need to submit an NC transaction to Hathor Network with the following terms:

nc_id that identifies the blueprint we are creating on Hathor (it will exist once the blueprint is added to Hathor platform);
nc_method: 'initialize';
nc_args: 'token_a'='<token_A_UID>', 'token_b'='<token_B_UID>', 'multiplier_a'=2, 'multiplier_b'=1; and
inputs and outputs: consolidating two deposits of 200 tokens A and 100 tokens B.
Hathor protocol will 'translate' this set of inputs and outputs as two deposits that should be made from the wallet that signed the inputs to the contract. Note that the actions are not already set up in the NC transactions. It is Hathor protocol that, at transaction processing time, assembles the Context object, so we don't need to worry about them.

Validating business rules
For the correct initialization of the contract, we must ensure that the arguments passed in the method call are correct. Hathor protocol guarantees the implementation of default checks required for all method calls. For example, during initialization, the balance of any contract will always be zero. Therefore, if a transaction calls the initialize method containing withdrawal requests, the method will not even be invoked. Another situation that generates invalidity and discards the transaction is a deposit or withdrawal request for a token with an nonexistent id i.e., not registered on the blockchain.

Thus, we only need to worry about the checks related to our business rules. First, let's check if the contract creator has passed two distinct tokens for the contract to operate:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def initialize(
    self,
    ctx: Context,
    token_a: TokenUid,
    token_b: TokenUid,
    multiplier_a: int,
    multiplier_b: int
  ) -> None:
    """Initialize the contract."""

    if token_a == token_b:
      raise NCFail

As specified during the blueprint design, the contract creator must provide initial liquidity for the contract to operate. Let's then implement a check to ensure that the initial deposits of tokens made by the contract creator are only of the two tokens that they defined for the contract's operation:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def initialize(
    self,
    ctx: Context,
    token_a: TokenUid,
    token_b: TokenUid,
    multiplier_a: int,
    multiplier_b: int
  ) -> None:
    """Initialize the contract."""

    if token_a == token_b:
      raise NCFail

    if set(ctx.actions.keys()) != {token_a, token_b}:
      raise InvalidTokens

class InvalidTokens(NCFail):
  pass

Remember that actions from ctx is a dictionary in which the keys are token_uid and the values are action themselves. Also, note that we have defined a subclass to specify the NCFail exception for cases where an attempt is made to deposit tokens that the contract does not operate with.

Initializing contract state
Finally, we can assign the appropriate values to the contract's attributes:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""
  ...

  @public
  def initialize(
    self,
    ctx: Context,
    token_a: TokenUid,
    token_b: TokenUid,
    multiplier_a: int,
    multiplier_b: int
  ) -> None:
    """Initialize the contract."""

    if token_a == token_b:
      raise NCFail

    if set(ctx.actions.keys()) != {token_a, token_b}:
      raise InvalidTokens

    self.token_a = token_a
    self.token_b = token_b
    self.multiplier_a = multiplier_a
    self.multiplier_b = multiplier_b
    self.swaps_counter = 0

class InvalidTokens(NCFail):
  pass

After the successful execution of the initialize method, a new instance of a nano contract is registered on the blockchain, and its initial state is set. During its execution, initialize defines the initial values for all attributes. However, these attributes are only saved, and the deposits outlined in the calling transaction processed, after the method has successfully executed, thus establishing the initial state of the contract.

Step 3: write the swap method
To fulfill the functionality defined in our blueprint design, we need to code just one public method to execute token swaps. The contract user must submit a transaction to the blockchain in which they call the swap method tied to precisely two actions: the deposit of one token and the proportional withdrawal of the other.

swap signature
Thus, calling the swap method does not require the contract user to pass any additional arguments. All necessary information will be found within the Context created by the protocol during the transaction processing:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def initialize(
    self,
    ctx: Context,
    token_a: TokenUid,
    token_b: TokenUid,
    multiplier_a: int,
    multiplier_b: int
  ) -> None:
    """Initialize the contract."""
    ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""

class InvalidTokens(NCFail):
  pass

Let's see how blockchain users will make use of this method. Suppose, for example, that a user wants to use the contract created in the previous step to convert 10 tokens A for 30 tokens B. For this, they should send a transaction to the blockchain in the following terms:

nc_id which identifies the blockchain record of the swap contract created in previous step.
nc_method: 'swap'
nc_args: no arguments are needed.
inputs: the total of the inputs must equal 10 tokens A (excluding any change), which will be transferred from the wallet that signed the inputs to the contract.
outputs: the total of the outputs must equal 30 tokens B (excluding any change in tokens A), which will be transferred from the contract to the addresses in outputs (as chosen by the user).
Note that the NC transaction submitted must necessarily have all the inputs and outputs which, when interpreted by the protocol, will give rise to the deposit and withdrawal in the contract. Thus, what the contract execution will do is only validate if the transaction meets all the business rules of the contract. The contract execution does not create new withdrawal actions. The request for withdrawal must already be described in the transaction as outputs.

Validating business rules
Remember that the standard check of Hathor protocol ensures that a contract is not invoked if there are actions requesting withdrawals exceeding the available balance.

Like the initialize method, we will code our swap method as follows: we perform all the checks to ensure that the contract user's request is correct and executable, and then we update the contract's state. Remember that actions encapsulated in ctx is a dictionary whose keys are token_uid. Thus, we know that each action refers to a distinct token.

Let's start by checking if the contract user has sent exactly two actions, and if each of them refers to one of the tokens with which the contract operates:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""

    if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
      raise InvalidTokens

class InvalidTokens(NCFail):
  pass

Once confirmed that we have received two actions, one for each of the tokens the contract operates, we will store them in local variables:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""

    if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
      raise InvalidTokens

    action_a = ctx.actions[self.token_a]
    action_b = ctx.actions[self.token_b]

class InvalidTokens(NCFail):
  pass

Now let's check if the two actions correspond respectively to a deposit and a withdrawal:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""

    if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
      raise InvalidTokens

    action_a = ctx.actions[self.token_a]
    action_b = ctx.actions[self.token_b]

    if {action_a.type, action_b.type} != {NCActionType.WITHDRAWAL, NCActionType.DEPOSIT}:
      raise InvalidActions

class InvalidTokens(NCFail):
  pass

class InvalidActions(NCFail):
  pass

Note that we have defined a subclass of NCFail to specialize the exception that occurs when the method does not receive exactly one DEPOSIT action and one WITHDRAWAL action.

Now, we just need to check if the quantities of tokens requested by the contract user for withdrawal and deposit comply with the conversion ratio defined by the contract. Define a helper method to perform this check:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""

    if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
      raise InvalidTokens

    action_a = ctx.actions[self.token_a]
    action_b = ctx.actions[self.token_b]

    if {action_a.type, action_b.type} != {NCActionType.WITHDRAWAL, NCActionType.DEPOSIT}:
      raise InvalidActions

    if not self.is_ratio_valid(action_a.amount, action_b.amount):
      raise InvalidRatio

class InvalidTokens(NCFail):
  pass

class InvalidActions(NCFail):
  pass

class InvalidRatio(NCFail):
  pass

Note that we have defined a subclass of NCFail to specialize the exception that occurs when the conversion requested by the contract user is not compatible with that defined by the contract.

Updating contract state
At this point, the swap request has passed all checks. We update the contract's state and conclude the method execution:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""

    if set(ctx.actions.keys()) != {self.token_a, self.token_b}:
      raise InvalidTokens

    action_a = ctx.actions[self.token_a]
    action_b = ctx.actions[self.token_b]

    if {action_a.type, action_b.type} != {NCActionType.WITHDRAWAL, NCActionType.DEPOSIT}:
      raise InvalidActions

    if not self.is_ratio_valid(action_a.amount, action_b.amount):
      raise InvalidRatio

    # All good! Let's accept the transaction.
    self.swaps_counter += 1

class InvalidTokens(NCFail):
  pass

class InvalidActions(NCFail):
  pass

class InvalidRatio(NCFail):
  pass

Just like any public method, if no exception is raised during execution, the method will have executed successfully, it will end returning nothing (None), the contract's state will have been updated, and after that, Hathor protocol — not the contract — will take care of updating the multi-token balance of the contract, according to the set of inputs and outputs of the NC transaction that was approved. This characterizes that all actions (deposits and withdrawals) are then executed simultaneously on the blockchain.

Step 4: write the is_ratio_valid method
We have already implemented the two public methods necessary for the creation and execution of the contract respectively. To complete the module of our blueprint, we only need to write the is_ratio_valid method we defined in the previous step. is_ratio_valid is a helper method, existing solely to make the code of our blueprint more readable, and thus it is internal.

is_ratio_valid should check if the quantities of tokens the user wishes to swap are proportional to the ratio with which the contract operates. For this, it will receive as parameters (in addition to the contract instance itself) the two quantities of tokens from the two actions, and should return True if the ratio is valid:
hathor-core/hathor/nanocontracts/blueprints/swap.py
...

class Swap(Blueprint):
  """Blueprint to execute swaps between tokens."""

  ...

  @public
  def initialize(
    self,
    ctx: Context,
    token_a: TokenUid,
    token_b: TokenUid,
    multiplier_a: int,
    multiplier_b: int
  ) -> None:
    """Initialize the contract."""
    ...

  @public
  def swap(self, ctx: Context) -> None:
    """Execute a token swap."""
  ...

  def is_ratio_valid(self, qty_a: int, qty_b: int) -> bool:
    """Check if the swap quantities are valid."""
    return (self.multiplier_a * qty_a == self.multiplier_b * qty_b)

class InvalidTokens(NCFail):
  pass

class InvalidActions(NCFail):
  pass

class InvalidRatio(NCFail):
  pass

Step 5: review the blueprint module
With this, we have completed the code for our blueprint. Let's review the complete code of the module we just implemented before moving on to the testing phase:

hathor-core/hathor/nanocontracts/blueprints/swap.py
Step 6: create the unit test module
With our blueprint code ready, it's time to verify that it behaves as intended. The blueprint SDK provides a framework based on the Python package pytest to facilitate the execution of automated unit tests. Let's use it to code our test suite.

As we did previously with the blueprint's code, we suggest that you expand the following pane and perform an inspectional reading of the entire unit test module that we will develop. This will provide the necessary context to understand the steps we will undertake from this point forward:

hathor-core/tests/nanocontracts/blueprints/test_swap.py
In the project directory tree, navigate to /tests/nanocontracts/blueprints/. There you will find the code of the unit test suite for all built-in blueprints. The unit test suite for each blueprint is implemented as a single module.

Let’s create the test_swap.py file, and add the standard imports that are necessary for (if not all) almost all blueprints unit test suites:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.types import NCAction, NCActionType, TokenUid
from tests.nanocontracts.blueprints.unittest import BlueprintTestCase
from hathor.nanocontracts.blueprints.swap import Swap, InvalidTokens, InvalidActions, InvalidRatio

Of these four imports, two have not appeared in our blueprint module and thus have not been explained yet:

Swap, Invalid Tokens, InvalidAtions, Invalid Ratio, are all relevant classes for testing our blueprint module.
BlueprintTestCase is the class that abstracts all elements necessary for unit tests that are standard for all blueprints, such as test fixtures and implementation of default test doubles.
Blueprint test cases
Remember that the state of a contract consists of the state of the object instantiated from the blueprint, plus its multi-token balance. Also, through the execution of public methods, a contract can change the value of its attributes, but not directly its multi-token balance. As previously mentioned, it is up to Hathor protocol to update the balance, once such an update (transaction) is valid from the blockchain's perspective, and the execution of a public method called in a transaction has been successful.

The implication for unit testing is that to test our blueprint, we need the public method calls to be made by emulating the conditions under which they are called by Hathor protocol. Fortunately, the blueprint SDK handles this for us through the use of the superclass BlueprintTestCase and the runner object. The superclass BlueprintTestCase creates a fake blockchain system, and the runner object is able to perform the role it normally does in the Hathor core, of invoking the execution of methods from a blueprint.

We define our SwapTestCase class that inherits from BlueprintTestCase:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.types import NCAction, NCActionType, TokenUid
from tests.nanocontracts.blueprints.unittest import BlueprintTestCase
from hathor.nanocontracts.blueprints.swap import Swap, InvalidTokens, InvalidActions, InvalidRatio

class SwapTestCase(BlueprintTestCase):

Conceiving the test case
With this in mind, we can think about what needs to be tested in our blueprint. We need to test the following blueprint interactions:

Contract creation
Contract execution
In other words, we need to test the public methods of the blueprint. We need to ensure that the two public methods initialize and swap execute successfully when given appropriate inputs and fail as expected when given inappropriate inputs.

Let's then follow this sequence in our test case: (1) create a valid contract; (2) execute a valid swap; (3) execute all the swaps that should fail, one for each exception we defined.

Outlining the methods
For this, we will implement a single test method test_lifecycle that performs all these tests, simulating the usual lifecycle of a contract on the blockchain:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  def test_lifecycle(self) -> None:
    # Create a contract.
    # TO DO
    # Make a valid swap.
    # TO DO
    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

To make it possible to create as many new test flows as we want beyond test_lifecycle, and to avoid code repetition in multiple calls to the public methods initialize and swap, we will create the helper methods _initialize and _swap. These should prepare the necessary objects to be sent to the blueprint (arrange) and call the respective method using the runner (act):
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  # def _initialize(self, TO DO) -> None:
    # TO DO

  # def _swap(self, TO DO) -> None:
    # TO DO

  def test_lifecycle(self) -> None:
    # Create a contract.
    # TO DO
    # Make a valid swap.
    # TO DO
    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

Now, we just need to add the setUp method to our class, standard to every test case using pytest:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  def setUp(self):
    super().setUp()
    # TO DO

  # def _initialize(self, TO DO) -> None:
    # TO DO

  # def _swap(self, TO DO) -> None:
    # TO DO

  def test_lifecycle(self) -> None:
    # Create a contract.
    # TO DO
    # Make a valid swap.
    # TO DO
    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

After finishing the coding of the four methods we defined, we will complete the implementation of our class, as well as the entire test module. Let's code them in the following sequence: (1) first the test_lifecycle method, defining the test flow; (2) then the _initialize method; and (3) finally the _swap method. (4) The setUp method will be used to create all necessary test doubles, and therefore will be written ad hoc throughout the process.

Our test execution will start with unittest invoking the setUp method for the necessary preliminary preparation for the tests. The statement super().setUp() carries out the standard preparation required for testing any blueprint.

Add to the setUp method the creation of a dummy contract and its registration, along with the blueprint, on chain:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  def setUp(self):
    super().setUp()
    self.contract_id = self.gen_random_nanocontract_id()
    self.runner.register_contract(Swap, self.contract_id)
    self.nc_storage = self.runner.get_storage(self.contract_id)
    # TO DO

  ...

Step 7: write the test_lifecycle method
Our flow starts with the creation of a swap contract.

Testing contract creation
To create a swap contract, a user will send an NC transaction calling the initialize method of our blueprint. Like any NC transaction, it can have multiple DEPOSIT and WITHDRAWAL actions, and for our blueprint, it must have four mandatory arguments: (1) the two distinct tokens with which the contract will operate; and (2) the respective multipliers for each token.

Considering this is a contract creation transaction, the protocol will ensure there are no withdrawal actions. We only need to test the four arguments and the deposit quantities for each token.

The creation call of a swap contract requires sending two valid tokens on the blockchain as arguments. Let's add to setUp the creation of two dummy tokens, using gen_random_token_uid() already implemented in the superclass:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  def setUp(self):
    super().setUp()
    self.contract_id = self.gen_random_nanocontract_id()
    self.runner.register_contract(Swap, self.contract_id)
    self.nc_storage = self.runner.get_storage(self.contract_id)

    # Test doubles:
    self.token_a = self.gen_random_token_uid()
    self.token_b = self.gen_random_token_uid()
    # TO DO

  ...

All other arguments for creating a contract can be arbitrary literals, and with that, we can already create a valid contract. Note that this defines the signature of the _initialize method:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))

    # Make a valid swap.
    # TO DO
    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

Our _initialize method receives two identical tuples: (token, token's multiplicative factor, and token amount to be deposited). Let's check if the contract's state was correctly initialized:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))

    # Assert:
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(0, self.nc_storage.get('swaps_counter'))

    # Make a valid swap.
    # TO DO
    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

Note that assertEqual and nc_storage are implemented in the superclass of our test class.

Testing successful contract executions
With our swap contract created, let's test a valid swap case.

To execute the contract, i.e., to perform a swap, the user must submit a transaction to the blockchain calling the swap method without passing any additional arguments. In this case, we only need to test the actions. In our contract, there must be exactly two actions, one deposit of token A and one withdrawal of token B, in amounts determined by the ratio:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))
    # Assert:
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(0, self.nc_storage.get('swaps_counter'))

    # Make a valid swap.
    # Arrange and act within:
    self._swap((20_00, self.token_a), (-20_00, self.token_b))

    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

Note that we defined the signature of the _swap method with two tuples as parameters, one for the action of each token. The blueprint SDK allows us to use negative numbers to encapsulate in the amounts the type of action: positive token amounts denote a deposit, and negative a withdrawal. This facilitates coding and readability of tests.

We now need to ensure that the state of the contract — multi-token balance and attribute values — was updated correctly after contract execution:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))
    # Assert:
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(0, self.nc_storage.get('swaps_counter'))

    # Make a valid swap.
    # Arrange and act within:
    self._swap((20_00, self.token_a), (-20_00, self.token_b))
    self.assertEqual(120_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(80_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(1, self.nc_storage.get('swaps_counter'))

    # Make multiple invalid swaps raising all possible exceptions.
    # TO DO

Testing unsuccessful contract executions
Now let's make swap attempts that should fail. Recall that during the implementation of our blueprint, we created classes specifying the three exceptions that can make a contract execution fail. This facilitates checking the failure cases.

The first case to check is requests for swaps of tokens with which the contract does not operate with. Recall that before invoking a contract's execution, Hathor protocol verifies if the tokens from deposit and withdrawal actions exist on blockchain. Therefore, let's create a dummy token C, which exists on blockchain but is not operated by the contract:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  def setUp(self):
    super().setUp()
    self.runner = self.create_runner(Swap)

    # Test doubles:
    self.token_a = self.gen_random_token_uid()
    self.token_b = self.gen_random_token_uid()
    self.token_c = self.gen_random_token_uid()
    # TO DO

  ...

Check if the expected execution failure occurs when a user requests a swap of at least one token that the contract does not operate with. It should return the InvalidTokens exception:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))
    # Assert:
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(0, self.nc_storage.get('swaps_counter'))

    # Make a valid swap.
    # Arrange and act within:
    self._swap((20_00, self.token_a), (-20_00, self.token_b))
    # Assert:
    self.assertEqual(120_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(80_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(1, self.nc_storage.get('swaps_counter'))

    # Make multiple invalid swaps raising all possible exceptions.
    with self.assertRaises(InvalidTokens):
      self._swap((-20_00, self.token_a), (20_00, self.token_c))

Now, check if the user sent actions related to the two tokens with which the contract operates with, but they were not one deposit and one withdrawal. It should return the InvalidActions exception:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))
    # Assert:
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(0, self.nc_storage.get('swaps_counter'))

    # Make a valid swap.
    # Arrange and act within:
    self._swap((20_00, self.token_a), (-20_00, self.token_b))
    # Assert:
    self.assertEqual(120_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(80_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(1, self.nc_storage.get('swaps_counter'))

    # Make multiple invalid swaps raising all possible exceptions.
    with self.assertRaises(InvalidTokens):
      self._swap((-20_00, self.token_a), (20_00, self.token_c))
    with self.assertRaises(InvalidActions):
      self._swap((20_00, self.token_a), (40_00, self.token_b))

Finally, check if the tokens and actions are correct, but the deposit and withdrawal quantities do not correspond to the contract's conversion ratio. It should return the InvalidRatio exception:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def test_lifecycle(self) -> None:
    # Create a contract.
    # Arrange and act within:
    self._initialize((self.token_a, 1, 100_00), (self.token_b, 1, 100_00))
    # Assert:
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(100_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(0, self.nc_storage.get('swaps_counter'))

    # Make a valid swap.
    # Arrange and act within:
    self._swap((20_00, self.token_a), (-20_00, self.token_b))
    # Assert:
    self.assertEqual(120_00, self.nc_storage.get_balance(self.token_a))
    self.assertEqual(80_00, self.nc_storage.get_balance(self.token_b))
    self.assertEqual(1, self.nc_storage.get('swaps_counter'))

    # Make multiple invalid swaps raising all possible exceptions.
    with self.assertRaises(InvalidTokens):
      self._swap((-20_00, self.token_a), (20_00, self.token_c))
    with self.assertRaises(InvalidActions):
      self._swap((20_00, self.token_a), (40_00, self.token_b))
    with self.assertRaises(InvalidRatio):
      self._swap((20_00, self.token_a), (-40_00, self.token_b))

Step 8: write the _initialize method
Our helper method _initialize will prepare all objects that our blueprint's initialize needs to receive (arrange); then, it will use the runner to call initialize from swap (act).

_initialize already receives within its parameters the four arguments that must be passed to initialize:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _initialize(
    self,
    init_token_a: tuple[TokenUid, int, int],
    init_token_b: tuple[TokenUid, int, int]
  ) -> None:

  ...

Now we need to create the context object. To create context, we need dummy values for tx and address. For this, we will proceed similarly to what we did with the tokens, adding dummy creation in setUp:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  def setUp(self):
    super().setUp()
    self.contract_id = self.gen_random_nanocontract_id()
    self.runner.register_contract(Swap, self.contract_id)
    self.nc_storage = self.runner.get_storage(self.contract_id)

    # Test doubles:
    self.token_a = self.gen_random_token_uid()
    self.token_b = self.gen_random_token_uid()
    self.token_c = self.gen_random_token_uid()
    self.address = self.gen_random_address()
    self.tx = self.get_genesis_tx()

  ...

Unpack the received parameters into local variables:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _initialize(
    self,
    init_token_a: tuple[TokenUid, int, int],
    init_token_b: tuple[TokenUid, int, int]
  ) -> None:
    # Arrange:
    token_a, multiplier_a, amount_a = init_token_a
    token_b, multiplier_b, amount_b = init_token_b

  ...

Create the two actions needed to form the context object:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _initialize(
    self,
    init_token_a: tuple[TokenUid, int, int],
    init_token_b: tuple[TokenUid, int, int]
  ) -> None:
    # Arrange:
    token_a, multiplier_a, amount_a = init_token_a
    token_b, multiplier_b, amount_b = init_token_b
    deposit_a = NCAction(NCActionType.DEPOSIT, token_a, amount_a)
    deposit_b = NCAction(NCActionType.DEPOSIT, token_b, amount_b)

  ...

And then, create the context object:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _initialize(self, init_token_a: tuple[TokenUid, int, int], init_token_b: tuple[TokenUid, int, int]) -> None:
    # Arrange:
    token_a, multiplier_a, amount_a = init_token_a
    token_b, multiplier_b, amount_b = init_token_b
    deposit_a = NCAction(NCActionType.DEPOSIT, token_a, amount_a)
    deposit_b = NCAction(NCActionType.DEPOSIT, token_b, amount_b)
    context = Context(
      actions = [deposit_a, deposit_b],
      vertex = self.tx,
      address = self.address,
      timestamp = self.now
    )

  ...


Note that now is implemented in the superclass to generate an int type timestamp.

Finally, it's time to use the runner to call the method under test, as it's done in the Hathor core:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _initialize(self, init_token_a: tuple[TokenUid, int, int], init_token_b: tuple[TokenUid, int, int]) -> None:
    # Arrange:
    token_a, multiplier_a, amount_a = init_token_a
    token_b, multiplier_b, amount_b = init_token_b
    deposit_a = NCAction(NCActionType.DEPOSIT, token_a, amount_a)
    deposit_b = NCAction(NCActionType.DEPOSIT, token_b, amount_b)
    context = Context(
            actions = [deposit_a, deposit_b],
            tx = self.tx,
            address = self.address,
            timestamp = self.now
    )

    # Act:
    self.runner.call_public_method(self.contract_id, 'initialize', context, token_a, token_b, multiplier_a, multiplier_b)

  ...


Step 9: write the _swap method
Our helper method _swap will function similarly to _initialize, but it will handle the execution of contracts by calling the swap method.

In test_lifecycle, we already defined the signature for _initialize as having two tuples as parameters. Each tuple contains a value (amount plus type of action) and the token involved in the conversion:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _swap(
    self,
    amount_a: tuple[int, TokenUid],
    amount_b: tuple[int, TokenUid]
  ) -> None:

  ...

Unpack the received parameters into local variables:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _swap(
    self,
    amount_a: tuple[int, TokenUid],
    amount_b: tuple[int, TokenUid]
  ) -> None:
    # Arrange:
    value_a, token_a = amount_a
    value_b, token_b = amount_b

  ...

Now we need to create the context object containing the two actions that make up a swap. Remember that the type of action is encapsulated in the sign of the amount passed as a parameter. We will also write the _get_action_type helper method to define the type of action:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _get_action_type(self, amount: int) -> NCActionType:
    if amount >= 0:
        return NCActionType.DEPOSIT
    else:
        return NCActionType.WITHDRAWAL

  ...

  def _swap(
    self,
    amount_a: tuple[int, TokenUid],
    amount_b: tuple[int, TokenUid]
  ) -> None:
    # Arrange:
    value_a, token_a = amount_a
    value_b, token_b = amount_b
    swap_a = NCAction(self._get_action_type(value_a), token_a, abs(value_a))
    swap_b = NCAction(self._get_action_type(value_b), token_b, abs(value_b))
  ...

And then, create the context object:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _swap(
    self,
    amount_a: tuple[int, TokenUid],
    amount_b: tuple[int, TokenUid]
  ) -> None:
    # Arrange:
    value_a, token_a = amount_a
    value_b, token_b = amount_b
    swap_a = NCAction(self._get_action_type(value_a), token_a, abs(value_a))
    swap_b = NCAction(self._get_action_type(value_b), token_b, abs(value_b))
    context = Context(
      actions = [swap_a, swap_b],
      vertex = self.tx,
      address = self.address,
      timestamp = self.now
    )
  ...

Finally, it's time to use the runner to call the method under test, as it's done in the Hathor core:
hathor-core/tests/nanocontracts/blueprints/test_swap.py
...

class SwapTestCase(BlueprintTestCase):

  ...

  def _swap(self, amount_a: tuple[int, TokenUid], amount_b: tuple[int, TokenUid]) -> None:
    # Arrange:
    value_a, token_a = amount_a
    value_b, token_b = amount_b
    swap_a = NCAction(self._get_action_type(value_a), token_a, abs(value_a))
    swap_b = NCAction(self._get_action_type(value_b), token_b, abs(value_b))
    context = Context(
            actions = [swap_a, swap_b],
            tx = self.tx,
            address = self.address,
            timestamp = self.now
    )

    # Act:
    self.runner.call_public_method(self.contract_id, 'swap', context)
  ...

Step 10: review the blueprint unit test module
With this, we have completed the code for our test suite. Let's review the complete code of the module we just implemented before starting running the tests:

hathor-core/tests/nanocontracts/blueprints/test_swap.py
Task completed
At this point, you have completed the source code for your first blueprint using the blueprint SDK. Now, it's time to run your suite of automated unit tests. Start a shell session, navigate to the root of the hathor-core project and perform the tests using pytest:

~/hathor-core
poetry run pytest -v -n0 tests/nanocontracts/blueprints/test_swap.py \
  -W ignore::DeprecationWarning \
  -W ignore::PendingDeprecationWarning \
  -W ignore::FutureWarning

Key takeaways
Keep in mind that the automated unit testing approach presented in this article is the quickest, easiest, and most practical way to test your blueprint. After these tests, the blueprint SDK also provides tools for integration testing, in which a complete blockchain test system is run, and it is then possible to instantiate nano contracts on chain from the developed blueprint.

What's next?
Blueprint development — nano contracts flow: to consult while designing a blueprint.
Blueprint development — guidelines: main guidelines to consult while developing a blueprint.
Develop a blueprint — part 1: hands-on tutorial to assist developers to conceive and design a blueprint.
Set up a localnet: for integration testing of blueprints, nano contracts, and DApps.
Previous