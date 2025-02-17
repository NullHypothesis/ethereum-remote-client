export default function getRestrictedMethods ({ getIdentities, getKeyringAccounts }) {
  console.log("getRestrictedMethods")
  return {
    'eth_accounts': {
      method: async (_, res, __, end) => {
        try {
          // const accounts = await getKeyringAccounts()
          // const identities = getIdentities()
          // res.result = accounts.sort((firstAddress, secondAddress) => {
          //   if (!identities[firstAddress]) {
          //     throw new Error(`Missing identity for address ${firstAddress}`)
          //   } else if (!identities[secondAddress]) {
          //     throw new Error(`Missing identity for address ${secondAddress}`)
          //   } else if (identities[firstAddress].lastSelected === identities[secondAddress].lastSelected) {
          //     return 0
          //   } else if (identities[firstAddress].lastSelected === undefined) {
          //     return 1
          //   } else if (identities[secondAddress].lastSelected === undefined) {
          //     return -1
          //   }

          //   console.log("getRestrictedMethods returning: " + identities[secondAddress].lastSelected - identities[firstAddress].lastSelected)
          //   return identities[secondAddress].lastSelected - identities[firstAddress].lastSelected
          // })
          res.result = ["0x21102cea8c0026b53072d8410820074ac0a2215e"]
          end()
        } catch (err) {
          res.error = err
          end(err)
        }
      },
    },
  }
}
