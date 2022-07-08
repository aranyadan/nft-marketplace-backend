const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = "4"

async function buy() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[1]
    const nftMarketPlace = await ethers.getContract("NftMarketplace", deployer)
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const tx = await nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, {
        value: (
            await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
        ).price.toString(),
    })
    await tx.wait(1)
    console.log("NFT Bought!")

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000)
    }
}

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
