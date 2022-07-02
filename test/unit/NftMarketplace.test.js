const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

// describe blocks dont need async functions
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT MArketplace unit tests", function () {
          let deployer, buyer
          let basicNft, nftMarketplace
          const PRICE = ethers.utils.parseEther("1")
          const TOKEN_ID = 0
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              //   deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              buyer = accounts[1]
              //   buyer = (await getNamedAccounts()).buyer
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract(
                  "NftMarketplace",
                  deployer
              )
              basicNft = await ethers.getContract("BasicNFT", deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          describe("listItem", () => {
              it("listed price must be above zero", async () => {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, "0")
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })

              it("emits an event after listing an item", async () => {
                  expect(
                      await nftMarketplace.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.emit("ItemListed")
              })

              it("exclusively items that haven't been listed", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const error = `NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })

              it("exclusively allows owners to list", async () => {
                  const buyerMarketplace = nftMarketplace.connect(buyer)
                  await expect(
                      buyerMarketplace.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace__NotOwner()")
              })

              it("needs approval to list item", async () => {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(
                      "NftMarketplace__NotApprovedForMarketplace()"
                  )
              })

              it("updates listing with seller and price", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  assert.equal(listing.price.toString(), PRICE.toString())
                  assert.equal(listing.seller.toString(), deployer)
              })
          })

          describe("cancelListing", () => {
              it("reverts if there is no listing", async () => {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })

              it("reverts if non-owner tries to cancel", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const buyerMarketplace = await nftMarketplace.connect(buyer)
                  await expect(
                      buyerMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner()")
              })

              it("emits event and removes listing", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.emit("ItemCancelled")
                  assert.equal(
                      (
                          await nftMarketplace.getListing(
                              basicNft.address,
                              TOKEN_ID
                          )
                      ).price.toString(),
                      "0"
                  )
              })
          })

          describe("buyItem", () => {
              it("reverts if the item isn't listed", async () => {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("reverts if price isnt met", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const buyerMarket = nftMarketplace.connect(buyer)
                  await expect(
                      buyerMarket.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE.sub("1"),
                      })
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet")
              })

              it("transfers the nft to the buyer and updates internal proceeds record", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const buyerMarket = nftMarketplace.connect(buyer)
                  await buyerMarket.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  assert.equal(newOwner.toString(), buyer.address.toString())
                  assert.equal(
                      (await nftMarketplace.getProceeds(deployer)).toString(),
                      PRICE.toString()
                  )
              })
          })

          describe("updateListing", () => {
              it("must be owner and listed", async () => {
                  const buyerMarket = nftMarketplace.connect(buyer)
                  await expect(
                      buyerMarket.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).is.revertedWith("NftMarketplace__NotOwner")
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("updates the price of the item", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const newprice = PRICE.add("100")
                  await nftMarketplace.updateListing(
                      basicNft.address,
                      TOKEN_ID,
                      newprice
                  )
                  const updatedprice = (
                      await nftMarketplace.getListing(
                          basicNft.address,
                          TOKEN_ID
                      )
                  ).price.toString()
                  assert.equal(updatedprice, newprice.toString())
              })
          })

          describe("withdrawProceeds", () => {
              it("doesn't allow 0 proceed withdrawals", async () => {
                  await expect(
                      nftMarketplace.withdrawProceeds()
                  ).to.be.revertedWith("NftMarketplace__NoProceeds")
              })

              it("withdraws proceeds", async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const buyerMarket = nftMarketplace.connect(buyer)
                  await buyerMarket.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })

                  const proceedsBefore = await nftMarketplace.getProceeds(
                      deployer
                  )
                  const provider = await nftMarketplace.provider
                  const balanceBefore = await provider.getBalance(deployer)
                  const tx = await nftMarketplace.withdrawProceeds()
                  const txreceipt = await tx.wait(1)
                  const { gasUsed, effectiveGasPrice } = txreceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const balanceAfter = await provider.getBalance(deployer)
                  const proceedsAfter = await nftMarketplace.getProceeds(
                      deployer
                  )

                  assert.equal(proceedsAfter.toString(), "0")
                  assert.equal(
                      balanceAfter.toString(),
                      balanceBefore.sub(gasCost).add(proceedsBefore).toString()
                  )
              })
          })

          //   it("Lists and can be bought", async () => {
          //       let tx = await nftMarketplace.listItem(
          //           basicNft.address,
          //           TOKEN_ID,
          //           PRICE
          //       )
          //       await tx.wait(1)
          //       const buyerNftMarketplace = nftMarketplace.connect(buyer)
          //       tx = await buyerNftMarketplace.buyItem(
          //           basicNft.address,
          //           TOKEN_ID,
          //           { value: PRICE }
          //       )
          //       await tx.wait(1)
          //       const newOwner = await basicNft.ownerOf(TOKEN_ID)
          //       const deployerProceeds = await nftMarketplace.getProceeds(
          //           deployer
          //       )
          //       assert.equal(newOwner.toString(), buyer.address.toString())
          //       assert.equal(deployerProceeds.toString(), PRICE.toString())
          //   })
      })
