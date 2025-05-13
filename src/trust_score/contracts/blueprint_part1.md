Develop a blueprint — part 1
Introduction
This article is part 1 of a 2-part tutorial to assist developers in getting started with the blueprint SDK. By the end of the tutorial, you will have developed your first blueprint using the SDK. In this part, you will conceive and design your first blueprint.

Background
A blueprint is source code present on Hathor platform that is shared among all its instantiated contracts, as a class in object-oriented programming (OOP). Each nano contract has its structure and behavior defined by a single blueprint.

Overview of the task
Our tutorial is divided into two parts. In this part (1), we begin by conceiving and designing our blueprint. In part 2, we conclude by implementing (coding) and testing it. To illustrate our tutorial, let’s use a simple swap contract as an example.

Swap contracts allow users to convert one token into another. Suppose we want to create swap contracts on Hathor Network. For this purpose, a blueprint that models such use cases is necessary, from which multiple contracts can be instantiated.

Let’s also suppose that, after evaluating Hathor blueprints catalog, we understand that none of the available blueprints meet our use case, and we decide to develop a new blueprint called "swap".

Sequence of steps
We will represent the process of conceiving and designing our blueprint through a walkthrough divided into this sequence of steps:

Specify requirements.
Model contract interactions.
Model contract state.
Model contract creation.
Model contract execution.
Model execution failures.
Task execution
Now, it's time to get your hands dirty. In this section, we will describe the steps in detail.

Step 1: specify requirements
The swap contracts we want to create should meet the following requirements:

Each swap contract must operate with exactly two tokens — e.g., tokens A and B.
Each contract user may request the conversion of either of the two tokens into the other — i.e., converting tokens A for B, or vice versa.
Both possible conversions will follow the same conversion ratio — e.g., the contract converts tokens A for B at a ratio of 2:1 and tokens B for A at a ratio of 1:2.
The contract must custody both tokens A and B, and the contract creator must provide initial liquidity for the contract to operate.
The contract should not provide "change" to users. That is, users must provide an amount of tokens in the exact proportion they wish to convert them into another token.
Step 2: model contract interactions
To model the interactions a user can have with our swap contracts, we need to understand what interactions are possible and how they occur between a user and a (generic) nano contract.

User-contract interactions
There are three possible interactions a user can have with contracts:

Creation
Execution
Reading
A user creates and executes a contract by submitting valid NC transactions to Hathor Network. In turn, readings are made by direct queries to the full node.

To create a contract, a user should submit an NC transaction to the network such that:

nc_id identifies an existing blueprint on Hathor platform; and
nc_method calls the initialize method.
If the initialize method is called with an nc_id that does not correspond to an existing blueprint, Hathor protocol will deem the transaction invalid and discard it. Therefore, we do not need to worry about the initialize method being called twice for the same contract instance; Hathor protocol already prevents this.

Now, to execute a contract, a user should submit an NC transaction to the network such that:

nc_id identifies a contract registered on chain (i.e., previously created); and
nc_method calls a public method of the contract other than initialize.
Methods
Every nano contract has two types of methods: public and private.

Public methods are those that can only be called by a validated transaction on the blockchain and are the only ones that can change the state of a contract. Thus, the set of all public methods is composed of the initialize method plus all the contract execution methods.

Private methods, on the other hand, are not called from transactions and do not alter the contract's state. We do not need to worry about ensuring that private methods are not called from transactions. Hathor protocol ensures this for us. Private methods are called during contract execution or when users query a full node to obtain information not readily available in the contract's state.

Interactions of swap contracts
Now, let's see how all this applies to modeling the contract interactions in our swap blueprint.

Regarding contract creation — as with every blueprint — we will need to implement the public method initialize.

Regarding execution, our contracts will offer only one functionality to users — executing swaps. For this, we need to implement a single public method, which we will call swap.

Regarding readings, as already mentioned, the full node itself is responsible for providing users with the state and transaction history of a contract. Occasionally, a user may need information about a contract that is not directly saved in its state but can be computed — by one of its private methods — from it. In this case, the full node will call the private method to compute the information requested by the user.

Initially, it will not be necessary to implement any private methods in our blueprint with the specific purpose of providing information to users. At the end of the next section, after we model the state of our contract, we will be able to confirm this statement.

In summary, we define that our swap blueprint will have two public methods:

initialize, common to all blueprints, for creating our swap contracts; and
swap, for executing token swaps.
Step 3: model contract state
To model the state of a swap contract, we need to understand what comprises the state of a nano contract.

Contract state
Every contract has a state comprised of its attributes and its multi-token balance.

Attributes originate from the blueprint, meaning they are defined in the blueprint's code and its values can be changed during the successful execution of one of the blueprint's public methods.

The multi-token balance denotes the amount of each token held in custody by the contract. Unlike attributes, it does not originate from the blueprint meaning it is not defined in the blueprint's code and (its values) cannot be changed by the blueprint's methods.

Instead, the balance of a contract is only changed by Hathor protocol, through the execution of all deposit and withdrawal actions contained in a transaction whose public method call was successfully executed (whether for creation or execution of the contract). Otherwise, if the method call returns an exception, the transaction is marked as voided and the deposits and withdrawals are not processed.

Swap contracts state
For our swap contracts, we need the contract state to store the following information:

which are the only two tokens with which the contract operates; and
what the conversion ratio between the tokens is.
Let's model the attributes of our swap blueprint accordingly:

token_a identifies the first token with which the contract operates.
token_b identifies the second token with which the contract operates.
multiplier_a and multiplier_b together define the conversion ratio between the tokens.
Note that the values of these attributes are set during the contract's creation and remain unchanged thereafter. To demonstrate and test the change in the contract's state after each successful execution (and the absense of change after an execution failure), let's also add the attribute swaps_counter, which should count how many swaps the contract has performed over its lifetime.

Thus, the state of each swap contract created from our blueprint will be composed of the value of:

Its five attributes:
token_a
token_b
multiplier_a
multiplier_b
swaps_counter
The balance of its tokens
Furthermore, we conclude that there is no information that users need about the contract that is not already saved in its state. Therefore, it will not be necessary to implement private methods for user queries.

Step 4: model contract creation
To model the creation of swap contracts, we need to understand how nano contracts are created on Hathor platform.

Contract creation transaction
To create a nano contract on Hathor platform, a user should submit an NC transaction to the network such that:

nc_id identifies the blueprint from which the contract should be instantiated;
nc_method calls the initialize method;
nc_args sends a set of arguments as defined in this blueprint's specific initialize implementation to initialize the contract attributes; and
inputs and outputs: if necessary, one or more deposits to initialize the contract's multi-token balance.
Once our swap blueprint is added to Hathor platform, it will have its own nc_id and can be used to instantiate swap contracts. Also, note that in Hathor, the set of inputs and outputs of an NC transaction is 'translated' as a set of deposits and withdrawals to be made to/from the contract.

Creating a swap contract
To create a swap contract, a user should submit an NC transaction to the network in which:

nc_id references the swap blueprint;
nc_method calls initialize;
nc_args is the set of arguments that will define the swap contract — i.e., four positive integers for values of token_a, token_b, multiplier_a, and multiplier_b; and
inputs and outputs must consolidate as deposits of the two tokens with which the contract will operate (token_a and token_b).
For example, suppose a user wants to create a contract to perform swaps between tokens A and B, with a conversion ratio of 2 tokens A for every 1 token B; and wishes to initially load this contract with two initial deposits of 200 tokens A and 100 tokens B. For this, they will need to submit the following NC transaction to the network:

nc_id: identifier with which the swap blueprint is identified on Hathor platform;
nc_method: initialize;
nc_args: 'token_a'='<token_A_UID>', 'token_b'='<token_B_UID>', 'multiplier_a'=2, 'multiplier_b'=1; and
inputs and outputs: consolidating two deposits of 200 tokens A and 100 tokens B.
NC transaction processing
To design our blueprint, it is essential that we understand how NC transactions are processed on Hathor Network — namely, by each full node. When a full node receives an NC transaction, it performs the usual checks common to all transaction types. If it passes these checks, specific checks for NC transactions are then performed:

Validating nc_id: nc_id must reference an existing blueprint on Hathor platform, or an on-chain registered contract. Otherwise, the transaction is considered invalid and discarded.
Validating the called method: if nc_id references a blueprint, it must call the initialize method. If nc_id references a contract, it must call a public method that exists in the nano contract other than initialize. Otherwise, the transaction is considered invalid and discarded.
Validating withdrawals: as mentioned earlier, the consolidation between inputs and outputs is 'translated' as requests for deposits and withdrawals from the contract. The protocol will check whether the contract has funds to carry out the withdrawal. If the withdrawal request exceeds the contract's funds, the transaction is considered invalid and discarded.
If it fails any of the validations performed by Hathor protocol, the nano contract will not even be invoked. Note that the protocol never checks nc_args nor deposits. These are only evaluated by the blueprint method once called.

initialize method run
Returning to our example, assuming the NC transaction passes all the protocol's checks, the public method initialize of the swap blueprint will be called. The logic of initialize implemented by us, swap blueprint developers, should perform the following checks:

Validating the arguments: must validate whether the set of arguments passed accurately denote two distinct and valid tokens on the blockchain; and two positive integers to compose the conversion ratio.
Validating the deposits: must validate if there are exactly two deposits being made, one for each of the two distinct tokens from the previous validation.
As the NC transaction in our example is valid, the initialize method will propose the creation of an initial state for the new contract to be created, and should return nothing (None). Upon returning None, Hathor protocol understands that the method executed successfully, and finally performs the following actions:

The NC transaction is marked as "success", and all withdrawals and deposits contained therein are carried out.
Registers a new swap contract on the blockchain, whose nc_id is the identifier of the NC transaction, the attribute values were defined during the execution of initialize, and the balance was defined by the withdrawals and deposits.
We will then have the following contract registered on the blockchain:

nc_id: identifier of the transaction that called the creation of the contract.
blueprint: nc_id that identifies the swap blueprint on Hathor platform.
And this contract was created with the following initial state:

Balance:
<token_A_UID>: 200
<token_B_UID>: 100
Attributes:
token_a: <token_A_UID>
token_b: <token_B_UID>
multiplier_a: 2
multiplier_b: 1
swaps_counter: 0
Step 5: model contract execution
To model the execution of swap contracts, we need to understand how nano contracts are executed on Hathor.

Contract execution transaction
To execute a nano contract on Hathor platform, a user should submit an NC transaction to the network such that:

nc_id identifies the nano contract (registered on chain) to be executed;
nc_method calls a public method of the contract other than initialize;
nc_args sends a set of arguments as defined in the blueprint's implementation for the called public method;
inputs and outputs: if necessary, should consolidate the set of deposits and withdrawals to be made to/from the contract.
Executing a swap contract
In the case of our swap contracts, as we defined in step 2, the only reason a user has to execute it, is to utilize the swap functionality. For this, they must submit an NC transaction to the network in which:

nc_id references a swap contract;
nc_method calls swap;
nc_args will be an empty array, as the inputs and outputs are sufficient to fully describe the token swap we want to make; and
inputs and outputs must consolidate as a deposit of tokens A and a withdrawal of tokens B, or vice versa.
It's this deposit and withdrawal that together describe the conversion of tokens. That is: the user deposits tokens in the proportion they want to swap with the contract and withdraws the proportional amount of the other token.

For example, suppose a user wants to utilize the swap contract created in the previous step to perform the following swap: they want to convert 20 tokens A for 10 tokens B. For this, they will need to submit to the network the following NC transaction:

nc_id: identifier with which the swap contract we created in the previous step is identified on the blockchain;
nc_method: swap;
nc_args: none; and
inputs and outputs: consolidating a deposit of 20 tokens A and a withdrawal of 10 tokens B.
As explained in the previous step, once this transaction is submitted to the network, Hathor protocol will perform the common validations for all transactions and then the specific ones for NC transactions:

Confirm that nc_id references a contract registered on chain — i.e., identifies an NC transaction that created a nano contract.
Confirm that the called swap method exists in the swap blueprint which the contract references.
Confirm that the contract's balance has sufficient funds to perform a withdrawal of 10 tokens B.
In the contract creation example from the previous step, we initialized the contract with 100 tokens B. Thus, our example of NC transaction from this step will pass all three validations, and therefore the swap method of the contract will be invoked.

swap method run
The public swap method will verify if the set of deposits and withdrawals proposed by the user in their transaction complies with the business logic defined in the contract. In our example, the contract will need to ensure that this set of deposits and withdrawals denotes:

an exclusive conversion between tokens A and B; and
the proportion of the token swap proposed by the user matches the ratio defined in the contract.
In our example, the conversion of 20 tokens A for 10 tokens B requested by the user meets the contract's business rules and will therefore pass all the validations.

As the NC transaction in our example passes all these validations, the swap method will update the swaps_counter, and will return None, indicating that the contract execution was a "success". Thus:

The NC transaction will be added to the blockchain marked as "success", and the defined deposit and withdrawal will be executed — that is, the user's wallet sends 20 tokens A to the contract, and the contract sends 10 tokens B to user's wallet.
The contract will have its state updated. In this case, the swaps_counter and its balance of tokens A and B.
Thus, the new state of the contract (created in the previous step) will be:

Balance:
<token_A_UID>: 220
<token_B_UID>: 90
Attributes:
token_a: <token_A_UID>
token_b: <token_B_UID>
multiplier_a: 2
multiplier_b: 1
swaps_counter: 1
Step 6: model execution failures
To finish designing the business logic of our swap contracts, we need to understand what happens during the execution of a nano contract.

Business logic of contract executions
When a user creates an NC transaction to execute a nano contract — calling one of its public methods other than initialize — what will occur during the method's execution is:

Update of the contract's attributes.
Authorization of the set of deposits and withdrawals that the user requested (in the NC transaction), considering the passed arguments and the current state of the contract.
For example, in the case of our swap contracts, what the public method swap does is:

Check if the swap request made by the user follows the established business rules.
Update the swap_counter attribute.
Return an exception to indicate that the execution failed or return nothing (None) to indicate that the execution was successful.
Swap execution failures
Finally, we must model the cases in which the execution of the contract (swap method call) should fail. The execution of the swap method should raise an exception in the following scenarios:

Attempt to deposit or withdraw without a counterpart.
Attempt to swap involving a token that the contract does not operate with.
Attempt to swap involving an incorrect conversion ratio.
An attempt to deposit or withdraw without a counterpart (1) means that a user tried to perform an operation that does not characterize a token swap. To be characterized as a swap, the operation must have exactly one deposit and one withdrawal — that is, the user provides something to the contract and receives something in return. It cannot be any different. There cannot be either more or fewer deposits and withdrawals than this. Here are five different examples of requests that the contract should check and consider invalid:

Deposit of 10 tokens A.
Withdrawal of 10 tokens B.
Deposit of 10 tokens A and deposit of 10 tokens B.
Withdrawal of 20 tokens A and withdrawal of 20 tokens B.
Deposit of 20 tokens A, withdrawal of 10 tokens A, and deposit of 30 tokens C.
An attempt to swap involving a token that the contract does not operate with (2) means that a user tried to perform a swap operation where at least one token is different from the two defined at contract creation, which in our case are tokens A and B. Here are four different examples of requests that the contract should check and consider invalid:

Deposit of 20 tokens C and withdrawal of 10 tokens B.
Deposit of 10 tokens C and withdrawal of 10 tokens A.
Deposit of 2 tokens A and withdrawal of 1 token C.
Deposit of 1 tokens B and withdrawal of 3 tokens C.
An attempt to swap involving an incorrect conversion ratio (3) means that a user tried to perform a swap operation where the conversion ratio is different from the one defined at the creation of the contract, which in our case is 2:1 between tokens A and B. Here are two different examples of requests that the contract should check and consider invalid:

Deposit of 20 tokens A and withdrawal of 30 tokens B.
Deposit of 20 tokens B and withdrawal of 20 tokens A.
note
Note that in our design, we have modeled that even in situations where the contract does not (theoretically) lose anything, the contract should fail execution; for example, when a user tries to make a deposit to the contract without receiving anything in return, or when they attempt a swap where they are depositing more tokens to the contract than necessary.

Example of swap contract failure
After modeling all cases where contract execution should fail, let's understand how this happens. To do this, let's look in detail at an example of a user request that should fail. More specifically, let's detail the second example of an "incorrect conversion ratio".

A user wants to use the swap contract to convert 20 of their tokens B for 20 tokens A from the contract. To do this, they submit the following NC transaction to the network:

nc_id: identifier with which the swap contract we created in step 4 is identified on chain;
nc_method: swap;
nc_args: none; and
inputs and outputs: consolidating a deposit of 20 tokens B and a withdrawal of 20 tokens A.
During the validation of this NC transaction, Hathor protocol verifies that:

nc_id references an on-chain registered nano contract.
nc_method references a public method of this contract.
Finally, it will verify if the contract has sufficient funds for the requested withdrawals from the transaction. In this case, a withdrawal of 20 tokens A.
The current state of our swap contract, as it was after the execution of our valid swap example, is:

Balance:
<token_A_UID>: 220
<token_B_UID>: 90
Attributes:
token_a: <token_A_UID>
token_b: <token_B_UID>
multiplier_a: 2
multiplier_b: 1
swaps_counter: 1
Therefore, it indeed has sufficient funds for a withdrawal of 20 tokens A. So, Hathor protocol validates the transaction and invokes the contract's swap method. The swap method of the contract performs the following checks:

Does the user's request characterize a swap operation?
Is the request for the two tokens (A and B) that the contract operates with?
Does the request respect the conversion ratio imposed by the contract?
Since the transaction involves exactly one deposit and one withdrawal, the request characterizes a valid swap operation (1). The request involves exactly the two tokens that the contract operates with (2). Finally, there's the conversion ratio check. The conversion ratio defined in the contract's business rules at the time of its creation specifies that 1 token B should always be converted to 2 tokens A. However, in the user's request, they want to deposit and withdraw 20 of each token. As a result, when performing the third check (3), the swap method will raise an exception that will be returned to Hathor protocol, indicating that the contract execution resulted in "failure."

Thus, Hathor protocol will add the NC transaction to the blockchain but mark the contract execution as "failure," and all the inputs and outputs (comprising the user request) are "voided." This means that:

The contract was executed, and the user's request was not authorized (by the contract).
None of the deposits and withdrawals are performed.
The contract's state is not altered.
Task completed
With this, we conclude part 1 of our tutorial, in which we conceived and designed the swap blueprint. Proceed to part 2, where we will implement (code) and test it.

We recommend keeping this page open in a separate tab in your web browser for reference while working through part 2 of the tutorial.

Key takeaway
Throughout part 1 of this tutorial, while designing the swap blueprint, we explained several principles of how nano contracts work. A common point of confusion involves how deposits and withdrawals are made in contracts. In conventional smart contracts (e.g., in Ethereum), a contract can create a token transfer to a specific address. In contrast, on Hathor, all fund transfers — namely, deposits and withdrawals to/from a contract — that result from executing a nano contract must be specified in the transaction that called it. This is an essential point for developers to consider when designing blueprints.

What's next?
Blueprint development — nano contracts flow: to consult while designing a blueprint.
Blueprint development — guidelines: main guidelines to consult while developing a blueprint.
Develop a blueprint — part 2: hands-on tutorial to assist developers to implement and test a blueprint.
Set up a localnet: for integration testing of blueprints, nano contracts, and DApps.