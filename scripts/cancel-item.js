const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = "2"

async function cancel() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const nftMarketPlace = await ethers.getContract("NftMarketplace", deployer)
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const tx = await nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
    await tx.wait(1)
    console.log("NFT Cancelled!")

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000)
    }
}

cancel()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
