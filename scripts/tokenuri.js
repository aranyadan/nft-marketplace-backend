const { ethers, network } = require("hardhat")

const TOKEN_ID = "4"

async function tokenuri() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const response = await basicNft.tokenURI(TOKEN_ID)

    console.log(`TokenURI: ${response}`)
}

tokenuri()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
