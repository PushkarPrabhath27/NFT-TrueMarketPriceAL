# Nano Contract creation

In order to create a contract on Hathor Network, you first need a blueprint. These are the steps:
1. Create blueprint;
2. Create contract from blueprint;

The first step may be skipped if there's an existing blueprint on the network that you can use.

## Create blueprint

Creating a blueprint means submitting a transaction to the network with the blueprint code. You can do this on this website: [Hathor Hackathon Blueprint Submitter](https://blueprint-creator.hackathon.hathor.network/).

Note that all blueprints submitted should have the `__blueprint__` marker at the end of the file. Take a look at the [SwapDemo](https://explorer.hackaton.hathor.network/blueprint/detail/000001624120d1a0271d823d8f05117f85edb24715259cad32837e34f5db7e7a) blueprint already available on the network. The last line is `__blueprint__ = SwapDemo`.

Once you submit the blueprint and everything goes well, you will have the blueprint id. On the SwapDemo example, that's `000001624120d1a0271d823d8f05117f85edb24715259cad32837e34f5db7e7a`.

## Create contract

With the blueprint id, we can create the contract. We will use the Desktop wallet for this example. You can also use the headless wallet with [this API](https://docs.hathor.network/references/headless-wallet/http-api/nano-create).

Make sure your wallet is connected to the Hackathon testnet. Go to the wallet settings and click Change network. On the dropdown, select Custom network:
- Fullnode: https://node1.hackaton.hathor.network/v1a/
- Tx Mining Server: https://txmining.hackaton.hathor.network
- Explorer: https://explorer.hackaton.hathor.network
- Explorer-Service: https://explorer-service.hackaton.hathor.network
- Pin: your wallet pin

If you need HTR tokens on the hackathon testnet, you have a [faucet](https://faucet.hackathon.hathor.network/).Copy

Delete

ok idk why the errors persists

so i nee dyou to do all the making of nano contracts from the very start even redo the blueprint redo every single thing that can cause this void error

so lets start everything from scratch again take these for references blueprint_part1.md BlueprintGuidelines.md blueprint_part2.md createcontract.md

and after doing it give me a very detailed guide on what to do

We will create a SwapDemo contract to allow users to trade HTR with [TestCoin (TTC)](https://explorer.hackaton.hathor.network/token_detail/000002fbeedfeb373dd8e4021be0c4fa45029a2a1aa340f5d5c431cdcf086ee5).

On the desktop wallet, go to Nano Contracts -> Create a nano contract:
<img width="1091" alt="image" src="https://gist.github.com/user-attachments/assets/5bcaa4bc-2f7f-45f5-a2dd-9bc3614b2ebf" />

We will input the SwapDemo blueprint id on the next screen: `000001624120d1a0271d823d8f05117f85edb24715259cad32837e34f5db7e7a`. It then pulls all the blueprint information and we can click confirm. 

The next screen will present the expected arguments for the blueprint's `initialize` method. The first one, Address to sign, is any address from the wallet. We recommend using the one with index 0. You can quickly fill it using the "Select from a list" option.

Next, we select tokens HTR and TTC as the tokens, and both multipliers as 1. This means that 1 HTR = 1 TTC. Finally, we will also deposit tokens on the contract so it has a balance to perform the swaps. We add two Deposit actions, one for HTR and another for TTC. Note: you need to have the tokens registered on your wallet to use them here.

<img width="1033" alt="image" src="https://gist.github.com/user-attachments/assets/dcd602f3-5e7f-4a53-b11f-10484906769b" />

Next, we select tokens HTR and TTC as the tokens, and both multipliers as 1. This means that 1 HTR = 1 TTC. Finally, we will also deposit tokens on the contract so it has a balance to perform the swaps. We add two Deposit actions, one for HTR and another for TTC.

We can click create and our contract will be deployed. Here's an example: https://explorer.hackaton.hathor.network/transaction/0000007725b0d899c684037dfd7490924235b7ec177cb7ba0256cb18c661a434.

## Test contract

We can test the contract directly from the desktop wallet. Here's a quick video showing how to use the swap method from the contract:
https://gist.github.com/user-attachments/assets/9600e490-7cc7-4b19-96e0-ab11cbc30ace

All done! If you want to learn more about Nano Contracts, check out our [cheatsheet](https://gist.github.com/obiyankenobi/5022f8725f49537c0dfe3db1d5097080) and our [documentation website](https://docs.hathor.network/).