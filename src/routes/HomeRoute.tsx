import React from 'react'
import { Box, Button } from '~/style'
import { ethers } from 'ethers'

import { sequence } from '0xsequence'

import { ETHAuth, Proof } from '@0xsequence/ethauth'
import { ERC_20_ABI } from '~/utils/abi'
import { sequenceContext } from '@0xsequence/network'

import { configureLogger, TypedData } from '@0xsequence/utils'
import { ExchangeContract__factory } from '~/ExchangeContract__factory'
import { hexConcat } from '@ethersproject/bytes'
configureLogger({ logLevel: 'DEBUG' })

const HomeRoute = () => {

  const network = 'polygon'
  const wallet = new sequence.Wallet(network)

  // NOTE: to use mumbai, first go to https://sequence.app and click on "Enable Testnet".
  // As well, make sure to comment out any other `const wallet = ..` statements.
  // const network = 'mumbai'
  // const wallet = new sequence.Wallet(network)

  // Example of changing the walletAppURL
  // const wallet = new sequence.Wallet(network, { walletAppURL: 'https://sequence.app' })

  wallet.on('message', (message) => {
    console.log('wallet event (message):', message)
  })

  wallet.on('accountsChanged', p => {
    console.log('wallet event (accountsChanged):', p)
  })

  wallet.on('chainChanged', p => {
    console.log('wallet event (chainChanged):', p)
  })

  wallet.on('connect', p => {
    console.log('wallet event (connect):', p)
  })

  wallet.on('disconnect', p => {
    console.log('wallet event (disconnect):', p)
  })

  wallet.on('open', p => {
    console.log('wallet event (open):', p)
  })

  wallet.on('close', p => {
    console.log('wallet event (close):', p)
  })

  const connect = async (authorize: boolean = false) => {
    const connectDetails = await wallet.connect({
      app: 'Demo Dapp',
      authorize
      // keepWalletOpened: true
    })

    console.warn('connectDetails', { connectDetails })

    if (authorize) {
      const ethAuth = new ETHAuth()

      const decodedProof = await ethAuth.decodeProof(connectDetails.proof.proofString, true)

      console.warn({ decodedProof })

      const isValid = await wallet.commands.isValidTypedDataSignature(
        await wallet.getAddress(),
        connectDetails.proof.typedData,
        decodedProof.signature,
        await wallet.getAuthChainId()
      )
      console.log('isValid?', isValid)
      if (!isValid) throw new Error('sig invalid')
    }

    // wallet.closeWallet()
  }

  const disconnect = () => {
    wallet.disconnect()
  }

  const openWallet = () => {
    wallet.openWallet()
  }

  const closeWallet = () => {
    wallet.closeWallet()
  }

  const isConnected = async () => {
    console.log('isConnected?', wallet.isConnected())
  }

  const isOpened = async () => {
    console.log('isOpened?', wallet.isOpened())
  }

  const getDefaultChainID = async () => {
    console.log('TODO')
  }

  const getAuthChainID = async () => {
    console.log('TODO')
  }

  const getChainID = async () => {
    console.log('chainId:', await wallet.getChainId())

    const provider = wallet.getProvider()
    console.log('provider.getChainId()', await provider.getChainId())

    const signer = wallet.getSigner()
    console.log('signer.getChainId()', await signer.getChainId())
  }

  const getAccounts = async () => {
    console.log('getAddress():', await wallet.getAddress())

    const provider = wallet.getProvider()
    console.log('accounts:', await provider.listAccounts())
  }

  const getBalance = async () => {
    const provider = wallet.getProvider()
    const account = await wallet.getAddress()
    const balanceChk1 = await provider.getBalance(account)
    console.log('balance check 1', balanceChk1.toString())

    const signer = wallet.getSigner()
    const balanceChk2 = await signer.getBalance()
    console.log('balance check 2', balanceChk2.toString())
  }

  const getWalletState = async () => {
    // TODO: review ..
    console.log('wallet state:', await wallet.getSigner().getWalletState())
  }

  const getNetworks = async () => {
    console.log('networks:', await wallet.getNetworks())
  }

  const signMessage = async () => {
    console.log('signing message...')
    const signer = wallet.getSigner()

    const message = `Two roads diverged in a yellow wood,
Robert Frost poet

And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`

    // sign
    const sig = await signer.signMessage(message)
    console.log('signature:', sig)

    // validate
    const isValid = await wallet.commands.isValidMessageSignature(
      await wallet.getAddress(),
      message,
      sig,
      await signer.getChainId()
    )
    console.log('isValid?', isValid)
    if (!isValid) throw new Error('sig invalid')

    // recover
    const walletConfig = await wallet.commands.recoverWalletConfigFromMessage(
      await wallet.getAddress(),
      message,
      sig,
      await signer.getChainId(),
      sequenceContext
    )
    console.log('recovered walletConfig:', walletConfig)
    const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    if (!match) throw new Error('recovery address does not match')
    console.log('address match?', match)
  }

  const signAuthMessage = async () => {
    console.log('signing message on AuthChain...')
    const signer = await wallet.getAuthSigner()

    const message = 'Hi there! Please sign this message, 123456789, thanks.'

    // sign
    const sig = await signer.signMessage(message, await signer.getChainId())//, false)
    console.log('signature:', sig)

    // here we have sig from above method, on defaultChain ..
    const notExpecting = '0x0002000134ab8771a3f2f7556dab62622ce62224d898175eddfdd50c14127c5a2bb0c8703b3b3aadc3fa6a63dd2dc66107520bc90031c015aaa4bf381f6d88d9797e9b9f1c02010144a0c1cbe7b29d97059dba8bbfcab2405dfb8420000145693d051135be70f588948aeaa043bd3ac92d98057e4a2c0fbd0f7289e028f828a31c62051f0d5fb96768c635a16eacc325d9e537ca5c8c5d2635b8de14ebce1c02'
    if (sig === notExpecting) {
      throw new Error('this sig is from the DefaultChain, not what we expected..')
    }

    // validate
    const isValid = await wallet.commands.isValidMessageSignature(
      await wallet.getAddress(),
      message,
      sig,
      await signer.getChainId()
    )
    console.log('isValid?', isValid)
    if (!isValid) throw new Error('sig invalid')

    console.log('is wallet deployed on mainnet?', await wallet.isDeployed('mainnet'))
    console.log('is wallet deployed on matic?', await wallet.isDeployed('matic'))

    // recover
    //
    // TODO: the recovery here will not work, because to use addressOf(), we must have
    // the init config for a wallet, wait for next index PR to come through then can fix this.
    //
    // TODO/NOTE: in order to recover this, the wallet needs to be updated on-chain,
    // or we need the init config.. check if its deployed and updated?
    // NOTE: this should work though, lets confirm it is deployed, and that the config is updated..
    const walletConfig = await wallet.commands.recoverWalletConfigFromMessage(
      await wallet.getAddress(),
      message,
      sig,
      await signer.getChainId()
    )

    const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    // if (!match) throw new Error('recovery address does not match')
    console.log('address match?', match)
  }

  const signTypedData = async () => {
    console.log('signing typedData...')

    const typedData: sequence.utils.TypedData = {
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: await wallet.getChainId(),
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
      },
      types: {
        'Person': [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" }
        ]
      },
      message: {
        'name': 'Bob',
        'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
      }
    }

    const signer = wallet.getSigner()

    const sig = await signer.signTypedData(typedData.domain, typedData.types, typedData.message)
    // const sig = await wallet.commands.signTypedData(typedData.domain, typedData.types, typedData.value)
    console.log('signature:', sig)

    // validate
    const isValid = await wallet.commands.isValidTypedDataSignature(
      await wallet.getAddress(),
      typedData,
      sig,
      await signer.getChainId()
    )
    console.log('isValid?', isValid)
    if (!isValid) throw new Error('sig invalid')

    // recover
    const walletConfig = await wallet.commands.recoverWalletConfigFromTypedData(
      await wallet.getAddress(),
      typedData,
      sig,
      await signer.getChainId()
    )
    console.log('recovered walletConfig:', walletConfig)

    const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    if (!match) throw new Error('recovery address does not match')
    console.log('address match?', match)
  }

  const signETHAuth = async () => {
    // wallet.logout()

    // debugger

    const address = await wallet.getAddress()

    const authSigner = await wallet.getAuthSigner()
    console.log('AUTH CHAINID..', await authSigner.getChainId())
    const authChainId = await authSigner.getChainId()

    const proof = new Proof()
    proof.address = address
    proof.claims.app = 'wee'
    proof.claims.ogn = 'http://localhost:4000'
    proof.setIssuedAtNow()
    proof.setExpiryIn(1000000)

    // TODO: chainId on this proof..?

    const messageTypedData = proof.messageTypedData()

    // wallet.commands.signAuthorization() , etc.. also easier..

    console.log('!messageTypedData BEFORE', messageTypedData)
    const digest = sequence.utils.encodeTypedDataDigest(messageTypedData)
    console.log('we expect digest:', digest)


    const sig = await authSigner.signTypedData(messageTypedData.domain, messageTypedData.types, messageTypedData.message)
    console.log('signature:', sig)

    wallet.closeWallet()

    // TODO: we could add isValidETHAuthSignature()
    // might make it easy so we dont think about the chainId ..?
    // on the .commands. .. could work.. helpful, ya

    console.log('!messageTypedData NOW.......', messageTypedData)
    const digest2 = sequence.utils.encodeTypedDataDigest(messageTypedData)
    console.log('DIGEST NOW........:', digest2)


    // validate
    const isValid = await wallet.commands.isValidTypedDataSignature(
      await wallet.getAddress(),
      messageTypedData,
      sig,
      authChainId
    )
    console.log('isValid?', isValid)
    if (!isValid) throw new Error('sig invalid')

    // recover
    // TODO/NOTE: in order to recover this, the wallet needs to be updated on-chain,
    // or we need the init config.. check if its deployed and updated?
    const walletConfig = await wallet.commands.recoverWalletConfigFromTypedData(
      await wallet.getAddress(),
      messageTypedData,
      sig,
      authChainId
    )

    console.log('recovered walletConfig:', walletConfig)
    const match = walletConfig.address.toLowerCase() === (await wallet.getAddress()).toLowerCase()
    // if (!match) throw new Error('recovery address does not match')
    console.log('address match?', match)
  }

  const sendETH = async (signer?: sequence.provider.Web3Signer) => {
    signer = signer || wallet.getSigner() // select DefaultChain signer by default

    console.log(`Transfer txn on ${signer.getChainId()} chainId......`)

    // NOTE: on mainnet, the balance will be of ETH value
    // and on matic, the balance will be of MATIC value
    // const balance = await signer.getBalance()
    // if (balance.eq(ethers.constants.Zero)) {
    //   const address = await signer.getAddress()
    //   throw new Error(`wallet ${address} has 0 balance, so cannot transfer anything. Deposit and try again.`)
    // }

    const toAddress = ethers.Wallet.createRandom().address

    const tx1: sequence.transactions.Transaction = {
      delegateCall: false,
      revertOnError: false,
      gasLimit: '0x55555',
      to: toAddress,
      value: ethers.utils.parseEther('1.234'),
      data: '0x'
    }

    const tx2: sequence.transactions.Transaction = {
      delegateCall: false,
      revertOnError: false,
      gasLimit: '0x55555',
      to: toAddress,
      value: ethers.utils.parseEther('0.4242'),
      data: '0x'
    }

    const provider = signer.provider

    console.log(`balance of ${toAddress}, before:`, await provider.getBalance(toAddress))

    const txnResp = await signer.sendTransactionBatch([tx1, tx2])
    await txnResp.wait()

    console.log(`balance of ${toAddress}, after:`, await provider.getBalance(toAddress))
  }

  const sendDAI = async (signer?: sequence.provider.Web3Signer) => {
    signer = signer || wallet.getSigner() // select DefaultChain signer by default

    const toAddress = ethers.Wallet.createRandom().address

    const amount = ethers.utils.parseUnits('5', 18)

    const daiContractAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' // (DAI address on Polygon)

    const tx: sequence.transactions.Transaction = {
      delegateCall: false,
      revertOnError: false,
      gasLimit: '0x55555',
      to: daiContractAddress,
      value: 0,
      data: new ethers.utils.Interface(ERC_20_ABI).encodeFunctionData('transfer', [toAddress, amount.toHexString()])
    }

    const txnResp = await signer.sendTransactionBatch([tx])
    await txnResp.wait()
  }

  const sendETHSidechain = async () => {
    // const signer = wallet.getSigner(137)
    // Select network that isn't the DefaultChain..
    const networks = await wallet.getNetworks()
    const n = networks.find(n => n.isAuthChain)
    sendETH(wallet.getSigner(n))
  }

  const send1155Tokens = async () => {
    console.log('TODO')
  }

  // const sendBatchTransaction = async () => {
  //   console.log('TODO')
  // }


  const signZeroXOrder = async () => {
    const opptAddr = prompt("Enter address of other wallet")
    if (!opptAddr) {
      return
    }
    console.log('signing 0x order...')
    const addr = await wallet.getAddress()

    const typedData: sequence.utils.TypedData = {
      domain: {
        name: "0x Protocol",
        version: "3.0.0",
        chainId: (137).toString(10),
        verifyingContract: "0x0C58C1170f1DEd633862A1166f52107490a9C594",
      },
      types: {
        Order: [
          { name: "makerAddress", type: "address" },
          { name: "takerAddress", type: "address" },
          { name: "feeRecipientAddress", type: "address" },
          { name: "senderAddress", type: "address" },
          { name: "makerAssetAmount", type: "uint256" },
          { name: "takerAssetAmount", type: "uint256" },
          { name: "makerFee", type: "uint256" },
          { name: "takerFee", type: "uint256" },
          { name: "expirationTimeSeconds", type: "uint256" },
          { name: "salt", type: "uint256" },
          { name: "makerAssetData", type: "bytes" },
          { name: "takerAssetData", type: "bytes" },
          { name: "makerFeeAssetData", type: "bytes" },
          { name: "takerFeeAssetData", type: "bytes" },
        ],
      },
      message: {
        makerAddress: addr,
        takerAddress: opptAddr,
        feeRecipientAddress: "0xbcc02a155c374263321155555ccf41070017649e",
        senderAddress: "0x0000000000000000000000000000000000000000",
        makerAssetAmount: "1",
        takerAssetAmount: "1",
        makerFee: "0",
        takerFee: "0",
        expirationTimeSeconds: "2524604400",
        salt: "115380666899310060419877138308806825568483898259101034972323470300764229119045",
        makerAssetData: "0x94cfcdd70000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000be41c134fc3517cb0ec94b6eeafb66cf9998782f00000000000000000000000000000000000000000000000000000000",
        takerAssetData: "0x94cfcdd70000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000aaa5b9e6c589642f98a1cda99b9d024b8407285a00000000000000000000000000000000000000000000000000000000",
        makerFeeAssetData: "0x",
        takerFeeAssetData: "0x"
      }
    }

    const signer = wallet.getSigner()

    const orderHash = sequence.utils.encodeTypedDataHash(typedData)
    console.log("Order hash", orderHash)

    const EIP1271DataAbi = [
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "makerAddress",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "takerAddress",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "feeRecipientAddress",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "senderAddress",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "makerAssetAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "takerAssetAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "makerFee",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "takerFee",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "expirationTimeSeconds",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "salt",
                "type": "uint256"
              },
              {
                "internalType": "bytes",
                "name": "makerAssetData",
                "type": "bytes"
              },
              {
                "internalType": "bytes",
                "name": "takerAssetData",
                "type": "bytes"
              },
              {
                "internalType": "bytes",
                "name": "makerFeeAssetData",
                "type": "bytes"
              },
              {
                "internalType": "bytes",
                "name": "takerFeeAssetData",
                "type": "bytes"
              }
            ],
            "internalType": "struct IEIP1271Data.Order",
            "name": "order",
            "type": "tuple"
          },
          {
            "internalType": "bytes32",
            "name": "orderHash",
            "type": "bytes32"
          }
        ],
        "name": "OrderWithHash",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      }
    ]

    const msg = new ethers.utils.Interface(EIP1271DataAbi).encodeFunctionData('OrderWithHash', [typedData.message, orderHash])
    console.log("0x sign msg", msg)

    console.log("message diggest", ethers.utils.hexlify(sequence.utils.encodeMessageDigest(msg)))

    const sig = await signer.signMessage(ethers.utils.arrayify(msg), 137)
    console.log('0x order signature:', sig)

    // validate
    const isValid = await wallet.commands.isValidMessageSignature(
      await wallet.getAddress(),
      ethers.utils.arrayify(msg),
      sig,
      await signer.getChainId()
    )
    console.log('isValid?', isValid)
    if (!isValid) throw new Error('sig invalid')

    console.log("Here is the signed order, copy it.")
    console.log(JSON.stringify({ ...typedData.message, signature: sig }))
  }

  interface Order {
    makerAddress: string;
    takerAddress: string;
    feeRecipientAddress: string;
    senderAddress: string;
    makerAssetAmount: string;
    takerAssetAmount: string;
    makerFee: string;
    takerFee: string;
    expirationTimeSeconds: string;
    salt: string;
    makerAssetData: string;
    takerAssetData: string;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
    signature?: string;
  }
  const normalizeOrder = (order: Order): Order => {
    return {
      makerAddress: order.makerAddress.toLowerCase(),
      takerAddress: order.takerAddress.toLowerCase(),
      feeRecipientAddress: order.feeRecipientAddress.toLowerCase(),
      senderAddress: order.senderAddress.toLowerCase(),
      makerAssetAmount: order.makerAssetAmount.toString(),
      takerAssetAmount: order.takerAssetAmount.toString(),
      makerFee: order.makerFee.toString(),
      takerFee: order.takerFee.toString(),
      expirationTimeSeconds: order.expirationTimeSeconds.toString(),
      salt: order.salt.toString(),
      makerAssetData: order.makerAssetData.toLowerCase(),
      takerAssetData: order.takerAssetData.toLowerCase(),
      makerFeeAssetData: order.makerFeeAssetData.toLowerCase(),
      takerFeeAssetData: order.takerFeeAssetData.toLowerCase(),
      signature: order.signature?.toLowerCase(),
    };
  };



  const submitSignedZeroXOrder = async () => {
    const signedOrderString = prompt('enter signed order string from other wallet');
    if (!signedOrderString) {
      return ''
    }
    const signedOrder = JSON.parse(signedOrderString)

    const exchangeContract = ExchangeContract__factory.connect(
      '0x0C58C1170f1DEd633862A1166f52107490a9C594',
      wallet.getSigner()
    );
    const transaction = await exchangeContract.fillOrKillOrder(
      normalizeOrder(signedOrder),
      signedOrder.takerAssetAmount,
      hexConcat([signedOrder.signature, '0x07'])
    );
    console.log("attempting fill order:", transaction)
    return transaction;
  }

  return (
    <Box sx={{
      width: '80%',
      textAlign: 'center',
      mx: 'auto',
      color: 'black',
      my: '50px'
    }}>
      <h1 style={{ color: 'white', marginBottom: '10px' }}>Demo Dapp ({network && network.length > 0 ? network : 'mainnet'})</h1>

      <p style={{ color: 'white', marginBottom: '14px', fontSize: '14px', fontStyle: 'italic' }}>Please open your browser dev inspector to view output of functions below</p>

      <p>
        <Button px={3} m={1} onClick={() => connect()}>Connect</Button>
        <Button px={3} m={1} onClick={() => connect(true)}>Connect & Auth</Button>
        <Button px={3} m={1} onClick={() => disconnect()}>Disconnect</Button>
        <Button px={3} m={1} onClick={() => openWallet()}>Open Wallet</Button>
        <Button px={3} m={1} onClick={() => closeWallet()}>Close Wallet</Button>
        <Button px={3} m={1} onClick={() => isConnected()}>Is Connected?</Button>
        <Button px={3} m={1} onClick={() => isOpened()}>Is Opened?</Button>
        <Button px={3} m={1} onClick={() => getDefaultChainID()}>DefaultChain?</Button>
        <Button px={3} m={1} onClick={() => getAuthChainID()}>AuthChain?</Button>
      </p>
      <br />
      <p>
        <Button px={3} m={1} onClick={() => getChainID()}>ChainID</Button>
        <Button px={3} m={1} onClick={() => getNetworks()}>Networks</Button>
        <Button px={3} m={1} onClick={() => getAccounts()}>Get Accounts</Button>
        <Button px={3} m={1} onClick={() => getBalance()}>Get Balance</Button>
        <Button px={3} m={1} onClick={() => getWalletState()}>Get Wallet State</Button>
      </p>
      <br />
      <p>
        <Button px={3} m={1} onClick={() => signMessage()}>Sign Message</Button>
        <Button px={3} m={1} onClick={() => signTypedData()}>Sign TypedData</Button>
        <Button px={3} m={1} onClick={() => signAuthMessage()}>Sign Message on AuthChain</Button>
        <Button px={3} m={1} onClick={() => signETHAuth()}>Sign ETHAuth</Button>
      </p>
      <br />
      <p>
        <Button px={3} m={1} onClick={() => sendETH()}>Send on DefaultChain</Button>
        <Button px={3} m={1} onClick={() => sendETHSidechain()}>Send on AuthChain</Button>
        <Button px={3} m={1} onClick={() => sendDAI()}>Send DAI</Button>
        <Button px={3} m={1} onClick={() => send1155Tokens()}>Send ERC-1155 Tokens</Button>
        {/* <Button px={3} m={1} onClick={() => sendBatchTransaction()}>Send Batch Txns</Button> */}
      </p>
      <h1>
        0x tests:
        <Button px={3} m={1} onClick={() => signZeroXOrder()}>Sign 0x Order</Button>
        <Button px={3} m={1} onClick={() => submitSignedZeroXOrder()}>Submit Signed 0x Order</Button>
      </h1>

    </Box>
  )
}

const erc1155Abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export default React.memo(HomeRoute)
