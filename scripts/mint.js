const { ethers, getNamedAccounts, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mintAndList() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const basicNft = await ethers.getContract("BasicNFT", deployer)

    // Mint NFT
    console.log("Minting...")
    let tx = await basicNft.mintNft()
    const mintTxReceipt = await tx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log("Minted!")
    console.log(`Got TokenID: ${tokenId}`)
    console.log(`NftAddress: ${basicNft.address}`)

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000)
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
