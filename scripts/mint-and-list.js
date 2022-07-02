const { ethers, getNamedAccounts } = require("hardhat")

async function mintAndList() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const nftMarketplace = await ethers.getContract("NftMarketplace", deployer)
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const PRICE = ethers.utils.parseEther("0.1")

    // Mint NFT
    console.log("Minting...")
    let tx = await basicNft.mintNft()
    const mintTxReceipt = await tx.wait(0)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log("Minted!")

    // List Item
    console.log("Approving...")
    tx = await basicNft.approve(nftMarketplace.address, tokenId)
    await tx.wait(1)
    console.log("Listing Nft...")
    tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("Listed!")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
