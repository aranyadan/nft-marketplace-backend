const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "Rinkeby",
    },
    80001: {
        name: "Polygon Mumbai",
    },
    31337: {
        name: "hardhat",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
