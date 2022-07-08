const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mine() {
    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000)
    }
}

mine()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
